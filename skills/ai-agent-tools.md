# ai-agent-tools

## 📋 Propósito
Implementar un sistema de "function calling" o "tools" para el agente IA, permitiendo que el modelo de lenguaje ejecute acciones específicas (queries a DB, creación de transacciones, etc.) de forma estructurada y segura.

## 🎯 Cuándo Usar
- Al agregar una nueva capacidad al agente IA (ej: "consultar gastos de tarjeta")
- Al necesitar que el agente interactúe con la base de datos
- Al implementar acciones complejas que requieren validación de datos
- Al querer que el agente ejecute operaciones CRUD

## 📐 Patrón de Diseño
**Command Pattern** + **Factory Pattern** + **Pydantic Validation**

## 💻 Implementación

### Estructura del Sistema

```
backend/
├── app/
│   ├── routers/
│   │   └── agent.py          # Endpoint del agente
│   └── services/
│       └── agent_tools.py    # Definición de tools
└── data/
    └── ai_history.json        # Historial de conversaciones
```

### 1. Definición de Tools

```python
# backend/app/services/agent_tools.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.repositories.transaccion_repository import TransaccionRepositoryPG

# ============================================
# SCHEMAS PYDANTIC PARA VALIDACIÓN
# ============================================

class GetTransactionsParams(BaseModel):
    """Parámetros para obtener transacciones"""
    tipo: Optional[str] = Field(None, description="Tipo: 'ingreso' o 'gasto'")
    moneda: Optional[str] = Field(None, description="Moneda: 'ARS', 'USD', 'EUR'")
    limit: int = Field(10, description="Cantidad máxima de resultados")

class CreateTransactionParams(BaseModel):
    """Parámetros para crear una transacción"""
    descripcion: str = Field(..., description="Descripción de la transacción")
    monto: float = Field(..., description="Monto de la transacción")
    tipo: str = Field(..., description="Tipo: 'ingreso' o 'gasto'")
    moneda: str = Field("ARS", description="Moneda: 'ARS', 'USD', 'EUR'")
    categoria: Optional[str] = Field(None, description="Nombre de la categoría")
    metodo_pago: Optional[str] = Field(None, description="Nombre del método de pago")
    fecha: Optional[str] = Field(None, description="Fecha en formato YYYY-MM-DD")

class GetBalanceParams(BaseModel):
    """Parámetros para obtener el balance"""
    moneda: str = Field("ARS", description="Moneda: 'ARS', 'USD', 'EUR'")

# ============================================
# IMPLEMENTACIÓN DE LAS TOOLS
# ============================================

def get_transactions(db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
    """Obtiene transacciones filtradas"""
    try:
        validated = GetTransactionsParams(**params)
        repo = TransaccionRepositoryPG(db)
        
        transactions = repo.get_all(
            limit=validated.limit,
            tipo=validated.tipo,
            moneda=validated.moneda
        )
        
        return {
            'success': True,
            'transactions': transactions,
            'count': len(transactions)
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def create_transaction(db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
    """Crea una nueva transacción"""
    try:
        validated = CreateTransactionParams(**params)
        
        # Buscar categoría por nombre
        categoria_id = None
        if validated.categoria:
            from app.models.db_models import Categoria
            categoria = db.query(Categoria).filter(
                Categoria.nombre.ilike(f"%{validated.categoria}%")
            ).first()
            if categoria:
                categoria_id = str(categoria.id)
        
        # Buscar método de pago por nombre
        metodo_pago_id = None
        if validated.metodo_pago:
            from app.models.db_models import MetodoPago
            metodo = db.query(MetodoPago).filter(
                MetodoPago.nombre.ilike(f"%{validated.metodo_pago}%")
            ).first()
            if metodo:
                metodo_pago_id = str(metodo.id)
        
        # Crear transacción
        repo = TransaccionRepositoryPG(db)
        transaccion_data = {
            'descripcion': validated.descripcion,
            'monto': validated.monto,
            'tipo': validated.tipo.lower(),
            'moneda': validated.moneda.upper(),
            'categoria_id': categoria_id,
            'metodo_pago_id': metodo_pago_id,
            'fecha_transaccion': datetime.strptime(validated.fecha, '%Y-%m-%d').date() if validated.fecha else date.today()
        }
        
        nueva_transaccion = repo.create(transaccion_data)
        
        return {
            'success': True,
            'message': f'Transacción creada: {validated.descripcion} - ${validated.monto} {validated.moneda}',
            'transaction': nueva_transaccion
        }
    
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_balance(db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
    """Obtiene el balance actual"""
    try:
        validated = GetBalanceParams(**params)
        repo = TransaccionRepositoryPG(db)
        
        balance_data = repo.get_balance_by_currency(validated.moneda)
        
        return {
            'success': True,
            'balance': balance_data
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

# ============================================
# REGISTRO DE TOOLS DISPONIBLES
# ============================================

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_transactions",
            "description": "Obtiene una lista de transacciones (gastos e ingresos) con filtros opcionales",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {
                        "type": "string",
                        "enum": ["ingreso", "gasto"],
                        "description": "Filtrar por tipo de transacción"
                    },
                    "moneda": {
                        "type": "string",
                        "enum": ["ARS", "USD", "EUR"],
                        "description": "Filtrar por moneda"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Cantidad máxima de resultados (default: 10)",
                        "default": 10
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": "Crea una nueva transacción (gasto o ingreso)",
            "parameters": {
                "type": "object",
                "properties": {
                    "descripcion": {
                        "type": "string",
                        "description": "Descripción de la transacción"
                    },
                    "monto": {
                        "type": "number",
                        "description": "Monto de la transacción (siempre positivo)"
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["ingreso", "gasto"],
                        "description": "Tipo de transacción"
                    },
                    "moneda": {
                        "type": "string",
                        "enum": ["ARS", "USD", "EUR"],
                        "description": "Moneda de la transacción (default: ARS)",
                        "default": "ARS"
                    },
                    "categoria": {
                        "type": "string",
                        "description": "Nombre de la categoría (opcional)"
                    },
                    "metodo_pago": {
                        "type": "string",
                        "description": "Nombre del método de pago (opcional)"
                    },
                    "fecha": {
                        "type": "string",
                        "description": "Fecha en formato YYYY-MM-DD (opcional, default: hoy)"
                    }
                },
                "required": ["descripcion", "monto", "tipo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_balance",
            "description": "Obtiene el balance actual (ingresos - gastos) por moneda",
            "parameters": {
                "type": "object",
                "properties": {
                    "moneda": {
                        "type": "string",
                        "enum": ["ARS", "USD", "EUR"],
                        "description": "Moneda del balance (default: ARS)",
                        "default": "ARS"
                    }
                }
            }
        }
    }
]

# ============================================
# EJECUTOR DE TOOLS
# ============================================

def execute_tool(tool_name: str, params: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Ejecuta una tool por su nombre"""
    tools_map = {
        'get_transactions': get_transactions,
        'create_transaction': create_transaction,
        'get_balance': get_balance
    }
    
    if tool_name not in tools_map:
        return {'success': False, 'error': f'Tool {tool_name} no encontrada'}
    
    try:
        return tools_map[tool_name](db, params)
    except Exception as e:
        return {'success': False, 'error': str(e)}
```

### 2. Router del Agente

```python
# backend/app/routers/agent.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.services.agent_tools import AGENT_TOOLS, execute_tool
import httpx
import json
import os

router = APIRouter(prefix="/api/agent", tags=["agent"])

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

@router.post("/chat")
async def chat_with_agent(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Endpoint principal del agente IA con function calling"""
    try:
        user_message = request.get("message", "")
        history = request.get("history", [])
        
        # Construir mensajes para OpenRouter
        messages = [
            {
                "role": "system",
                "content": """Eres un asistente financiero experto. 
                Ayudas a gestionar transacciones, consultar balances y analizar gastos.
                Usa las herramientas disponibles para responder de forma precisa.
                Siempre responde en español de forma clara y concisa."""
            }
        ]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})
        
        # Primera llamada a OpenRouter con tools
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "anthropic/claude-3.5-sonnet",
                    "messages": messages,
                    "tools": AGENT_TOOLS,
                    "tool_choice": "auto"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            assistant_message = result['choices'][0]['message']
        
        # Si el modelo quiere usar tools
        if assistant_message.get('tool_calls'):
            tool_results = []
            
            for tool_call in assistant_message['tool_calls']:
                tool_name = tool_call['function']['name']
                tool_params = json.loads(tool_call['function']['arguments'])
                
                # Ejecutar la tool
                tool_result = execute_tool(tool_name, tool_params, db)
                tool_results.append({
                    'tool_call_id': tool_call['id'],
                    'role': 'tool',
                    'name': tool_name,
                    'content': json.dumps(tool_result, ensure_ascii=False)
                })
            
            # Segunda llamada con los resultados de las tools
            messages.append(assistant_message)
            messages.extend(tool_results)
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "anthropic/claude-3.5-sonnet",
                        "messages": messages
                    }
                )
                
                result = response.json()
                final_message = result['choices'][0]['message']['content']
        
        else:
            # Respuesta directa sin tools
            final_message = assistant_message.get('content', '')
        
        return {
            'success': True,
            'response': final_message,
            'used_tools': len(assistant_message.get('tool_calls', []))
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en agent: {str(e)}")
```

## ✅ Checklist Pre-Commit

- [ ] ¿Definí un schema Pydantic para validación?
- [ ] ¿La descripción de la tool es clara y específica?
- [ ] ¿Los parámetros tienen tipos y descripciones?
- [ ] ¿Manejé errores con try/except?
- [ ] ¿La tool retorna un dict con 'success' y 'error'/'data'?
- [ ] ¿Agregué la tool a `AGENT_TOOLS`?
- [ ] ¿Agregué la tool a `tools_map` en `execute_tool()`?
- [ ] ¿Probé la tool manualmente?

## ❌ Anti-Patrones

- ❌ **NO confiar ciegamente en los parámetros del modelo**  
  ✅ **SÍ validar con Pydantic**

- ❌ **NO hacer operaciones destructivas sin confirmación**  
  ✅ **SÍ pedir confirmación para DELETE**

- ❌ **NO exponer información sensible en tool descriptions**  
  ✅ **SÍ mantener descripciones funcionales, no técnicas**

- ❌ **NO permitir SQL injection vía parámetros**  
  ✅ **SÍ usar ORM (SQLAlchemy)**

## 🧪 Testing

```python
# tests/test_agent_tools.py
from app.services.agent_tools import execute_tool

def test_get_balance(db_session):
    result = execute_tool('get_balance', {'moneda': 'ARS'}, db_session)
    
    assert result['success'] == True
    assert 'balance' in result
    assert result['balance']['moneda'] == 'ARS'

def test_create_transaction_invalid_params(db_session):
    result = execute_tool('create_transaction', {'monto': 'invalid'}, db_session)
    
    assert result['success'] == False
    assert 'error' in result
```

## 🔗 Recursos

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Pydantic Validation](https://docs.pydantic.dev/)
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)

