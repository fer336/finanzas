"""
Router for payment operations (payments from pending payments and préstamos) with Multi-Tenancy
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid

from app.database import get_db
from app.repositories.pago_pendiente_repository_pg import PagoPendienteRepositoryPG
from app.repositories.prestamo_repository import PrestamoRepository
from app.repositories.transaccion_repository import TransaccionRepository
from app.core.dependencies import CurrentUser
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/pagos", tags=["pagos"])


def safe_float(value, default=0.0):
    """
    🔧 Convierte un valor a float de forma segura
    Retorna default si el valor es None, string vacía o inválido
    """
    if value is None or value == "":
        return default
    try:
        result = float(value)
        return result
    except (ValueError, TypeError):
        return default


class PagoRequest(BaseModel):
    """Request model for registering a payment"""
    item_id: str  # ID of pending payment
    item_type: str  # 'pending_payment' or 'prestamo'
    payment_type: Optional[str] = 'total'  # 'total' (único valor soportado hoy)
    monto: Optional[Decimal] = None  # 🔧 Monto en ARS (opcional, puede ser 0 si solo paga USD)
    monto_usd: Optional[Decimal] = None  # Monto en USD (opcional)
    tipo_cambio: Optional[Decimal] = None  # Tipo de cambio usado (opcional)
    pesos_para_usd: Optional[Decimal] = None  # Pesos usados para pagar USD (opcional)
    tipo_dolar: Optional[str] = None  # Tipo de dólar (oficial, blue, etc.)
    descontar_pesos_por_usd: Optional[bool] = True  # Si debe crear transacción en ARS cuando paga en USD
    moneda: str = 'ARS'
    fecha_pago: str  # ISO date string
    metodo_pago_id: str
    categoria_id: str
    notas: Optional[str] = None
    comprobante: Optional[str] = None


@router.post("/registrar")
async def registrar_pago(
    pago_data: PagoRequest,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Register a payment for a pending payment.
    This will:
    1. Update the status of the pending payment
    2. Create a transaction (expense) in the transactions table
    """
    try:
        transaccion_repo = TransaccionRepository(db)
        created_transactions = []
        
        # Create transaction(s) based on what currency was paid
        # We create separate transactions for ARS and USD
        
        # Create ARS transaction if monto > 0
        monto_ars_value = safe_float(pago_data.monto, 0)
        if monto_ars_value > 0:
            # Agregar item_id a las notas para poder rastrear la transacción después
            notas_con_id = pago_data.notas or f"Pago de {pago_data.item_type}"
            notas_con_id += f"\n[PAGO_ID: {pago_data.item_id}]"
            
            transaccion_data_ars = {
                "monto": -abs(monto_ars_value),  # Negative for expenses
                "moneda": "ARS",
                "monto_ars": -abs(monto_ars_value),  # Campo requerido en la BD
                "tasa_cambio": 1.0,  # 1:1 para ARS
                "descripcion": pago_data.notas or f"Pago registrado desde {pago_data.item_type}",
                "fecha_transaccion": pago_data.fecha_pago,
                "tipo": "gasto",
                "notas": notas_con_id,
                "comprobante": pago_data.comprobante,
                "metodo_pago_id": pago_data.metodo_pago_id,
                "categoria_id": pago_data.categoria_id,
                "usuario_id": current_user.id  # ✅ Asignar usuario del token
            }
            nueva_transaccion_ars = transaccion_repo.create(transaccion_data_ars)
            created_transactions.append(nueva_transaccion_ars)
        
        # Create USD transaction if monto_usd > 0
        monto_usd_value = safe_float(pago_data.monto_usd, 0)
        if monto_usd_value > 0:
            
            # Determinar monto_ars y tasa_cambio basándose en los datos proporcionados
            pesos_para_usd_num = safe_float(pago_data.pesos_para_usd, 0)
            tipo_cambio_num = safe_float(pago_data.tipo_cambio, 0)
            
            if pesos_para_usd_num:
                # El usuario especificó cuántos pesos usó para pagar los USD
                monto_ars_equivalente = -abs(pesos_para_usd_num)
                # Calcular tasa de cambio real
                tasa_cambio_value = abs(pesos_para_usd_num) / monto_usd_value if monto_usd_value > 0 else 1.0
            elif tipo_cambio_num:
                # El usuario especificó el tipo de cambio
                tasa_cambio_value = tipo_cambio_num
                monto_ars_equivalente = -abs(monto_usd_value * tasa_cambio_value)
            else:
                # No se especificó tipo de cambio, usar un valor por defecto (1200 ARS/USD aprox)
                tasa_cambio_value = 1200.0  # Valor de referencia
                monto_ars_equivalente = -abs(monto_usd_value * tasa_cambio_value)
            
            # Agregar item_id a las notas para poder rastrear la transacción después
            notas_con_id_usd = pago_data.notas or f"Pago de {pago_data.item_type}"
            notas_con_id_usd += f"\n[PAGO_ID: {pago_data.item_id}]"
            
            transaccion_data_usd = {
                "monto": -abs(monto_usd_value),  # Negative for expenses
                "moneda": "USD",
                "monto_ars": monto_ars_equivalente,  # Pesos equivalentes o estimados
                "tasa_cambio": tasa_cambio_value,
                "descripcion": pago_data.notas or f"Pago registrado desde {pago_data.item_type}",
                "fecha_transaccion": pago_data.fecha_pago,
                "tipo": "gasto",
                "notas": notas_con_id_usd,
                "comprobante": pago_data.comprobante,
                "metodo_pago_id": pago_data.metodo_pago_id,
                "categoria_id": pago_data.categoria_id,
                "usuario_id": current_user.id  # ✅ Asignar usuario del token
            }
            nueva_transaccion_usd = transaccion_repo.create(transaccion_data_usd)
            created_transactions.append(nueva_transaccion_usd)
            
            # Si se debe descontar los pesos también, crear transacción en ARS
            if pago_data.descontar_pesos_por_usd:
                monto_pesos_usados = abs(safe_float(monto_ars_equivalente, 0))
                notas_pesos = f"Pesos usados para pagar U$D {monto_usd_value:.2f} ({pago_data.tipo_dolar or 'oficial'} - ${tasa_cambio_value:.2f})"
                if pago_data.notas:
                    notas_pesos = pago_data.notas + "\n" + notas_pesos
                notas_pesos += f"\n[PAGO_ID: {pago_data.item_id}]"
                
                transaccion_data_pesos = {
                    "monto": -abs(monto_pesos_usados),  # Negative for expenses in ARS
                    "moneda": "ARS",
                    "monto_ars": -abs(monto_pesos_usados),
                    "tasa_cambio": 1.0,  # 1:1 for ARS
                    "descripcion": f"Pesos para pagar USD - {pago_data.notas or f'Pago desde {pago_data.item_type}'}",
                    "fecha_transaccion": pago_data.fecha_pago,
                    "tipo": "gasto",
                    "notas": notas_pesos,
                    "comprobante": pago_data.comprobante,
                    "metodo_pago_id": pago_data.metodo_pago_id,
                    "categoria_id": pago_data.categoria_id,
                    "usuario_id": current_user.id  # ✅ Asignar usuario del token
                }
                nueva_transaccion_pesos = transaccion_repo.create(transaccion_data_pesos)
                created_transactions.append(nueva_transaccion_pesos)
        
        # If no transactions were created, something went wrong
        if not created_transactions:
            raise HTTPException(
                status_code=400,
                detail="Debe especificar al menos un monto (ARS o USD) mayor a 0"
            )
        
        # Extract transaction IDs for later use
        transaccion_ids = [str(t["id"]) for t in created_transactions]
        
        # Update the source item (pending payment or préstamo)
        if pago_data.item_type == "pending_payment":
            pago_pendiente_repo = PagoPendienteRepositoryPG(db)

            # Verificar pertenencia
            pago_existente = pago_pendiente_repo.get_by_id(uuid.UUID(pago_data.item_id))
            if not pago_existente or str(pago_existente.get('usuario_id')) != str(current_user.id):
                raise HTTPException(status_code=404, detail="Pago pendiente no encontrado")

            # Update the pending payment status to "pagado"
            update_data = {
                "estado": "pagado",
                "fechapago": pago_data.fecha_pago,
                "comprobante": pago_data.comprobante
            }

            pago_pendiente_repo.update(pago_data.item_id, update_data)

        elif pago_data.item_type == "prestamo":
            prestamo_repo = PrestamoRepository(db)

            # Verificar pertenencia
            prestamo_existente = prestamo_repo.get_by_id(uuid.UUID(pago_data.item_id))
            if not prestamo_existente or str(prestamo_existente.get('usuario_id')) != str(current_user.id):
                raise HTTPException(status_code=404, detail="Préstamo no encontrado")

            update_data = {
                "estado": "pagado",
                "fecha_pago": pago_data.fecha_pago,
                "comprobante": pago_data.comprobante
            }

            prestamo_repo.update(pago_data.item_id, update_data)

        db.commit()
        
        return {
            "success": True,
            "message": "Pago registrado exitosamente",
            "transaccion_id": transaccion_ids[0] if transaccion_ids else None,
            "transaccion_ids": transaccion_ids,
            "item_id": pago_data.item_id,
            "item_type": pago_data.item_type,
            "transactions_created": len(created_transactions),
            "payment_details": {
                "monto_ars": safe_float(pago_data.monto, 0),
                "monto_usd": safe_float(pago_data.monto_usd, 0),
                "fecha_pago": pago_data.fecha_pago
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error registrando pago: {str(e)}")


class DeshacerPagoRequest(BaseModel):
    """Request model for undoing a payment"""
    item_type: str  # 'pending_payment' or 'prestamo'
    eliminar_transacciones: bool = False  # Si debe eliminar las transacciones asociadas
    transaccion_ids: Optional[list] = None  # IDs de transacciones a eliminar (opcional)
    moneda: Optional[str] = None  # 'ARS', 'USD', o None para deshacer todo


@router.post("/deshacer/{item_id}")
async def deshacer_pago(
    item_id: str,
    request: DeshacerPagoRequest,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Deshacer/Revertir un pago registrado.
    Esto:
    1. Marca el item (pago pendiente o resumen) como NO pagado
    2. Opcionalmente elimina las transacciones asociadas
    """
    try:
        from uuid import UUID
        from datetime import timedelta
        transacciones_eliminadas = []
        transaccion_repo = TransaccionRepository(db)
        
        # Si se solicitó eliminar transacciones
        if request.eliminar_transacciones:
            if request.transaccion_ids:
                for transaccion_id in request.transaccion_ids:
                    try:
                        transaccion_uuid = UUID(transaccion_id)
                        # Verificar pertenencia antes de borrar
                        t = transaccion_repo.get_by_id(transaccion_uuid)
                        if t and str(t.get('usuario_id')) == str(current_user.id):
                            transaccion_repo.delete(transaccion_uuid)
                            transacciones_eliminadas.append(transaccion_id)
                    except Exception as e:
                        print(f"⚠️ No se pudo eliminar transacción {transaccion_id}: {e}")
            else:
                # Buscar transacciones automáticamente basadas en el pago
                fecha_limite = (datetime.now() - timedelta(days=30)).date().isoformat()
                
                # Obtener todas las transacciones recientes del usuario
                result = transaccion_repo.get_all(
                    usuario_id=current_user.id,
                    fecha_desde=fecha_limite,
                    tipo='gasto',
                    limit=500
                )
                
                transacciones_relacionadas = [
                    t for t in result['list']
                    if item_id in str(t.get('notas', ''))
                ]
                
                for transaccion in transacciones_relacionadas:
                    try:
                        transaccion_uuid = UUID(str(transaccion['id']))
                        transaccion_repo.delete(transaccion_uuid)
                        transacciones_eliminadas.append(str(transaccion['id']))
                    except Exception as e:
                        print(f"⚠️ No se pudo eliminar transacción {transaccion['id']}: {e}")
        
        # Restaurar el estado del item
        if request.item_type == "pending_payment":
            pago_pendiente_repo = PagoPendienteRepositoryPG(db)
            
            # Verificar pertenencia
            pago_existente = pago_pendiente_repo.get_by_id(UUID(item_id))
            if not pago_existente or str(pago_existente.get('usuario_id')) != str(current_user.id):
                raise HTTPException(status_code=404, detail="Pago pendiente no encontrado")
            
            update_data = {
                "estado": "pendiente",
                "fechapago": None,
                "comprobante": None
            }

            pago_pendiente_repo.update(item_id, update_data)

        elif request.item_type == "prestamo":
            prestamo_repo = PrestamoRepository(db)

            # Verificar pertenencia
            prestamo_existente = prestamo_repo.get_by_id(UUID(item_id))
            if not prestamo_existente or str(prestamo_existente.get('usuario_id')) != str(current_user.id):
                raise HTTPException(status_code=404, detail="Préstamo no encontrado")

            update_data = {
                "estado": "pendiente",
                "fecha_pago": None,
                "comprobante": None
            }

            prestamo_repo.update(item_id, update_data)

        else:
            raise HTTPException(status_code=400, detail="Tipo de item inválido")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Pago revertido exitosamente",
            "item_id": item_id,
            "item_type": request.item_type,
            "transacciones_eliminadas": transacciones_eliminadas,
            "total_transacciones_eliminadas": len(transacciones_eliminadas)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deshaciendo pago: {str(e)}")
