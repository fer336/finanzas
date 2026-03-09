import asyncio
import json
import logging
import operator
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, cast

import httpx
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import InMemorySaver
from typing_extensions import Annotated, TypedDict

from app.core.config import settings
from app.repositories.ai_config_repository import AIConfigRepository
from app.services.agent_tools import AGENT_TOOLS, execute_tool
from app.utils.ai_logger import calculate_cost, save_ai_activity

try:
    from langgraph.checkpoint.redis.aio import AsyncRedisSaver
except Exception:
    AsyncRedisSaver = None

try:
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
except Exception:
    AsyncPostgresSaver = None


logger = logging.getLogger(__name__)

MODEL = "google/gemini-3-flash-preview"

PROVIDER_CHAT_ENDPOINTS = {
    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
    "openai": "https://api.openai.com/v1/chat/completions",
    "google": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
}

CONFIRM_TERMS = {
    "si",
    "sí",
    "dale",
    "ok",
    "confirmo",
    "guardar",
    "guarda",
    "guardalo",
    "guardalo",
    "guardala",
    "confirmá",
    "confirma",
    "confirmar",
    "✅",
}
CANCEL_TERMS = {
    "no",
    "cancelar",
    "cancelá",
    "cancela",
    "descartar",
    "mejor no",
    "no guardes",
    "no guardar",
}
UNDO_TERMS = {
    "borrala",
    "borrala",
    "eliminala",
    "elíminala",
    "eliminarla",
    "deshacer",
    "deshace eso",
    "esta mal",
    "está mal",
    "quedó mal",
    "quedo mal",
}


class AgentGraphState(TypedDict, total=False):
    messages: Annotated[List[Dict[str, Any]], operator.add]
    current_input: str
    llm_response: str
    tool_calls: List[Dict[str, Any]]
    assistant_tool_message: Optional[Dict[str, Any]]
    pending_action: Optional[Dict[str, Any]]
    last_created_transaction: Optional[Dict[str, Any]]
    response: str
    action: Optional[str]
    data: Optional[Dict[str, Any]]


_CHECKPOINTER: Any = None
_CHECKPOINTER_ENGINE = "memory"
_CHECKPOINTER_LOCK = asyncio.Lock()
_CHECKPOINTER_CONTEXT = None


def _serialize_json(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _serialize_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_json(v) for v in value]
    return value


def _normalize_model_for_provider(provider: str, model: str) -> str:
    if provider in ["openai", "google"] and "/" in model:
        prefix, suffix = model.split("/", 1)
        if provider == "openai" and prefix == "openai":
            return suffix
        if provider == "google" and prefix == "google":
            return suffix
    return model


def _get_ai_runtime_config(current_user: Any, db: Any) -> Dict[str, Any]:
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
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        api_key = api_key.strip().strip('"').strip("'")
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
        raise ValueError(f"Provider no soportado: {provider}")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    if provider == "openrouter":
        headers["HTTP-Referer"] = (
            settings.PRODUCTION_FRONTEND_URL or settings.DEV_FRONTEND_URL
        )
        headers["X-Title"] = "Sistema de Gastos"

    return {"url": target_url, "headers": headers}


def _build_system_prompt(
    request_context: Optional[Dict[str, Any]], current_user: Any
) -> str:
    fecha_actual = datetime.now().strftime("%d/%m/%Y")
    prompt = f"""Sos Lucy, una asistente financiera personal que habla en espanol rioplatense.

Hoy es {fecha_actual}.
Usuario actual: {current_user.full_name} ({current_user.email})

Objetivos:
1. Responder preguntas financieras usando herramientas cuando haga falta.
2. Registrar gastos e ingresos de forma conversacional.
3. Nunca guardar una transaccion sin confirmacion explicita del usuario.

Regla critica de confirmacion:
- Cuando tengas todos los datos para registrar una transaccion, DEBES emitir una tool call a `create_transaction` con los argumentos completos.
- NO la expliques como ejecutada.
- El sistema va a interceptar esa tool call y le va a pedir confirmacion al usuario.
- Recién cuando el usuario diga si/sí/dale/ok, el sistema la ejecuta.

Reglas de herramientas:
- Usa herramientas para obtener datos reales del sistema.
- Si te preguntan deuda de tarjetas, usa `get_credit_card_expenses`.
- Si te preguntan pagos pendientes, usa `get_pending_payments`.
- Si te preguntan resumen del mes, usa `get_monthly_summary`.
- Si te preguntan por categorias, usa `get_spending_by_category` o `get_budget_status` segun corresponda.

Regla anti-repeticion:
- Si te faltan datos, preguntá SOLO los datos faltantes.
- No cierres esa pregunta con "¿me confirmás?".
- La confirmacion final se hace una sola vez, cuando ya tengas todo listo para guardar.

Defaults para registrar transacciones:
- Si no aclara fecha, asumi hoy.
- Si no aclara descripcion, usa el concepto mencionado por el usuario.
- Si no aclara categoria, inferila del concepto sin preguntar de mas.
- Si dice debito, credito, efectivo o transferencia, usalo como metodo de pago.
- Solo preguntá algo si realmente te impide registrar la operacion.

Si algo falta de verdad para registrar una transaccion, preguntalo de forma simple.
"""

    if request_context and request_context.get("financial_data"):
        fin_data = request_context["financial_data"]
        prompt += "\nContexto financiero actual:\n"
        if fin_data.get("monthlyStats"):
            stats = fin_data["monthlyStats"]
            prompt += f"- Ingresos mes: ${stats.get('income', 0)}\n"
            prompt += f"- Gastos mes: ${stats.get('expenses', 0)}\n"
            prompt += f"- Balance mes: ${stats.get('balance', 0)}\n"

    return prompt


def _is_confirmation(text: str) -> bool:
    normalized = text.strip().lower()
    return normalized in CONFIRM_TERMS


def _is_cancellation(text: str) -> bool:
    normalized = text.strip().lower()
    return normalized in CANCEL_TERMS


def _is_undo_request(text: str) -> bool:
    normalized = text.strip().lower()
    return normalized in UNDO_TERMS


def _format_confirmation_message(args: Dict[str, Any]) -> str:
    tipo = "Gasto" if args.get("tipo") == "gasto" else "Ingreso"
    monto = abs(float(args.get("monto", 0) or 0))
    descripcion = args.get("descripcion") or "Sin descripcion"
    categoria = args.get("categoria_nombre") or "Sin categoria"
    metodo = args.get("metodo_pago_nombre") or "Sin metodo"
    fecha = args.get("fecha") or "Hoy"
    es_credito = "Si" if args.get("es_credito") else "No"

    return (
        f"Perfecto! {tipo}\n\n"
        f"Resumen final:\n"
        f"- {tipo} de ${monto:,.0f}\n"
        f"- {descripcion}\n"
        f"- {categoria}\n"
        f"- {metodo}\n"
        f"- {fecha}\n"
        f"- Credito: {es_credito}\n\n"
        "¿Confirmo y guardo? (sí/no)"
    )


def _log_usage(
    result: Dict[str, Any], response_headers: Dict[str, Any]
) -> Dict[str, Any]:
    usage = result.get("usage", {})
    model_used = result.get("model", MODEL)
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)

    real_cost = None
    if "x-ratelimit-cost" in response_headers:
        try:
            real_cost = float(response_headers["x-ratelimit-cost"])
        except Exception:
            real_cost = None

    if real_cost is None and usage:
        real_cost = usage.get("cost") or usage.get("total_cost")

    if real_cost is None or real_cost == 0:
        real_cost = calculate_cost(model_used, prompt_tokens, completion_tokens)

    save_ai_activity(
        {
            "model": model_used,
            "created_at": datetime.now().isoformat(),
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": usage.get("total_tokens", 0),
            },
            "cost": real_cost,
        }
    )

    return {
        "usage": usage,
        "model": model_used,
        "cost": real_cost,
    }


async def _call_provider(
    messages: List[Dict[str, Any]],
    current_user: Any,
    db: Any,
    *,
    tools: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    runtime_config = _get_ai_runtime_config(current_user, db)
    api_key = runtime_config["api_key"]
    provider = runtime_config["provider"]
    model = runtime_config["model"]
    temperature = runtime_config["temperature"]
    max_tokens = runtime_config["max_tokens"]

    if not api_key:
        raise ValueError(
            "No hay API key configurada para Lucy (OpenRouter/OpenAI/Google)"
        )

    provider_request = _build_provider_request(provider, api_key)

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            provider_request["url"],
            headers=provider_request["headers"],
            json=payload,
        )
        response.raise_for_status()
        result = response.json()

    choice = result.get("choices", [{}])[0]
    message = choice.get("message", {})
    usage_data = _log_usage(result, dict(response.headers))

    return {
        "provider": provider,
        "message": message,
        "tool_calls": message.get("tool_calls", []) or [],
        "content": message.get("content") or "",
        "usage_data": usage_data,
    }


async def _build_checkpointer() -> Any:
    global _CHECKPOINTER_ENGINE, _CHECKPOINTER_CONTEXT

    redis_url = settings.REDIS_URL
    if AsyncRedisSaver and redis_url:
        try:
            _CHECKPOINTER_CONTEXT = AsyncRedisSaver.from_conn_string(redis_url)
            saver = await _CHECKPOINTER_CONTEXT.__aenter__()
            await saver.asetup()
            _CHECKPOINTER_ENGINE = "redis"
            logger.info("Lucy LangGraph usando AsyncRedisSaver")
            return saver
        except Exception as exc:
            _CHECKPOINTER_ENGINE = "redis-fallback"
            logger.warning("RedisSaver no disponible para Lucy: %s", exc)

    if AsyncPostgresSaver and settings.LANGGRAPH_POSTGRES_URL:
        try:
            _CHECKPOINTER_CONTEXT = AsyncPostgresSaver.from_conn_string(
                settings.LANGGRAPH_POSTGRES_URL
            )
            saver = await _CHECKPOINTER_CONTEXT.__aenter__()
            await saver.setup()
            _CHECKPOINTER_ENGINE = "postgres"
            logger.info("Lucy LangGraph usando AsyncPostgresSaver")
            return saver
        except Exception as exc:
            _CHECKPOINTER_ENGINE = "postgres-fallback"
            logger.warning("PostgresSaver no disponible para Lucy: %s", exc)

    _CHECKPOINTER_ENGINE = "memory"
    logger.warning("Lucy LangGraph usando InMemorySaver")
    return InMemorySaver()


async def get_agent_checkpointer() -> Any:
    global _CHECKPOINTER
    if _CHECKPOINTER is None:
        async with _CHECKPOINTER_LOCK:
            if _CHECKPOINTER is None:
                _CHECKPOINTER = await _build_checkpointer()
    return _CHECKPOINTER


async def get_agent_engine_status() -> Dict[str, Any]:
    await get_agent_checkpointer()
    return {
        "engine": "langgraph",
        "checkpointer": _CHECKPOINTER_ENGINE,
        "redis_url": settings.REDIS_URL_MASKED,
        "postgres_url": settings.LANGGRAPH_POSTGRES_URL_MASKED,
    }


def build_agent_graph(
    request_context: Optional[Dict[str, Any]], current_user: Any, db: Any
):
    system_prompt = _build_system_prompt(request_context, current_user)

    def append_user_message(state: AgentGraphState) -> Dict[str, Any]:
        updates: Dict[str, Any] = {
            "messages": [{"role": "user", "content": state.get("current_input", "")}],
            "response": "",
            "action": None,
            "data": None,
            "llm_response": "",
            "tool_calls": [],
            "assistant_tool_message": None,
        }
        return updates

    def route_after_input(state: AgentGraphState) -> str:
        current_input = state.get("current_input", "")
        pending = state.get("pending_action")
        if pending and _is_confirmation(current_input):
            return "confirm_pending"
        if pending and _is_cancellation(current_input):
            return "cancel_pending"
        if state.get("last_created_transaction") and _is_undo_request(current_input):
            return "stage_delete_last_transaction"
        return "llm_plan"

    async def llm_plan(state: AgentGraphState) -> Dict[str, Any]:
        all_messages = [
            {"role": "system", "content": system_prompt},
            *state.get("messages", []),
        ]
        llm_result = await _call_provider(
            all_messages, current_user, db, tools=AGENT_TOOLS
        )
        return {
            "llm_response": llm_result["content"],
            "tool_calls": llm_result["tool_calls"],
            "assistant_tool_message": llm_result["message"]
            if llm_result["tool_calls"]
            else None,
            "data": {
                **llm_result["usage_data"],
                "tools_used": len(llm_result["tool_calls"]),
            },
        }

    def route_after_llm(state: AgentGraphState) -> str:
        tool_calls = state.get("tool_calls") or []
        if any(
            tc.get("function", {}).get("name") == "create_transaction"
            for tc in tool_calls
        ):
            return "stage_confirmation"
        if tool_calls:
            return "execute_tools"
        return "finalize_direct"

    def stage_confirmation(state: AgentGraphState) -> Dict[str, Any]:
        tool_call = next(
            tc
            for tc in (state.get("tool_calls") or [])
            if tc.get("function", {}).get("name") == "create_transaction"
        )
        try:
            args = json.loads(tool_call.get("function", {}).get("arguments", "{}"))
        except Exception:
            args = {}

        confirmation_message = _format_confirmation_message(args)
        return {
            "pending_action": {"tool_name": "create_transaction", "arguments": args},
            "response": confirmation_message,
            "action": "confirm_transaction",
            "tool_calls": [],
            "assistant_tool_message": None,
            "messages": [{"role": "assistant", "content": confirmation_message}],
        }

    def stage_delete_last_transaction(state: AgentGraphState) -> Dict[str, Any]:
        last_tx = state.get("last_created_transaction") or {}
        tx_id = last_tx.get("transaccion_id") or last_tx.get("id")
        descripcion = last_tx.get("descripcion") or "la última transacción"
        monto = abs(float(last_tx.get("monto") or last_tx.get("monto_ars") or 0))
        message = (
            f"Entendido. ¿Querés que elimine {descripcion} por ${monto:,.0f}? (sí/no)"
        )
        return {
            "pending_action": {
                "tool_name": "delete_transaction",
                "arguments": {"transaccion_id": tx_id},
            },
            "response": message,
            "action": "confirm_delete_transaction",
            "messages": [{"role": "assistant", "content": message}],
        }

    def execute_tools(state: AgentGraphState) -> Dict[str, Any]:
        tool_messages: List[Dict[str, Any]] = []
        tool_results: List[Dict[str, Any]] = []

        assistant_tool_message = state.get("assistant_tool_message")
        if assistant_tool_message:
            tool_messages.append(assistant_tool_message)

        for tool_call in state.get("tool_calls") or []:
            tool_name = tool_call.get("function", {}).get("name")
            try:
                arguments = json.loads(
                    tool_call.get("function", {}).get("arguments", "{}")
                )
            except Exception:
                arguments = {}

            result = execute_tool(tool_name, arguments, db, str(current_user.id))
            tool_results.append(
                {"tool_name": tool_name, "result": _serialize_json(result)}
            )
            tool_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.get("id"),
                    "name": tool_name,
                    "content": json.dumps(result, ensure_ascii=False, default=str),
                }
            )

        return {
            "messages": tool_messages,
            "data": {
                **(state.get("data") or {}),
                "tool_results": tool_results,
            },
        }

    async def finalize_from_tools(state: AgentGraphState) -> Dict[str, Any]:
        all_messages = [
            {"role": "system", "content": system_prompt},
            *state.get("messages", []),
        ]
        llm_result = await _call_provider(all_messages, current_user, db, tools=None)
        final_text = llm_result["content"] or "Listo."
        return {
            "response": final_text,
            "messages": [{"role": "assistant", "content": final_text}],
            "action": "tool_response",
            "data": {
                **(state.get("data") or {}),
                **llm_result["usage_data"],
            },
            "tool_calls": [],
            "assistant_tool_message": None,
        }

    def finalize_direct(state: AgentGraphState) -> Dict[str, Any]:
        final_text = state.get("llm_response") or "Listo."
        return {
            "response": final_text,
            "messages": [{"role": "assistant", "content": final_text}],
            "action": "conversation",
            "tool_calls": [],
            "assistant_tool_message": None,
        }

    def confirm_pending(state: AgentGraphState) -> Dict[str, Any]:
        pending = state.get("pending_action") or {}
        tool_name = pending.get("tool_name", "create_transaction")
        result = execute_tool(
            tool_name,
            pending.get("arguments", {}),
            db,
            str(current_user.id),
        )
        result = _serialize_json(result)
        if result.get("success"):
            if tool_name == "create_transaction":
                final_text = (
                    result.get("mensaje") or "Listo, ya lo guardé."
                ) + " Si quedó mal, decime 'borrala' y la elimino."
                action = "transaction_created"
            else:
                final_text = result.get("mensaje") or "Listo, ya la eliminé."
                action = "transaction_deleted"
        else:
            final_text = (
                result.get("mensaje") or result.get("error") or "No pude guardarlo."
            )
            action = (
                "transaction_error"
                if tool_name == "create_transaction"
                else "transaction_delete_error"
            )
        last_created_transaction = (
            None if tool_name == "delete_transaction" else result.get("detalles")
        )
        return {
            "pending_action": None,
            "last_created_transaction": last_created_transaction,
            "response": final_text,
            "action": action,
            "data": {"tool_results": [{"tool_name": tool_name, "result": result}]},
            "messages": [{"role": "assistant", "content": final_text}],
        }

    def cancel_pending(state: AgentGraphState) -> Dict[str, Any]:
        final_text = (
            "Perfecto, no guardo nada. Si querés lo ajustamos y lo intento de nuevo."
        )
        return {
            "pending_action": None,
            "response": final_text,
            "action": "transaction_cancelled",
            "messages": [{"role": "assistant", "content": final_text}],
        }

    graph = StateGraph(AgentGraphState)
    graph.add_node("append_user_message", append_user_message)
    graph.add_node("confirm_pending", confirm_pending)
    graph.add_node("cancel_pending", cancel_pending)
    graph.add_node("stage_delete_last_transaction", stage_delete_last_transaction)
    graph.add_node("llm_plan", llm_plan)
    graph.add_node("stage_confirmation", stage_confirmation)
    graph.add_node("execute_tools", execute_tools)
    graph.add_node("finalize_from_tools", finalize_from_tools)
    graph.add_node("finalize_direct", finalize_direct)

    graph.add_edge(START, "append_user_message")
    graph.add_conditional_edges(
        "append_user_message",
        route_after_input,
        [
            "confirm_pending",
            "cancel_pending",
            "stage_delete_last_transaction",
            "llm_plan",
        ],
    )
    graph.add_conditional_edges(
        "llm_plan",
        route_after_llm,
        ["stage_confirmation", "execute_tools", "finalize_direct"],
    )
    graph.add_edge("stage_confirmation", END)
    graph.add_edge("stage_delete_last_transaction", END)
    graph.add_edge("confirm_pending", END)
    graph.add_edge("cancel_pending", END)
    graph.add_edge("execute_tools", "finalize_from_tools")
    graph.add_edge("finalize_from_tools", END)
    graph.add_edge("finalize_direct", END)

    return graph


async def invoke_agent_graph(
    request: Any, current_user: Any, db: Any
) -> Dict[str, Any]:
    thread_id = None
    if request.context:
        thread_id = request.context.get("thread_id")
    thread_id = thread_id or f"lucy-{current_user.id}"

    checkpointer = await get_agent_checkpointer()
    graph = build_agent_graph(request.context, current_user, db).compile(
        checkpointer=checkpointer
    )
    config = cast(RunnableConfig, {"configurable": {"thread_id": thread_id}})

    state_snapshot = await graph.aget_state(config)
    initial_messages: List[Dict[str, Any]] = []
    if not state_snapshot.values and request.history:
        initial_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.history
            if msg.role in ["user", "assistant"]
        ]

    result = await graph.ainvoke(
        {
            "messages": initial_messages,
            "current_input": request.message,
        },
        config=config,
    )

    action = result.get("action")
    if not action and any(
        word in request.message.lower()
        for word in ["gasté", "compre", "compré", "pagué", "recibí"]
    ):
        action = "detect_transaction"

    data = result.get("data") or {}
    data["thread_id"] = thread_id
    data["engine"] = "langgraph"
    data["checkpointer"] = _CHECKPOINTER_ENGINE

    return {
        "response": result.get("response")
        or result.get("llm_response")
        or "Sin respuesta",
        "action": action,
        "data": data,
    }
