import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from app.utils.ai_logger import save_ai_activity, calculate_cost
from app.services.agent_tools import AGENT_TOOLS, execute_tool
from app.repositories.ai_config_repository import AIConfigRepository
from app.database import get_db
from app.core.dependencies import CurrentUser
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import json
from datetime import datetime
import os

router = APIRouter()

# ==========================================
# 🔑 CONFIGURACIÓN
# ==========================================
# OPENROUTER_API_KEY se lee dinámicamente
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# Usar un modelo estable y gratuito para pruebas
MODEL = "google/gemini-3-flash-preview"
# Alternativa: "google/gemini-pro-1.5"

PROVIDER_CHAT_ENDPOINTS = {
    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
    "openai": "https://api.openai.com/v1/chat/completions",
    "google": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
}

# ==========================================
# 📊 MODELOS DE DATOS
# ==========================================


class Message(BaseModel):
    role: str  # "user" o "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    context: Optional[Dict[str, Any]] = {}


class ChatResponse(BaseModel):
    response: str
    action: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class LogRequest(BaseModel):
    model: str
    usage: Dict[str, int]
    cost: Optional[float] = 0.0
    timestamp: Optional[str] = None


# ==========================================
# 🧠 SYSTEM PROMPT (actualizar con el tuyo)
# ==========================================

DEFAULT_SYSTEM_PROMPT = """Eres **Finny**, un asistente financiero personal experto e inteligente que habla en español argentino.

## 🎯 TU MISIÓN
Ayudar al usuario a:
1. **Registrar transacciones** (gastos e ingresos) de forma rápida y natural
2. **Analizar sus finanzas** con insights accionables
3. **Responder preguntas** sobre su situación financiera
4. **Dar recomendaciones** personalizadas para mejorar sus hábitos

## 🛠️ TUS HERRAMIENTAS
Tenés acceso a 6 herramientas potentes:
- `get_monthly_summary`: Resumen financiero de un mes
- `get_spending_by_category`: Desglose de gastos por categoría
- `get_budget_status`: Estado de presupuestos activos
- `get_credit_card_expenses`: **Gastos de TARJETA DE CRÉDITO** (deuda pendiente de pago)
- `get_pending_payments`: Pagos pendientes y vencidos (servicios, alquileres, etc.)
- `create_transaction`: Crear nueva transacción

**IMPORTANTE**: 
- Usá estas herramientas SIEMPRE que necesites datos del sistema. No inventes números.
- **Diferencia clave**: 
  - "gastos de tarjeta de crédito" → `get_credit_card_expenses`
  - "pagos pendientes" / "qué tengo que pagar" → `get_pending_payments`

## 💬 TU PERSONALIDAD
- **Amigable y cercano**: Hablá de "vos", usá emojis, sé cálido
- **Inteligente**: Analizá patrones, sugerí mejoras
- **Proactivo**: Ofrecé insights sin que te los pidan
- **Claro**: Explicá números complejos de forma simple

## 📝 FLUJO PARA CREAR TRANSACCIONES (3 PASOS)

### PASO 1: Detectar y Extraer
Cuando detectes intención de registrar gasto/ingreso:
- **Monto**: "5000", "$5000", "cinco mil" → 5000
- **Descripción**: "supermercado", "uber", "netflix" → Extrae el concepto
- **Tipo**: "gasté", "pagué" → Gasto | "cobré", "recibí" → Ingreso

### PASO 2: Inferir Inteligentemente
**Categorías (mapeo automático)**:
- Alimentación: "supermercado", "súper", "mercado", "comida", "restaurante", "almacén"
- Transporte: "uber", "taxi", "colectivo", "nafta", "gasolina", "estacionamiento", "peaje"
- Entretenimiento: "netflix", "spotify", "cine", "teatro", "steam", "juego"
- Salud: "farmacia", "doctor", "dentista", "medicamentos", "hospital", "clínica"
- Servicios: "luz", "agua", "gas", "internet", "teléfono", "alquiler", "expensas"
- Ropa: "ropa", "zapatillas", "zapatos", "remera", "pantalón"
- Salario: "sueldo", "salario", "pago mensual" (Ingreso)
- Freelance: "freelance", "trabajo", "proyecto" (Ingreso)

**Método de Pago** (pregunta si no está claro):
- Busca: "efectivo", "débito", "crédito", "transferencia", "mercadopago"
- Si no encuentra: Preguntá "¿Con qué pagaste?"

**Tarjeta de Crédito**:
- Si dice "crédito" o "tarjeta de crédito", pregunta: "¿Es a crédito (no afecta balance ahora)?"

### PASO 3: ⚠️ CONFIRMAR SIEMPRE
**NUNCA guardes sin confirmación explícita**

Formato de confirmación:
```
🛒 Voy a registrar:

• Tipo: [Gasto/Ingreso]
• Monto: $X,XXX
• Descripción: "..."
• Categoría: [Categoría] [emoji]
• Método: [Método] 💳
• Fecha: Hoy
• Crédito: [Sí/No]

¿Confirmo? (responde sí/no)
```

**Confirmaciones válidas**: "sí", "si", "dale", "ok", "confirmo", "guardá", "guarda", "✅"
**Cancelaciones**: "no", "cancela", "mejor no", "después"

Solo al confirmar → Llama `create_transaction`

## 📊 CUANDO ANALICES DATOS
1. **Sé específico**: "Gastaste $45,000 en Alimentación (35% del total)"
2. **Compará**: "Esto es un 20% más que el mes pasado"
3. **Sugiere acciones**: "Podrías ahorrar $5,000 cocinando más en casa"
4. **Destaca lo positivo**: "¡Buen trabajo! Estás dentro del presupuesto"

## 🚨 LO QUE NUNCA DEBES HACER
- ❌ Inventar números o datos
- ❌ Guardar transacciones sin confirmación
- ❌ Ser negativo o criticar al usuario
- ❌ Dar respuestas genéricas sin datos

## ✅ FORMATO DE RESPUESTAS
**Para registrar un gasto:**
```
Perfecto! 🛒 Entendí que gastaste $5,000 en supermercado.

Voy a registrar:
• Tipo: Gasto
• Monto: $5,000
• Categoría: Alimentación 🍔
• Fecha: Hoy

¿Con qué método pagaste? (Efectivo, Débito, Crédito, Transferencia)
```

**Para análisis:**
```
📊 Analicé tus gastos de enero:

💰 Balance: +$15,000
   • Ingresos: $250,000
   • Gastos: $235,000

🏆 Top 3 Categorías:
   1. Alimentación: $85,000 (36%)
   2. Transporte: $45,000 (19%)
   3. Servicios: $35,000 (15%)

💡 Insight: Gastaste 20% menos que diciembre. ¡Excelente!
```

Fecha actual: {fecha_actual}

---

## 💬 EJEMPLOS DE CONVERSACIONES PERFECTAS

### Ejemplo 1: Gasto Simple
**Usuario**: "gasté 5000 en el supermercado"

**Finny**: "Perfecto! 🛒 Entendí que gastaste $5,000 en supermercado.

Voy a registrar:
• Tipo: Gasto
• Monto: $5,000
• Descripción: Supermercado
• Categoría: Alimentación 🍔
• Fecha: Hoy

¿Con qué método pagaste? (Efectivo/Débito/Crédito/Transferencia)"

**Usuario**: "con débito"

**Finny**: "Perfecto! 💳 

📋 Resumen final:
• Gasto de $5,000
• Supermercado
• Alimentación 🍔
• Débito 💳
• Hoy

¿Confirmo y guardo? ✅"

**Usuario**: "sí"

**Finny**: [LLAMAR create_transaction] "✅ ¡Listo! Guardé tu gasto de $5,000 en supermercado."

---

### Ejemplo 2: Ingreso
**Usuario**: "cobré mi sueldo de 300000"

**Finny**: "¡Excelente! 💰 Ingreso de $300,000 detectado.

📋 Voy a registrar:
• Tipo: Ingreso
• Monto: $300,000
• Categoría: Salario 💼
• Descripción: Salario mensual
• Fecha: Hoy

¿Confirmo?"

**Usuario**: "dale"

**Finny**: [LLAMAR create_transaction] "✅ ¡Perfecto! Ingreso de $300,000 registrado. Tu balance mensual mejoró 🚀"

---

### Ejemplo 3: Usuario Cancela
**Usuario**: "gasté 3000 en farmacia"

**Finny**: "Entendido! 💊

• Gasto de $3,000
• Farmacia
• Categoría: Salud 🏥
• Fecha: Hoy

¿Con qué pagaste?"

**Usuario**: "mejor no lo registres"

**Finny**: "Ok, no hay problema! 👍 Si querés registrarlo después, solo decime."

[NO LLAMAR create_transaction]
"""

# ==========================================
# 🔧 FUNCIONES AUXILIARES
# ==========================================


def _normalize_model_for_provider(provider: str, model: str) -> str:
    if provider in ["openai", "google"] and "/" in model:
        prefix, suffix = model.split("/", 1)
        if provider == "openai" and prefix == "openai":
            return suffix
        if provider == "google" and prefix == "google":
            return suffix
    return model


def _get_ai_runtime_config(current_user: CurrentUser, db: Session) -> Dict[str, Any]:
    repo = AIConfigRepository(db)
    config = repo.get_by_user_id(current_user.id) or {}

    provider = (config.get("provider") or "openrouter").lower()
    auth_method = (config.get("auth_method") or "api_key").lower()
    model = config.get("modelo_preferido") or MODEL
    temperature = float(config.get("temperatura") or 0.7)
    max_tokens = int(config.get("max_tokens") or 4000)

    if auth_method == "oauth2":
        api_key = (config.get("access_token") or "").strip()
    else:
        api_key = (config.get("api_key") or "").strip()

    if not api_key:
        api_key = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"').strip("'")
        provider = "openrouter"

    return {
        "provider": provider,
        "api_key": api_key,
        "model": _normalize_model_for_provider(provider, model),
        "temperature": temperature,
        "max_tokens": max_tokens,
    }


def _build_provider_request(provider: str, api_key: str) -> Dict[str, Any]:
    target_url = PROVIDER_CHAT_ENDPOINTS.get(provider)
    if not target_url:
        raise HTTPException(
            status_code=400, detail=f"Provider no soportado: {provider}"
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    if provider == "openrouter":
        headers["HTTP-Referer"] = "http://localhost:3000"
        headers["X-Title"] = "Financial Assistant"

    return {"url": target_url, "headers": headers}


async def call_openrouter(
    messages: List[Dict[str, str]], system_prompt: Optional[str] = None
) -> str:
    """
    Llama a OpenRouter API (compatible con OpenAI)
    """
    # Leer API Key dinámicamente y limpiar posibles caracteres extra
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"').strip("'")

    # DEBUG: Mostrar primeros y últimos caracteres de la key para verificar
    if api_key:
        masked_key = f"{api_key[:10]}...{api_key[-4:]}"
        print(f"🔑 Usando API Key: {masked_key} (Longitud: {len(api_key)})")
    else:
        print(f"❌ API Key está vacía o es None")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="API key de OpenRouter no configurada. Por favor, revisa el archivo .env o los secrets de Docker.",
        )

    # Preparar mensajes
    all_messages = []

    # Agregar system prompt si existe
    if system_prompt:
        all_messages.append({"role": "system", "content": system_prompt})

    # Agregar mensajes del historial
    all_messages.extend(messages)

    # Hacer request a OpenRouter
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            payload = {
                "model": MODEL,
                "messages": all_messages,
                "temperature": 0.7,
                "max_tokens": 4000,
            }

            # Enable reasoning if supported/requested (Gemini 3 Flash Preview)
            # COMENTADO: Puede causar errores 500 si el modelo no lo soporta
            # if "gemini-3" in MODEL or "flash-preview" in MODEL:
            #    payload["reasoning"] = {"enabled": True}

            print(f"📤 Enviando request a OpenRouter: {json.dumps(payload, indent=2)}")

            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Financial Assistant",
                },
                json=payload,
            )

            if response.status_code != 200:
                error_detail = response.text
                print(
                    f"❌ Error de OpenRouter ({response.status_code}): {error_detail}"
                )

                # Fallback a un modelo más simple si es error del modelo
                if (
                    response.status_code >= 400
                    and response.status_code < 500
                    and "model" in error_detail.lower()
                ):
                    print("⚠️ Intentando fallback a google/gemini-2.0-flash-exp:free")
                    payload["model"] = "google/gemini-2.0-flash-exp:free"
                    response = await client.post(
                        f"{OPENROUTER_BASE_URL}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if "choices" in data and len(data["choices"]) > 0:
                            return data["choices"][0]["message"]["content"]

                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error de OpenRouter: {error_detail}",
                )

            result = response.json()

            # Extraer respuesta
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                raise HTTPException(
                    status_code=500, detail="Respuesta inválida de OpenRouter"
                )

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504, detail="Timeout al conectar con OpenRouter"
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")


# ==========================================
# 🌐 ENDPOINTS
# ==========================================


class AnalysisRequest(BaseModel):
    ticker: str
    price: float
    indicators: Dict[str, Any]


@router.post("/log")
async def log_external_usage(request: LogRequest):
    """
    Endpoint para registrar uso desde fuentes externas (como n8n)
    """
    try:
        activity_log = {
            "model": request.model,
            "created_at": request.timestamp or datetime.now().isoformat(),
            "usage": request.usage,
            "cost": request.cost,
        }
        save_ai_activity(activity_log)
        return {"status": "ok", "log": activity_log}
    except Exception as e:
        print(f"❌ Error logging external usage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-asset", response_model=ChatResponse)
async def analyze_asset(request: AnalysisRequest):
    """
    Genera un análisis técnico y fundamental breve usando IA
    """
    try:
        system_prompt = """Eres un experto analista financiero de Wall Street especializado en Análisis Técnico.
        Tu objetivo es dar una recomendación clara y precisa basada en los indicadores técnicos proporcionados.
        
        IMPORTANTE - FORMATO OBLIGATORIO:
        - Debes incluir SIEMPRE al final: "VERDICTO: [COMPRAR/VENDER/MANTENER]"
        - Debes incluir SIEMPRE: "RIESGO: [BAJO/MEDIO/ALTO]"
        - Usa formato Markdown limpio y profesional
        
        Reglas de Análisis:
        1. RSI: >70 = Sobrecompra (posible venta), <30 = Sobreventa (posible compra), 30-70 = Neutral
        2. MACD: Cruce arriba de señal = Alcista, Cruce abajo = Bajista
        3. SMAs: Precio > SMA50 > SMA200 = Tendencia alcista fuerte
        4. Considera el contexto del mercado argentino (volatilidad, inflación, dólar)
        
        Estructura tu respuesta así:
        
        ## 📊 Análisis Técnico: [TICKER]
        
        **Precio Actual:** $[Precio]
        
        ### Indicadores Técnicos
        **Tendencia:** [Alcista/Bajista/Lateral] - [Explicación breve]
        
        **Señales Clave:**
        - **RSI ([valor])**: [Interpretación - sobrecompra/sobreventa/neutral]
        - **MACD**: [Análisis del cruce con señal]
        - **Medias Móviles**: [Relación entre precio, SMA50 y SMA200]
        
        ### Recomendación
        **VERDICTO: [COMPRAR/VENDER/MANTENER]**
        
        **Justificación:** [1-2 líneas explicando la decisión]
        
        **RIESGO: [BAJO/MEDIO/ALTO]**
        
        **Horizonte:** Corto plazo (1-2 semanas) - Considera la volatilidad del mercado argentino.
        
        ---
        
        _Nota: Esta recomendación es educativa y no constituye asesoramiento financiero._
        """

        user_message = f"""Analiza {request.ticker} con estos datos:
        Precio: ${request.price}
        RSI: {request.indicators.get("rsi")}
        MACD: {request.indicators.get("macd")} (Signal: {request.indicators.get("macd_signal")})
        SMA 50: {request.indicators.get("sma_50")}
        SMA 200: {request.indicators.get("sma_200")}
        """

        messages = [{"role": "user", "content": user_message}]

        agent_response = await call_openrouter(messages, system_prompt)

        return ChatResponse(response=agent_response, action="display_analysis")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest, current_user: CurrentUser, db: Session = Depends(get_db)
):
    print(
        f"🤖 Agent chat request received from {current_user.email}: {request.message[:50]}..."
    )
    """
    Endpoint principal del agente conversacional con Function Calling
    """
    try:
        # Construir system prompt con contexto
        fecha_actual = datetime.now().strftime("%d/%m/%Y")
        system_prompt = DEFAULT_SYSTEM_PROMPT.replace("{fecha_actual}", fecha_actual)

        # Inyectar info del usuario
        system_prompt += (
            f"\n\nUsuario actual: {current_user.full_name} ({current_user.email})"
        )

        if request.context:
            # Agregar categorías disponibles
            if "categories" in request.context:
                categories = request.context["categories"]
                cat_names = [
                    f"{c.get('icono', '📁')} {c.get('nombre', 'Sin nombre')}"
                    for c in categories
                ]
                system_prompt += f"\n\nCategorías disponibles: {', '.join(cat_names)}"

            # Agregar métodos de pago disponibles
            if "payment_methods" in request.context:
                methods = request.context["payment_methods"]
                method_names = [
                    f"{m.get('icono', '💳')} {m.get('nombre', 'Sin nombre')}"
                    for m in methods
                ]
                system_prompt += (
                    f"\n\nMétodos de pago disponibles: {', '.join(method_names)}"
                )

            # Agregar fecha actual
            system_prompt += f"\n\nFecha actual: {datetime.now().strftime('%d/%m/%Y')}"

            # Agregar datos financieros si existen
            if "financial_data" in request.context:
                fin_data = request.context["financial_data"]
                if fin_data:
                    system_prompt += "\n\n## ESTADO FINANCIERO ACTUAL\n"

                    # Balance Mensual
                    if "monthlyStats" in fin_data:
                        stats = fin_data["monthlyStats"]
                        system_prompt += f"- Ingresos mes: ${stats.get('income', 0)}\n"
                        system_prompt += f"- Gastos mes: ${stats.get('expenses', 0)}\n"
                        system_prompt += f"- Balance mes: ${stats.get('balance', 0)}\n"

                    # Deuda
                    if "totalDeuda" in fin_data:
                        debt = fin_data["totalDeuda"]
                        system_prompt += (
                            f"- Deuda Total Pendiente: ${debt.get('total', 0)}\n"
                        )
                        system_prompt += f"  - Pagos Pendientes: ${debt.get('pendingPayments', 0)} ({debt.get('pendingCount', 0)} items)\n"
                        system_prompt += f"  - Resúmenes Tarjeta: ${debt.get('bankSummariesPendingOnly', 0)} ({debt.get('summariesPendingCount', 0)} items)\n"

                    # Detalle Pagos Pendientes
                    if "pendingPayments" in fin_data:
                        pendings = fin_data["pendingPayments"]
                        # Filtrar solo los no pagados para ahorrar contexto
                        unpaid = [
                            p
                            for p in pendings
                            if str(p.get("Estado", "")).lower() != "pagado"
                        ]
                        if unpaid:
                            system_prompt += "\n### Pagos Pendientes (Detalle):\n"
                            for p in unpaid[:10]:  # Limitar a 10
                                system_prompt += f"- {p.get('Nombre', 'Item')}: ${p.get('Monto', 0)} (Vence: {p.get('Vencimiento', 'N/A')})\n"

                    # Detalle Resúmenes
                    if "bankSummaries" in fin_data:
                        summaries = fin_data["bankSummaries"]
                        # Filtrar recientes/pendientes
                        valid_summaries = [
                            s for s in summaries if not s.get("total_pagado")
                        ]
                        if valid_summaries:
                            system_prompt += "\n### Resúmenes Tarjeta (Detalle):\n"
                            for s in valid_summaries[:5]:
                                card_name = (
                                    f"{s.get('banco', '')} {s.get('tipo_tarjeta', '')}"
                                )
                                # Intentar parsear totales
                                try:
                                    totales = s.get("totales")
                                    if isinstance(totales, str):
                                        totales = json.loads(totales)
                                    amount = totales.get("saldo_actual_pesos", 0)
                                except:
                                    amount = "?"
                                system_prompt += f"- {card_name}: ${amount} (Cierra: {s.get('cierre', '')})\n"

        # Construir historial de mensajes
        messages = []

        # Agregar historial si existe
        if request.history:
            for msg in request.history:
                messages.append({"role": msg.role, "content": msg.content})

        # Agregar mensaje actual del usuario
        messages.append({"role": "user", "content": request.message})

        # Preparar todos los mensajes incluyendo system prompt
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        runtime_config = _get_ai_runtime_config(current_user, db)
        api_key = runtime_config["api_key"]
        provider = runtime_config["provider"]
        model = runtime_config["model"]
        temperature = runtime_config["temperature"]
        max_tokens = runtime_config["max_tokens"]

        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="No hay API key configurada para Lucy (OpenRouter/OpenAI/Google)",
            )

        provider_request = _build_provider_request(provider, api_key)

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 🛠️ PRIMERA LLAMADA: Con herramientas disponibles
                payload = {
                    "model": model,
                    "messages": all_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "tools": AGENT_TOOLS,  # Agregar herramientas
                    "tool_choice": "auto",  # El modelo decide cuándo usar herramientas
                }

                print(
                    f"📤 Primera llamada IA ({provider}) con {len(AGENT_TOOLS)} herramientas"
                )

                client_response = await client.post(
                    provider_request["url"],
                    headers=provider_request["headers"],
                    json=payload,
                )

                if client_response.status_code != 200:
                    error_detail = client_response.text
                    print(
                        f"❌ Error del proveedor IA ({provider}): {client_response.status_code} - {error_detail}"
                    )
                    raise HTTPException(
                        status_code=client_response.status_code,
                        detail=f"Error del proveedor IA ({provider}): {error_detail}",
                    )

                result = client_response.json()

                # 🔍 VERIFICAR SI HAY TOOL CALLS
                first_choice = result.get("choices", [{}])[0]
                assistant_message = first_choice.get("message", {})
                tool_calls = assistant_message.get("tool_calls", [])

                if tool_calls:
                    print(f"🛠️ El modelo quiere usar {len(tool_calls)} herramientas")

                    # Agregar mensaje del asistente al historial
                    all_messages.append(assistant_message)

                    # Ejecutar cada herramienta
                    for tool_call in tool_calls:
                        tool_name = tool_call.get("function", {}).get("name")
                        try:
                            arguments = json.loads(
                                tool_call.get("function", {}).get("arguments", "{}")
                            )
                        except:
                            arguments = {}

                        tool_id = tool_call.get("id")

                        print(f"  🔧 Ejecutando: {tool_name}")

                        # Ejecutar la herramienta con usuario_id
                        tool_result = execute_tool(
                            tool_name, arguments, db, str(current_user.id)
                        )

                        # Agregar resultado al historial
                        all_messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_id,
                                "name": tool_name,
                                "content": json.dumps(
                                    tool_result, ensure_ascii=False, default=str
                                ),
                            }
                        )

                    # 🔄 SEGUNDA LLAMADA: Con resultados de herramientas
                    print(
                        f"📤 Segunda llamada a OpenRouter con resultados de herramientas"
                    )

                    second_payload = {
                        "model": model,
                        "messages": all_messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    }

                    second_response = await client.post(
                        provider_request["url"],
                        headers=provider_request["headers"],
                        json=second_payload,
                    )

                    if second_response.status_code != 200:
                        print(f"❌ Error en segunda llamada: {second_response.text}")
                        # Usar respuesta parcial si hay error
                        agent_response = "Procesé tu solicitud, pero hubo un error al generar la respuesta final."
                    else:
                        result = second_response.json()
                        agent_response = (
                            result.get("choices", [{}])[0]
                            .get("message", {})
                            .get("content", "Sin respuesta")
                        )
                else:
                    # Sin tool calls, respuesta directa
                    agent_response = assistant_message.get("content", "")

                # 📊 Guardar actividad localmente
                usage = result.get("usage", {})
                model_used = result.get("model", MODEL)
                prompt_tokens = usage.get("prompt_tokens", 0)
                completion_tokens = usage.get("completion_tokens", 0)

                # Obtener costo
                real_cost = None
                response_headers = client_response.headers
                if "x-ratelimit-cost" in response_headers:
                    try:
                        real_cost = float(response_headers["x-ratelimit-cost"])
                    except:
                        pass

                if real_cost is None and usage:
                    real_cost = usage.get("cost") or usage.get("total_cost")

                if real_cost is None or real_cost == 0:
                    real_cost = calculate_cost(
                        model_used, prompt_tokens, completion_tokens
                    )
                    print(
                        f"⚠️ OpenRouter no devolvió costo, usando estimación: ${real_cost}"
                    )
                else:
                    print(f"✅ Costo real de OpenRouter: ${real_cost}")

                activity_log = {
                    "model": model_used,
                    "created_at": datetime.now().isoformat(),
                    "usage": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": usage.get("total_tokens", 0),
                    },
                    "cost": real_cost,
                }
                save_ai_activity(activity_log)

                data = {
                    "usage": usage,
                    "model": model_used,
                    "tools_used": len(tool_calls) if tool_calls else 0,
                }

            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504, detail="Timeout al conectar con OpenRouter"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500, detail=f"Error de conexión: {str(e)}"
                )

        # Analizar si hay alguna acción implícita
        action = None

        if any(
            word in request.message.lower()
            for word in ["gasté", "compré", "pagué", "recibí"]
        ):
            action = "detect_transaction"

        return ChatResponse(response=agent_response, action=action, data=data)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en chat_with_agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Verifica el estado del agente
    """
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"').strip("'")

    return {
        "status": "ok",
        "model": MODEL,
        "api_configured": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0,
        "api_key_preview": f"{api_key[:10]}...{api_key[-4:]}"
        if api_key and len(api_key) > 14
        else "NOT_SET",
        "env_source": "docker_secret"
        if os.path.exists("/run/secrets/backend.env")
        else "local_env",
    }


@router.post("/update-config")
async def update_config(
    api_key: str, model: Optional[str] = None, system_prompt: Optional[str] = None
):
    """
    Actualiza la configuración del agente (solo para desarrollo)

    NOTA: En producción, esto debería estar protegido con autenticación
    """
    global MODEL, DEFAULT_SYSTEM_PROMPT

    if api_key:
        os.environ["OPENROUTER_API_KEY"] = api_key

    if model:
        MODEL = model

    if system_prompt:
        DEFAULT_SYSTEM_PROMPT = system_prompt

    return {
        "status": "updated",
        "model": MODEL,
        "api_configured": bool(os.getenv("OPENROUTER_API_KEY")),
    }
