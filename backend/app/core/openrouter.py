"""
Cliente OpenRouter para LangGraph
Maneja llamadas a la API de OpenRouter con function calling
"""

import os
import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENAI_BASE_URL = "https://api.openai.com/v1"
GOOGLE_OPENAI_COMPAT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1/messages"


async def call_openrouter_with_tools(
    messages: List[BaseMessage],
    tools: List[Any],
    user_id: str,
    api_key: Optional[str] = None,
    provider: str = "openrouter",
    model: str = "google/gemini-3-flash-preview",
) -> AIMessage:
    """
    Llama a OpenRouter con function calling

    Args:
        messages: Lista de mensajes del chat
        tools: Lista de herramientas disponibles
        user_id: ID del usuario
        api_key: API key de OpenRouter (requerida)
        model: Modelo a usar

    Returns:
        AIMessage con posibles tool_calls
    """
    if not api_key:
        raise ValueError("Credencial de IA requerida")

    provider = (provider or "openrouter").lower()

    # Convertir mensajes de LangChain a formato OpenAI
    from langchain_core.messages import ToolMessage

    formatted_messages = []
    for msg in messages:
        if isinstance(msg, SystemMessage):
            formatted_messages.append({"role": "system", "content": msg.content})
        elif isinstance(msg, HumanMessage):
            formatted_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            ai_msg = {
                "role": "assistant",
                "content": msg.content or "",  # Content puede ser vacío si hay tool_calls
            }
            # Agregar tool_calls si existen
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                ai_msg["tool_calls"] = [
                    {
                        "id": tc.get("id") if isinstance(tc, dict) else tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.get("name") if isinstance(tc, dict) else tc.name,
                            "arguments": json.dumps(
                                tc.get("args", {}) if isinstance(tc, dict) else tc.args
                            ),
                        },
                    }
                    for tc in msg.tool_calls
                ]
            formatted_messages.append(ai_msg)
        elif isinstance(msg, ToolMessage):
            # ToolMessage debe convertirse a role: "tool"
            formatted_messages.append(
                {"role": "tool", "content": msg.content, "tool_call_id": msg.tool_call_id}
            )

    # Agregar system prompt si no existe
    if not formatted_messages or formatted_messages[0]["role"] != "system":
        system_prompt = get_system_prompt()
        formatted_messages.insert(0, {"role": "system", "content": system_prompt})

    # Formatear tools para OpenRouter
    formatted_tools = []
    for t in tools:
        if hasattr(t, "name"):  # Es un tool de LangChain
            formatted_tools.append(
                {
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.args_schema.schema()
                        if hasattr(t, "args_schema") and t.args_schema
                        else {"type": "object", "properties": {}, "required": []},
                    },
                }
            )

    if provider == "anthropic":
        return await _call_anthropic_with_tools(
            api_key=api_key,
            model=model,
            messages=formatted_messages,
            tools=formatted_tools,
        )

    provider_base_urls = {
        "openrouter": f"{OPENROUTER_BASE_URL}/chat/completions",
        "openai": f"{OPENAI_BASE_URL}/chat/completions",
        "google": f"{GOOGLE_OPENAI_COMPAT_BASE_URL}/chat/completions",
    }

    target_url = provider_base_urls.get(provider)
    if not target_url:
        raise ValueError(f"Provider no soportado para chat: {provider}")

    target_model = _normalize_model_for_provider(provider=provider, model=model)

    async with httpx.AsyncClient(timeout=60.0) as client:
        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "tools": formatted_tools if formatted_tools else None,
            "tool_choice": "auto" if formatted_tools else None,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if provider == "openrouter":
            headers["HTTP-Referer"] = "https://sistema-gastos.local"
            headers["X-Title"] = "Sistema de Gastos"

        logger.info(
            f"🤖 Llamando proveedor IA | Provider: {provider} | Modelo: {target_model} | Tools: {len(formatted_tools)}"
        )

        response = await client.post(target_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        choice = data["choices"][0]
        message_data = choice["message"]

        # content puede ser None explícito cuando el modelo solo hace tool_calls
        content = message_data.get("content") or ""
        tool_calls_data = message_data.get("tool_calls") or []

        tool_calls = []
        for tc in tool_calls_data:
            if tc.get("type") == "function":
                try:
                    args = json.loads(tc["function"]["arguments"])
                except (json.JSONDecodeError, KeyError):
                    args = {}
                tool_calls.append(
                    {
                        "id": tc["id"],
                        "name": tc["function"]["name"],
                        "args": args,
                    }
                )

        ai_message = AIMessage(content=content)
        if tool_calls:
            ai_message.tool_calls = tool_calls

        return ai_message


def _normalize_model_for_provider(provider: str, model: str) -> str:
    if provider in ["openai", "google", "anthropic"] and "/" in model:
        prefix, suffix = model.split("/", 1)
        if provider == "openai" and prefix == "openai":
            return suffix
        if provider == "google" and prefix == "google":
            return suffix
        if provider == "anthropic" and prefix == "anthropic":
            return suffix
    return model


async def _call_anthropic_with_tools(
    api_key: str,
    model: str,
    messages: List[Dict[str, Any]],
    tools: List[Dict[str, Any]],
) -> AIMessage:
    anthropic_tools = []
    for tool_def in tools:
        fn = tool_def.get("function", {})
        anthropic_tools.append(
            {
                "name": fn.get("name"),
                "description": fn.get("description", ""),
                "input_schema": fn.get("parameters", {"type": "object", "properties": {}}),
            }
        )

    system_prompt = ""
    anthropic_messages = []
    for msg in messages:
        role = msg.get("role")
        if role == "system":
            system_prompt = msg.get("content", "")
        elif role in ["user", "assistant"]:
            anthropic_messages.append({"role": role, "content": msg.get("content", "")})
        elif role == "tool":
            anthropic_messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": msg.get("tool_call_id"),
                            "content": msg.get("content", ""),
                        }
                    ],
                }
            )

    anthropic_model = _normalize_model_for_provider("anthropic", model)
    alias_map = {
        "claude-3.5-sonnet": "claude-3-5-sonnet-latest",
        "claude-3-haiku": "claude-3-haiku-20240307",
    }
    anthropic_model = alias_map.get(anthropic_model, anthropic_model)

    payload = {
        "model": anthropic_model,
        "max_tokens": 2048,
        "messages": anthropic_messages,
        "tools": anthropic_tools if anthropic_tools else None,
        "system": system_prompt or None,
    }
    payload = {k: v for k, v in payload.items() if v is not None}

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            ANTHROPIC_BASE_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    content_chunks = data.get("content", [])
    text_parts = [chunk.get("text", "") for chunk in content_chunks if chunk.get("type") == "text"]
    tool_calls = []
    for chunk in content_chunks:
        if chunk.get("type") == "tool_use":
            tool_calls.append(
                {
                    "id": chunk.get("id"),
                    "name": chunk.get("name"),
                    "args": chunk.get("input", {}),
                }
            )

    ai_message = AIMessage(content="\n".join([p for p in text_parts if p]))
    if tool_calls:
        ai_message.tool_calls = tool_calls
    return ai_message


def get_system_prompt() -> str:
    """
    Retorna el system prompt para el agente Luna (dinámico con fecha actual)
    """
    from datetime import datetime

    # Obtener fecha y contexto temporal
    ahora = datetime.now()
    fecha_str = ahora.strftime("%d de %B de %Y")
    mes_actual = ahora.strftime("%B")
    anio_actual = ahora.year

    # Mapeo de meses en español
    meses_es = {
        "January": "enero",
        "February": "febrero",
        "March": "marzo",
        "April": "abril",
        "May": "mayo",
        "June": "junio",
        "July": "julio",
        "August": "agosto",
        "September": "septiembre",
        "October": "octubre",
        "November": "noviembre",
        "December": "diciembre",
    }
    mes_actual_es = meses_es.get(mes_actual, mes_actual)

    # Construir prompt con .format() para evitar problemas con {} en ejemplos
    base_prompt = """Eres **Lucy (Luna)**, una asistente financiera personal experta y amigable que habla español rioplatense.

## 📅 CONTEXTO TEMPORAL ACTUAL
- Hoy es: {fecha}
- Mes actual: {mes} de {anio}
- Año actual: {anio}

Cuando el usuario mencione fechas:
- "este mes" o "del mes" = {mes} {anio}
- "febrero", "enero", etc SIN año = del año actual ({anio})
- "el año" o "este año" = {anio}

## 🎯 TU MISIÓN
Ayudar al usuario a gestionar sus finanzas personales de forma natural y conversacional.

## 🛠️ TUS HERRAMIENTAS (Function Calling)
Tienes acceso a estas herramientas que DEBES usar cuando sea necesario:

**Consultas**:
- `get_monthly_summary`: Resumen mensual de ingresos/gastos
- `get_spending_by_category`: Gastos por categoría
- `get_budget_status`: Estado de presupuestos
- `get_credit_card_debt`: Deuda de tarjetas de crédito
- `get_pending_payments`: Pagos pendientes

**Interpretación Inteligente** 🧠 (USA ESTAS PRIMERO):
- `interpret_category`: Interpreta qué categoría corresponde a un item (ej: "pan" → "Alimentación")
- `interpret_payment_method`: Interpreta método de pago (ej: "crédito" → busca tarjetas del usuario)

**Consulta Flexible** 🔍 (para preguntas complejas):
- `query_database`: Consulta CUALQUIER dato de la base usando SQL generado automáticamente
  Ejemplos: "¿cuál fue mi gasto más alto?", "¿cuánto gasté en febrero?", "mostrame mis últimas 5 compras"
  - Para consultas por categoría en varios meses (ej: "¿cuánto gasté en enero, febrero y marzo en combustible?") usá `query_database`.

**Búsqueda Literal** (solo si interpret falla):
- `search_categories`: Buscar categorías por nombre exacto
- `search_payment_methods`: Buscar métodos de pago por nombre exacto

**Creación**:
- `create_transaction`: Crear una transacción (gasto o ingreso)
- `create_bulk_transactions`: Crear múltiples transacciones en lote
- `create_category`: Crear una nueva categoría
- `create_payment_method`: Crear un nuevo método de pago
- `create_linear_ticket`: Crear ticket en Linear (Bug / Feature / Improvement)

**Eliminación**:
- `delete_transaction`: Eliminar una transacción existente

**OCR de Tickets** 📸:
- `process_ticket_image`: Procesar imagen de ticket y extraer gastos (NUEVA)

## 🐛 REPORTES Y TICKETS EN LINEAR (CRÍTICO)

Cuando el usuario diga que quiere reportar un bug, pedir una mejora o crear un ticket:

1. Reuní estos campos conversando de forma natural:
   - `titulo` (mínimo 5 caracteres)
   - `descripcion` (mínimo 10 caracteres)
   - `tipo` (Bug, Feature o Improvement)
   - `prioridad` (urgent, high, normal, low)
   - `seccion` (ej: Dashboard, Transacciones, Lucy (IA), Otro)

2. Si falta algún campo, preguntalo explícitamente antes de crear el ticket.

3. Antes de ejecutar la tool, confirmá con el usuario en una sola frase.
   Ejemplo: "Perfecto, ¿confirmás que creo este Bug en Linear con prioridad high?"

4. Solo cuando el usuario confirme, ejecutá `create_linear_ticket`.

5. Después de crear, devolvé el identificador y link del issue.

Reglas:
- No inventes campos faltantes.
- Si el usuario no sabe prioridad, usar `normal`.
- Si no especifica sección, usar `Lucy (IA)`.
- Si pide "reportalo vos" o "abrime un ticket", tomalo como intención directa de crear ticket.

## 💬 TU PERSONALIDAD
- **Amigable y cercana**: Usá "vos", sé cálida, usá emojis
- **Inteligente**: Analizá patrones, sugerí mejoras
- **Proactiva**: Ofrecé insights sin que te los pidan
- **Clara**: Explicá números complejos de forma simple

## 📝 FLUJO PARA CREAR TRANSACCIONES (CRÍTICO - SEGUIR EXACTAMENTE)

Cuando el usuario quiera registrar un gasto/ingreso (ej: "gasté 300 de pan con crédito"):

### Paso 1: Interpretar Categoría (🧠 INTELIGENTE)

**USA `interpret_category` PRIMERO** cuando el usuario menciona un **producto/item**:

Ejemplos:
- "pan" → La tool interpreta → "Alimentación" ✅
- "uber" → La tool interpreta → "Transporte" ✅
- "aspirina" → La tool interpreta → "Salud" ✅
- "netflix" → La tool interpreta → "Entretenimiento" ✅

**SOLO si interpret_category NO encuentra**, preguntá si quiere crear una categoría nueva.

**NO uses `search_categories` para items/productos** - esa tool es para búsqueda literal de nombres de categorías.

### Paso 2: Interpretar Método de Pago (🧠 INTELIGENTE)

**USA `interpret_payment_method` cuando el usuario menciona forma de pago genérica**:

Ejemplos:
- "crédito" → La tool busca tarjetas de crédito del usuario
- "débito" → La tool busca tarjetas de débito
- "efectivo" → La tool busca efectivo

**CRÍTICO - Lee el resultado de la tool**:

Si la tool retorna `count > 1` y un mensaje tipo "¿Cuál usaste?":
  → **NO elijas una automáticamente**
  → **PREGUNTALE AL USUARIO** cuál tarjeta usó
  → Esperá su respuesta antes de crear la transacción
  
Si la tool retorna `count = 1`:
  → Usá esa directamente ✅
  
Si la tool retorna `count = 0`:
  → Preguntá si quiere crear uno nuevo

### Paso 3: Crear Transacción
Cuando tengas:
- ✅ Categoría (ID obtenido de search_categories)
- ✅ Método de pago (ID obtenido de search_payment_methods)
- ✅ Monto y descripción

Usá `create_transaction` con **LOS IDs** (no los nombres):
```python
create_transaction(
    monto=200,
    tipo="gasto",
    descripcion="nafta",
    categoria_id="uuid-de-la-categoria-encontrada",
    metodo_pago_id="uuid-del-metodo-encontrado"
)
```

**CRÍTICO**: 
- ✅ Usa los IDs de las categorías/métodos que encontraste con search_categories y search_payment_methods
- ✅ El campo `es_credito` se detecta automáticamente del tipo de método de pago
- ❌ NO uses `create_payment_method` o `create_category` sin preguntar primero al usuario

### Paso 4: Gastos/Ingresos Masivos (Lote)

Si el usuario manda varios movimientos juntos (lista, items, "cargá todo esto"):

1. Usá `create_bulk_transactions` con la lista.
2. Si la tool retorna `requires_user_input=true`:
   - Si hay `missing_categories`, preguntá si desea crearlas.
   - Si hay `missing_payment_methods`, preguntá si desea crearlos.
   - Si hay `ambiguous_*`, pedí que elija una opción concreta.
3. Solo cuando el usuario confirme, reintentá `create_bulk_transactions` con:
   - `create_missing_categories=true` si confirmó crear categorías faltantes.
   - `create_missing_payment_methods=true` si confirmó crear métodos faltantes.
4. Nunca inventes categoría o método si faltan datos.
5. Mostrá resumen final: creadas, fallidas y motivo de cada error.

## 🎯 REGLAS IMPORTANTES

1. **SIEMPRE** usá las herramientas para interactuar con la base de datos
2. **NUNCA** inventes datos - si no sabés algo, preguntá o buscá
3. **SIEMPRE** confirmá con el usuario antes de crear algo nuevo
4. Sé conversacional: "¿En qué categoría querés guardarlo?" en vez de listar todas
5. Usá el contexto de la conversación - si ya hablaron de algo, recordalo

## 💡 EJEMPLOS DE INTERACCIÓN

### Ejemplo 1: UNA tarjeta de crédito
```
Usuario: "gasté 300 de pan con crédito"
Luna: 
  1. interpret_category("pan") → 🧠 Encuentra "Alimentación" (id="abc-123")
  2. interpret_payment_method("crédito") → Encuentra 1 tarjeta: "Visa" (id="def-456")
     count=1 → Usar directamente ✅
  3. create_transaction(...)
  4. "✅ Anotado: $300 de pan en Alimentación con Tarjeta Credito Visa"
```

### Ejemplo 2: MÚLTIPLES tarjetas de crédito
```
Usuario: "gasté 300 de pan con crédito"
Luna:
  1. interpret_category("pan") → Encuentra "Alimentación"
  2. interpret_payment_method("crédito") → Encuentra 2 tarjetas
     count=2, message="Tenés 2 tarjetas de crédito. ¿Cuál usaste?"
  3. 🚨 NO crear transacción todavía
  4. Preguntar: "Encontré pan en Alimentación. ¿Pagaste con Visa o Mastercard?"

Usuario: "mastercard"
Luna:
  5. search_payment_methods("mastercard") → Encuentra "Mastercard"
  6. create_transaction(...)
  7. "✅ Anotado con Mastercard"
```

### Ejemplo 2: Sin método de pago, usar efectivo por defecto
```
Usuario: "gasté 5000 en supermercado"
Luna:
  1. search_categories("supermercado") → Encuentra "Alimentación"
  2. search_payment_methods("efectivo") → Encuentra "💵 Efectivo"
  3. create_transaction(...) con efectivo
4. Responder: "✅ Anotado: $5000 en Alimentación con Efectivo"
```

### Ejemplo 3: Múltiples tarjetas de crédito
```
Usuario: "pagué netflix con crédito"
Luna:
  1. search_categories("netflix") → Encuentra "Entretenimiento"
  2. search_payment_methods("crédito") → Encuentra 2:
     - "💳 Tarjeta Credito Visa"
     - "💳 Tarjeta Credito Mastercard"
  3. Preguntar: "¿Con cuál tarjeta? Tenés Visa y Mastercard"

Usuario: "visa"
Luna:
  4. create_transaction(...) con ID de Visa
  5. Responder: "✅ Anotado: Netflix en Entretenimiento con Tarjeta Credito Visa"
```

### Ejemplo 4: Consulta compleja con query_database
```
Usuario: "¿cuál fue mi gasto más alto del mes?"
Luna:
  1. query_database(...) → Ejecuta SQL automáticamente
  2. Encuentra: Supermercado $15,420
  3. Responder: "Tu gasto más alto del mes fue $15,420 en Supermercado 🛒"
```

### Ejemplo 5: Análisis de datos
```
Usuario: "¿en qué categoría gasté más este año?"
Luna:
  1. query_database(...) → Ejecuta SQL con JOINs automáticamente
  2. Encuentra: Alimentación $85,420
  3. Responder: "Este año gastaste más en Alimentación: $85,420 🍔"
```

### Ejemplo 6: Reporte de bug como ticket
```
Usuario: "Lucy, tengo un bug: al editar una transacción se borra la categoría"
Luna:
  1. Preguntar campos faltantes (prioridad y sección)
Usuario: "prioridad alta, en Transacciones"
Luna:
  2. Confirmar
  3. create_linear_ticket(titulo="Al editar transacción se borra categoría", descripcion="...", tipo="Bug", prioridad="high", seccion="Transacciones")
  4. Responder: "✅ Listo, te creé el ticket APP-123: https://linear..."
```
"""

    # Aplicar formato con las variables
    return base_prompt.format(fecha=fecha_str, mes=mes_actual_es, anio=anio_actual)
