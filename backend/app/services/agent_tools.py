"""
🛠️ Herramientas del Agente Financiero
=======================================
Define las funciones que el agente puede llamar para interactuar con el sistema.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
from uuid import UUID
import json
from sqlalchemy.orm import Session
from app.repositories.transaccion_repository import TransaccionRepository
from app.repositories.presupuesto_repository import PresupuestoRepository
from app.repositories.categoria_repository import CategoriaRepository
from app.repositories.metodo_pago_repository import MetodoPagoRepository
from app.repositories.pago_pendiente_repository_pg import PagoPendienteRepositoryPG


# ==========================================
# 📊 FUNCIONES DE CONSULTA
# ==========================================


def get_monthly_summary(
    db: Session, year: int, month: int, usuario_id: str
) -> Dict[str, Any]:
    """
    Obtiene el resumen financiero de un mes específico.

    Args:
        db: Sesión de base de datos
        year: Año (ej: 2026)
        month: Mes (1-12)
        usuario_id: ID del usuario

    Returns:
        Dict con ingresos, gastos, balance y transacciones del mes
    """
    try:
        transaccion_repo = TransaccionRepository(db)
        usuario_uuid = UUID(str(usuario_id))

        # Calcular fechas del mes
        fecha_desde = date(year, month, 1)
        if month == 12:
            fecha_hasta = date(year + 1, 1, 1)
        else:
            fecha_hasta = date(year, month + 1, 1)

        # Obtener transacciones del mes para el usuario específico
        result = transaccion_repo.get_all(
            usuario_id=usuario_uuid,
            limit=1000,
            fecha_desde=fecha_desde.isoformat(),
            fecha_hasta=fecha_hasta.isoformat(),
        )
        transacciones = result.get("list", []) if isinstance(result, dict) else result

        # Calcular estadísticas
        ingresos = sum(t["monto"] for t in transacciones if t["tipo"] == "ingreso")
        gastos_efectivo = sum(
            abs(t["monto"])
            for t in transacciones
            if t["tipo"] == "gasto" and not t.get("es_credito", False)
        )
        gastos_credito = sum(
            abs(t["monto"])
            for t in transacciones
            if t["tipo"] == "gasto"
            and t.get("es_credito", False)
            and not t.get("fecha_pago_real")
        )

        balance = ingresos - gastos_efectivo

        return {
            "periodo": f"{month:02d}/{year}",
            "ingresos": round(ingresos, 2),
            "gastos_efectivo": round(gastos_efectivo, 2),
            "gastos_credito_pendiente": round(gastos_credito, 2),
            "balance": round(balance, 2),
            "total_transacciones": len(transacciones),
            "transacciones_recientes": transacciones[:10],  # Últimas 10
        }
    except Exception as e:
        return {"error": str(e)}


def get_spending_by_category(
    db: Session, year: int, month: int, usuario_id: str
) -> List[Dict[str, Any]]:
    """
    Obtiene el desglose de gastos por categoría para un mes.

    Args:
        db: Sesión de base de datos
        year: Año
        month: Mes (1-12)
        usuario_id: ID del usuario

    Returns:
        Lista de categorías con sus gastos totales
    """
    try:
        transaccion_repo = TransaccionRepository(db)
        categoria_repo = CategoriaRepository(db)
        usuario_uuid = UUID(str(usuario_id))

        # Calcular fechas
        fecha_desde = date(year, month, 1)
        if month == 12:
            fecha_hasta = date(year + 1, 1, 1)
        else:
            fecha_hasta = date(year, month + 1, 1)

        # Obtener transacciones de gasto
        result = transaccion_repo.get_all(
            usuario_id=usuario_uuid,
            limit=1000,
            fecha_desde=fecha_desde.isoformat(),
            fecha_hasta=fecha_hasta.isoformat(),
        )
        transacciones = result.get("list", []) if isinstance(result, dict) else result

        gastos = [
            t
            for t in transacciones
            if t["tipo"] == "gasto" and not t.get("es_credito", False)
        ]

        # Agrupar por categoría
        # Nota: CategoriaRepository debería filtrar por usuario también si es necesario,
        # pero aquí obtenemos todas para mapear nombres
        categorias_result = categoria_repo.get_all(usuario_id=usuario_uuid)
        categorias = (
            categorias_result.get("list", [])
            if isinstance(categorias_result, dict)
            else categorias_result
        )
        categoria_map = {c["id"]: c for c in categorias}

        gastos_por_categoria = {}
        for gasto in gastos:
            cat_id = gasto.get("categoria_id")
            if cat_id:
                cat_nombre = categoria_map.get(cat_id, {}).get(
                    "nombre", "Sin categoría"
                )
                cat_icono = categoria_map.get(cat_id, {}).get("icono", "📁")
            else:
                cat_nombre = "Sin categoría"
                cat_icono = "❓"

            if cat_nombre not in gastos_por_categoria:
                gastos_por_categoria[cat_nombre] = {
                    "categoria": cat_nombre,
                    "icono": cat_icono,
                    "total": 0,
                    "cantidad": 0,
                }

            gastos_por_categoria[cat_nombre]["total"] += abs(gasto["monto"])
            gastos_por_categoria[cat_nombre]["cantidad"] += 1

        # Ordenar por total descendente
        resultado = sorted(
            gastos_por_categoria.values(), key=lambda x: x["total"], reverse=True
        )

        return resultado
    except Exception as e:
        return [{"error": str(e)}]


def get_budget_status(
    db: Session, year: int, month: int, usuario_id: str
) -> List[Dict[str, Any]]:
    """
    Obtiene el estado de los presupuestos activos.

    Args:
        db: Sesión de base de datos
        year: Año
        month: Mes (1-12)
        usuario_id: ID del usuario

    Returns:
        Lista de presupuestos con su estado actual
    """
    try:
        presupuesto_repo = PresupuestoRepository(db)
        transaccion_repo = TransaccionRepository(db)
        usuario_uuid = UUID(str(usuario_id))

        # Obtener presupuestos activos del usuario
        # Nota: Asumimos que get_active filtra por usuario si se le pasa, o traeremos todos y filtraremos
        # Revisando repo, get_active no parece recibir usuario_id en la versión actual,
        # pero deberíamos actualizarlo. Por ahora, asumimos que get_all soporta filtro.
        # Si PresupuestoRepository no tiene filtro por usuario en get_active,
        # es una limitación que debemos corregir en el repo también.

        # Intentamos obtener todos filtrados por usuario
        presupuestos_result = presupuesto_repo.get_all(usuario_id=usuario_uuid)
        presupuestos_lista = (
            presupuestos_result.get("list", [])
            if isinstance(presupuestos_result, dict)
            else presupuestos_result
        )
        # Filtramos activos manualmente si el repo no lo hace
        presupuestos = [p for p in presupuestos_lista if p.get("activo", True)]

        # Calcular gastos del mes por categoría
        fecha_desde = date(year, month, 1)
        if month == 12:
            fecha_hasta = date(year + 1, 1, 1)
        else:
            fecha_hasta = date(year, month + 1, 1)

        result = transaccion_repo.get_all(
            usuario_id=usuario_uuid,
            limit=1000,
            fecha_desde=fecha_desde.isoformat(),
            fecha_hasta=fecha_hasta.isoformat(),
        )
        transacciones = result.get("list", []) if isinstance(result, dict) else result

        gastos = [
            t
            for t in transacciones
            if t["tipo"] == "gasto" and not t.get("es_credito", False)
        ]

        # Agrupar gastos por categoría
        gastos_por_cat = {}
        for gasto in gastos:
            cat_id = gasto.get("categoria_id")
            if cat_id:
                gastos_por_cat[cat_id] = gastos_por_cat.get(cat_id, 0) + abs(
                    gasto["monto"]
                )

        # Calcular estado de cada presupuesto
        resultado = []
        for presupuesto in presupuestos:
            cat_id = presupuesto.get("categoria_id")
            limite = presupuesto.get("monto_limite", 0) or presupuesto.get("limite", 0)
            gastado = gastos_por_cat.get(cat_id, 0)
            porcentaje = (gastado / limite * 100) if limite > 0 else 0
            disponible = limite - gastado

            estado = "ok"
            if porcentaje >= 100:
                estado = "excedido"
            elif porcentaje >= 80:
                estado = "alerta"

            resultado.append(
                {
                    "nombre": presupuesto.get("categoria", {}).get(
                        "nombre", "Presupuesto"
                    ),
                    "limite": round(limite, 2),
                    "gastado": round(gastado, 2),
                    "disponible": round(disponible, 2),
                    "porcentaje": round(porcentaje, 1),
                    "estado": estado,
                }
            )

        return resultado
    except Exception as e:
        return [{"error": str(e)}]


def get_credit_card_expenses(db: Session, usuario_id: str) -> Dict[str, Any]:
    """
    Obtiene los gastos de tarjeta de crédito (pendientes y pagados).

    Returns:
        Dict con deuda total, gastos pendientes y pagados
    """
    try:
        transaccion_repo = TransaccionRepository(db)
        usuario_uuid = UUID(str(usuario_id))

        # Obtener deuda de tarjetas filtrada por usuario
        deuda = transaccion_repo.get_deuda_tarjetas(usuario_id=usuario_uuid)

        return {
            "total_deuda": round(deuda.get("total_deuda", 0), 2),
            "transacciones_pendientes": deuda.get("cantidad_transacciones", 0),
            "desglose_por_tarjeta": deuda.get("deuda_por_tarjeta", []),
            "mensaje": f"Tenés ${round(deuda.get('total_deuda', 0), 2)} en gastos de tarjeta de crédito pendientes de pago.",
        }
    except Exception as e:
        return {"error": str(e)}


def get_pending_payments(db: Session, usuario_id: str) -> List[Dict[str, Any]]:
    """
    Obtiene los pagos pendientes ordenados por fecha de vencimiento.

    Returns:
        Lista de pagos pendientes
    """
    try:
        pago_repo = PagoPendienteRepositoryPG(db)
        usuario_uuid = UUID(str(usuario_id))

        # Obtener todos los pagos pendientes (no pagados) del usuario
        result = pago_repo.get_all(usuario_id=usuario_uuid, limit=100)
        pagos = result.get("list", []) if isinstance(result, dict) else result

        pagos_pendientes = [
            p for p in pagos if str(p.get("estado", "")).lower() != "pagado"
        ]

        # Ordenar por vencimiento
        def parse_date(fecha_str):
            if not fecha_str:
                return datetime.max
            try:
                # Manejar fecha si ya es objeto date
                if isinstance(fecha_str, (date, datetime)):
                    return fecha_str
                return datetime.fromisoformat(str(fecha_str))
            except:
                return datetime.max

        pagos_pendientes.sort(key=lambda x: parse_date(x.get("fechavencimiento")))

        # Simplificar datos
        resultado = []
        hoy = datetime.now().date()

        for pago in pagos_pendientes[:20]:  # Limitar a 20
            venc = pago.get("fechavencimiento")
            try:
                if isinstance(venc, str):
                    venc_date = datetime.fromisoformat(venc).date()
                elif isinstance(venc, (date, datetime)):
                    venc_date = venc
                else:
                    venc_date = datetime.max.date()

                if isinstance(venc_date, datetime):
                    venc_date = venc_date.date()

                dias_para_vencer = (venc_date - hoy).days
                vencido = dias_para_vencer < 0
            except:
                dias_para_vencer = None
                vencido = False

            resultado.append(
                {
                    "nombre": pago.get("nombre", "Sin nombre"),
                    "monto": round(float(pago.get("monto", 0)), 2),
                    "vencimiento": str(venc) if venc else None,
                    "dias_para_vencer": dias_para_vencer,
                    "vencido": vencido,
                    "descripcion": pago.get("descripcion", ""),
                }
            )

        return resultado
    except Exception as e:
        return [{"error": str(e)}]


# ==========================================
# ✍️ FUNCIONES DE ACCIÓN
# ==========================================


def create_transaction(
    db: Session,
    usuario_id: str,
    monto: float,
    tipo: str,
    descripcion: str,
    categoria_nombre: Optional[str] = None,
    metodo_pago_nombre: Optional[str] = None,
    fecha: Optional[str] = None,
    notas: Optional[str] = None,
    es_credito: bool = False,
) -> Dict[str, Any]:
    """
    Crea una nueva transacción en el sistema.

    Args:
        db: Sesión de base de datos
        usuario_id: ID del usuario
        monto: Monto de la transacción (positivo para ingresos, negativo para gastos)
        tipo: "ingreso" o "gasto"
        descripcion: Descripción de la transacción
        categoria_nombre: Nombre de la categoría (opcional, se buscará la mejor coincidencia)
        metodo_pago_nombre: Nombre del método de pago (opcional)
        fecha: Fecha en formato ISO (opcional, por defecto hoy)
        notas: Notas adicionales (opcional)
        es_credito: Si es un gasto con tarjeta de crédito

    Returns:
        Dict con la transacción creada o error
    """
    try:
        transaccion_repo = TransaccionRepository(db)
        categoria_repo = CategoriaRepository(db)
        metodo_repo = MetodoPagoRepository(db)
        usuario_uuid = UUID(str(usuario_id))

        # Buscar categoría por nombre (fuzzy matching) - Filtrar por usuario si es posible
        categoria_id = None
        if categoria_nombre:
            # Obtener categorías (idealmente filtradas por usuario, pero get_all trae todas por ahora)
            # TODO: Filtrar categorías por usuario_id en repo
            categorias_result = categoria_repo.get_all(usuario_id=usuario_uuid)
            categorias = (
                categorias_result.get("list", [])
                if isinstance(categorias_result, dict)
                else categorias_result
            )

            # Filtrar por usuario en memoria si el repo no lo hace (asumiendo que traemos todas)
            # Pero CategoriaRepository podría no traer usuario_id. Asumiremos que es global o del usuario.

            for cat in categorias:
                if (
                    categoria_nombre.lower() in cat["nombre"].lower()
                    or cat["nombre"].lower() in categoria_nombre.lower()
                ):
                    categoria_id = cat["id"]
                    break

        # Buscar método de pago por nombre
        metodo_pago_id = None
        if metodo_pago_nombre:
            metodos_result = metodo_repo.get_all(usuario_id=usuario_uuid)
            metodos = (
                metodos_result.get("list", [])
                if isinstance(metodos_result, dict)
                else metodos_result
            )
            for metodo in metodos:
                if (
                    metodo_pago_nombre.lower() in metodo["nombre"].lower()
                    or metodo["nombre"].lower() in metodo_pago_nombre.lower()
                ):
                    metodo_pago_id = metodo["id"]
                    break

        # Preparar datos de transacción
        if fecha:
            try:
                fecha_transaccion = datetime.fromisoformat(fecha)
            except:
                fecha_transaccion = datetime.now()
        else:
            fecha_transaccion = datetime.now()

        # Ajustar monto según tipo
        if tipo == "gasto" and monto > 0:
            monto = -abs(monto)
        elif tipo == "ingreso" and monto < 0:
            monto = abs(monto)

        transaccion_data = {
            "usuario_id": usuario_id,
            "monto": monto,
            "monto_ars": monto,
            "moneda": "ARS",
            "tasa_cambio": 1.0,
            "tipo": tipo,
            "descripcion": descripcion,
            "fecha_transaccion": fecha_transaccion.date(),
            "categoria_id": categoria_id,
            "metodo_pago_id": metodo_pago_id,
            "notas": notas or f"Creado por asistente IA",
            "es_credito": es_credito,
        }

        # Crear transacción
        transaccion = transaccion_repo.create(transaccion_data)

        return {
            "success": True,
            "transaccion_id": transaccion["id"],
            "mensaje": f"✅ Transacción creada: {tipo} de ${abs(monto):.2f} - {descripcion}",
            "detalles": transaccion,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "mensaje": f"❌ Error al crear transacción: {str(e)}",
        }


def delete_transaction(
    db: Session,
    usuario_id: str,
    transaccion_id: str,
) -> Dict[str, Any]:
    """Elimina una transacción del usuario."""
    try:
        transaccion_repo = TransaccionRepository(db)
        transaccion = transaccion_repo.get_by_id(UUID(transaccion_id))

        if not transaccion:
            return {
                "success": False,
                "error": "Transacción no encontrada",
                "mensaje": "❌ No encontré esa transacción para eliminar.",
            }

        if str(transaccion.get("usuario_id")) != str(usuario_id):
            return {
                "success": False,
                "error": "Sin permisos",
                "mensaje": "❌ Esa transacción no pertenece a tu usuario.",
            }

        success = transaccion_repo.delete(UUID(transaccion_id))
        if not success:
            return {
                "success": False,
                "error": "No se pudo eliminar",
                "mensaje": "❌ No pude eliminar la transacción.",
            }

        return {
            "success": True,
            "transaccion_id": transaccion_id,
            "mensaje": f"🗑️ Transacción eliminada: {transaccion.get('descripcion', 'sin descripción')}",
            "detalles": transaccion,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "mensaje": f"❌ Error al eliminar transacción: {str(e)}",
        }


# ==========================================
# 📋 DEFINICIÓN DE HERRAMIENTAS PARA IA
# ==========================================

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_monthly_summary",
            "description": "Obtiene el resumen financiero completo de un mes específico, incluyendo ingresos, gastos, balance y transacciones recientes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer",
                        "description": "Año del mes a consultar (ej: 2026)",
                    },
                    "month": {
                        "type": "integer",
                        "description": "Número del mes (1-12)",
                    },
                },
                "required": ["year", "month"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_credit_card_expenses",
            "description": "Obtiene los gastos de TARJETA DE CRÉDITO pendientes de pago. Usa esta función cuando pregunten por gastos de crédito, deuda de tarjetas, o cuánto deben de tarjetas.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_spending_by_category",
            "description": "Obtiene el desglose detallado de gastos por categoría para un mes específico.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer",
                        "description": "Año del mes a consultar",
                    },
                    "month": {
                        "type": "integer",
                        "description": "Número del mes (1-12)",
                    },
                },
                "required": ["year", "month"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_budget_status",
            "description": "Obtiene el estado actual de todos los presupuestos activos, mostrando cuánto se ha gastado y cuánto queda disponible.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer", "description": "Año actual"},
                    "month": {"type": "integer", "description": "Mes actual (1-12)"},
                },
                "required": ["year", "month"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_pending_payments",
            "description": "Obtiene la lista de pagos pendientes ordenados por fecha de vencimiento, mostrando cuáles están vencidos.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": "Crea una nueva transacción (ingreso o gasto) en el sistema. Usa esta función cuando el usuario te pida registrar un gasto o ingreso.",
            "parameters": {
                "type": "object",
                "properties": {
                    "monto": {
                        "type": "number",
                        "description": "Monto de la transacción en pesos (siempre positivo)",
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["ingreso", "gasto"],
                        "description": "Tipo de transacción",
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Descripción clara de la transacción (ej: 'Supermercado Coto', 'Salario mensual')",
                    },
                    "categoria_nombre": {
                        "type": "string",
                        "description": "Nombre de la categoría (ej: 'Alimentación', 'Transporte', 'Salario'). Se buscará la coincidencia más cercana.",
                    },
                    "metodo_pago_nombre": {
                        "type": "string",
                        "description": "Nombre del método de pago (ej: 'Efectivo', 'Débito', 'Crédito', 'Transferencia')",
                    },
                    "fecha": {
                        "type": "string",
                        "description": "Fecha de la transacción en formato ISO (YYYY-MM-DD). Si no se especifica, se usa hoy.",
                    },
                    "notas": {
                        "type": "string",
                        "description": "Notas adicionales opcionales",
                    },
                    "es_credito": {
                        "type": "boolean",
                        "description": "True si es un gasto con tarjeta de crédito que no afecta el balance inmediatamente",
                    },
                },
                "required": ["monto", "tipo", "descripcion"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_transaction",
            "description": "Elimina una transacción existente del usuario. Usala cuando el usuario pida borrar, deshacer o eliminar una transacción ya creada.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transaccion_id": {
                        "type": "string",
                        "description": "ID UUID de la transacción a eliminar",
                    }
                },
                "required": ["transaccion_id"],
            },
        },
    },
]


# ==========================================
# 🔧 EJECUTOR DE HERRAMIENTAS
# ==========================================


def execute_tool(
    tool_name: str, arguments: Dict[str, Any], db: Session, usuario_id: str
) -> Dict[str, Any]:
    """
    Ejecuta una herramienta y retorna el resultado.

    Args:
        tool_name: Nombre de la herramienta
        arguments: Argumentos de la herramienta
        db: Sesión de base de datos
        usuario_id: ID del usuario autenticado

    Returns:
        Resultado de la ejecución
    """
    try:
        print(f"🛠️ Ejecutando herramienta: {tool_name} para usuario {usuario_id}")
        print(f"📝 Argumentos: {json.dumps(arguments, indent=2)}")

        if tool_name == "get_monthly_summary":
            return get_monthly_summary(
                db, arguments["year"], arguments["month"], usuario_id
            )

        elif tool_name == "get_spending_by_category":
            return get_spending_by_category(
                db, arguments["year"], arguments["month"], usuario_id
            )

        elif tool_name == "get_budget_status":
            return get_budget_status(
                db, arguments["year"], arguments["month"], usuario_id
            )

        elif tool_name == "get_credit_card_expenses":
            return get_credit_card_expenses(db, usuario_id)

        elif tool_name == "get_pending_payments":
            return get_pending_payments(db, usuario_id)

        elif tool_name == "create_transaction":
            return create_transaction(
                db,
                usuario_id=usuario_id,
                monto=arguments["monto"],
                tipo=arguments["tipo"],
                descripcion=arguments["descripcion"],
                categoria_nombre=arguments.get("categoria_nombre"),
                metodo_pago_nombre=arguments.get("metodo_pago_nombre"),
                fecha=arguments.get("fecha"),
                notas=arguments.get("notas"),
                es_credito=arguments.get("es_credito", False),
            )

        elif tool_name == "delete_transaction":
            return delete_transaction(
                db,
                usuario_id=usuario_id,
                transaccion_id=arguments["transaccion_id"],
            )

        else:
            return {"error": f"Herramienta desconocida: {tool_name}"}

    except Exception as e:
        print(f"❌ Error ejecutando herramienta {tool_name}: {str(e)}")
        return {"error": str(e)}
