"""
Transacciones Router - Using PostgreSQL with Multi-Tenancy
Todos los endpoints requieren autenticación y filtran por usuario
"""
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

from app.database import get_db
from app.repositories.transaccion_repository import TransaccionRepository
from app.repositories.objetivo_ahorro_repository import ObjetivoAhorroRepository
from app.schemas.transacciones import TransaccionResponse, TransaccionCreate, TransaccionUpdate
from app.core.dependencies import CurrentUser  # 👈 Agregar import

router = APIRouter()


@router.get("/")
async def get_transactions(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(1000, ge=1, le=5000, description="Límite de transacciones"),
    offset: int = Query(0, ge=0),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo: 'ingreso' o 'gasto'"),
    categoria_id: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Obtener transacciones del usuario autenticado"""
    try:
        repo = TransaccionRepository(db)
        
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            limit=limit,
            offset=offset,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            tipo=tipo
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo transacciones: {str(e)}")


@router.get("/ingresos")
async def get_ingresos(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Obtener solo ingresos del usuario autenticado"""
    try:
        repo = TransaccionRepository(db)
        
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            tipo="ingreso",
            limit=limit,
            offset=offset
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo ingresos: {str(e)}")


@router.get("/gastos")
async def get_gastos(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Obtener solo gastos del usuario autenticado"""
    try:
        repo = TransaccionRepository(db)
        
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            tipo="gasto",
            limit=limit,
            offset=offset
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo gastos: {str(e)}")


@router.get("/estadisticas")
async def get_estadisticas(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    fecha_desde: str = Query(..., description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: str = Query(..., description="Fecha hasta (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de transacciones del usuario autenticado"""
    try:
        repo = TransaccionRepository(db)
        
        stats = repo.get_estadisticas(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            usuario_id=current_user.id  # 👈 Siempre usar el usuario del JWT
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculando estadísticas: {str(e)}")


@router.get("/csv-template")
async def download_csv_template():
    """Descarga plantilla CSV para importación masiva"""
    from fastapi.responses import Response
    
    # CSV Template with headers and example rows
    # IMPORTANTE: categoria_id y metodo_pago_id son opcionales (dejar vacío si no aplica)
    csv_content = """fecha_transaccion,tipo,descripcion,monto,moneda,notas
2024-01-15,gasto,Supermercado,5000,ARS,Compra semanal
2024-01-15,ingreso,Sueldo,100000,ARS,Pago de enero
2024-01-16,gasto,Nafta YPF,12000,ARS,Tanque lleno
2024-01-16,gasto,Café,2500,ARS,
2024-01-17,ingreso,Freelance,50000,ARS,Proyecto web"""
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=plantilla_transacciones.csv"
        }
    )


@router.get("/{transaccion_id}")
async def get_transaction_by_id(
    transaccion_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener una transacción por ID (solo si es del usuario)"""
    try:
        repo = TransaccionRepository(db)
        transaccion = repo.get_by_id(UUID(transaccion_id))
        
        if not transaccion or str(transaccion.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        return transaccion
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo transacción: {str(e)}")


@router.post("/")
async def create_transaction(
    transaccion_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear una nueva transacción"""
    try:
        repo = TransaccionRepository(db)
        objetivo_repo = ObjetivoAhorroRepository(db)
        
        # Extract objetivo_id before conversion
        objetivo_id_str = transaccion_data.get('objetivo_id')
        
        # Convert string IDs to UUID
        if transaccion_data.get('categoria_id'):
            transaccion_data['categoria_id'] = UUID(transaccion_data['categoria_id'])
        if transaccion_data.get('metodo_pago_id'):
            transaccion_data['metodo_pago_id'] = UUID(transaccion_data['metodo_pago_id'])
        
        # Forzar usuario del token
        transaccion_data['usuario_id'] = current_user.id
        
        if objetivo_id_str:
            transaccion_data['objetivo_id'] = UUID(objetivo_id_str)
        
        # Ensure monto_ars is set
        if 'monto_ars' not in transaccion_data or transaccion_data['monto_ars'] is None:
            transaccion_data['monto_ars'] = transaccion_data.get('monto', 0)
            
        # Corregir nombre de campo fecha si viene como 'fecha'
        if 'fecha' in transaccion_data:
            transaccion_data['fecha_transaccion'] = transaccion_data.pop('fecha')
        
        # ELIMINAR ID SI VIENE EN EL PAYLOAD (Para evitar errores de duplicados)
        if 'id' in transaccion_data:
            transaccion_data.pop('id')

        # ELIMINAR CAMPOS DEPRECATED SI VIENEN
        if 'IncluirEnCuotaAlimentaria' in transaccion_data:
            transaccion_data.pop('IncluirEnCuotaAlimentaria')
        if 'incluir_en_cuota_alimentaria' in transaccion_data:
            transaccion_data.pop('incluir_en_cuota_alimentaria')
        if 'GastoCompartido' in transaccion_data:
            transaccion_data.pop('GastoCompartido')
        if 'gasto_compartido' in transaccion_data:
            transaccion_data.pop('gasto_compartido')
        if 'objetivo_aportes' in transaccion_data:
            transaccion_data.pop('objetivo_aportes')

        nueva_transaccion = repo.create(transaccion_data)
        
        # 🎯 Si la transacción tiene objetivo_id, crear aporte automáticamente
        if objetivo_id_str:
            try:
                # ⚠️ NUEVA LÓGICA: El usuario decide si es aporte o uso
                # - es_aporte_objetivo = True → SUMA al objetivo (inversiones, ahorro)
                # - es_aporte_objetivo = False → RESTA del objetivo (gastos consumidos del objetivo)
                
                tipo_transaccion = transaccion_data.get('tipo', 'gasto').lower()
                monto_base = Decimal(str(transaccion_data.get('monto', 0)))
                es_aporte = transaccion_data.get('es_aporte_objetivo', True)  # Por defecto True
                
                # Lógica simple basada en el flag del usuario:
                if es_aporte:
                    monto_aporte = monto_base  # SUMA
                    accion = 'Aporte'
                else:
                    monto_aporte = -monto_base  # RESTA
                    accion = 'Uso'
                
                print(f"🎯 Objetivo: {objetivo_id_str} | Tipo: {tipo_transaccion} | Es Aporte: {es_aporte} | Monto: {monto_aporte}")
                
                aporte_data = {
                    'objetivo_id': UUID(objetivo_id_str),
                    'monto': monto_aporte,
                    'moneda': transaccion_data.get('moneda', 'ARS'),
                    'fecha': transaccion_data.get('fecha_transaccion', date.today()),
                    'descripcion': f"{accion} desde transacción: {transaccion_data.get('descripcion', 'Sin descripción')}",
                    'tipo': 'transaccion',
                    'referencia_id': UUID(nueva_transaccion['id']),
                    'tipo_referencia': 'transaccion'
                }
                objetivo_repo.add_contribution(aporte_data)
                print(f"✅ {accion} creado automáticamente para objetivo {objetivo_id_str} (monto: {monto_aporte})")
            except Exception as aporte_error:
                print(f"⚠️ Error creando aporte automático: {str(aporte_error)}")
                # No fallar la transacción si falla el aporte
        
        return nueva_transaccion
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando transacción: {str(e)}")


@router.patch("/{transaccion_id}")
async def update_transaction(
    transaccion_id: str,
    transaccion_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Actualizar una transacción existente (solo si es del usuario)"""
    try:
        repo = TransaccionRepository(db)
        objetivo_repo = ObjetivoAhorroRepository(db)
        
        # Get original transaction to check if it belongs to user
        transaccion_original = repo.get_by_id(UUID(transaccion_id))
        if not transaccion_original or str(transaccion_original.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        objetivo_id_original = transaccion_original.get('objetivo_id')
        objetivo_id_nuevo = transaccion_data.get('objetivo_id')
        
        # Convert string IDs to UUID
        if transaccion_data.get('categoria_id'):
            transaccion_data['categoria_id'] = UUID(transaccion_data['categoria_id'])
        if transaccion_data.get('metodo_pago_id'):
            transaccion_data['metodo_pago_id'] = UUID(transaccion_data['metodo_pago_id'])
        
        # No permitir cambiar el usuario_id
        transaccion_data.pop('usuario_id', None)
        
        if objetivo_id_nuevo:
            transaccion_data['objetivo_id'] = UUID(objetivo_id_nuevo)
            
        # Corregir nombre de campo fecha si viene como 'fecha'
        if 'fecha' in transaccion_data:
            transaccion_data['fecha_transaccion'] = transaccion_data.pop('fecha')
        
        transaccion_actualizada = repo.update(UUID(transaccion_id), transaccion_data)
        
        if not transaccion_actualizada:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        # 🎯 Manejar cambios en objetivo_id y/o monto
        try:
            from app.models.db_models import AporteObjetivo
            
            # Buscar aporte existente
            aporte_existente = db.query(AporteObjetivo).filter(
                AporteObjetivo.referencia_id == UUID(transaccion_id),
                AporteObjetivo.tipo_referencia == 'transaccion'
            ).first()
            
            # Caso 1: Se eliminó el objetivo (tenía objetivo pero ahora no)
            if objetivo_id_original and not objetivo_id_nuevo:
                if aporte_existente:
                    objetivo_repo.delete_contribution(aporte_existente.id)
                    print(f"🗑️ Aporte eliminado (objetivo desvinculado)")
            
            # Caso 2: Se agregó o cambió el objetivo
            elif objetivo_id_nuevo:
                tipo_transaccion = transaccion_actualizada.get('tipo', 'gasto').lower()
                monto_base = Decimal(str(transaccion_actualizada.get('monto', 0)))
                es_aporte = transaccion_data.get('es_aporte_objetivo', True)  # Por defecto True
                
                # Calcular monto del aporte basado en el flag del usuario
                if es_aporte:
                    monto_aporte = monto_base  # SUMA
                    accion = 'Aporte'
                else:
                    monto_aporte = -monto_base  # RESTA
                    accion = 'Uso'
                
                print(f"🎯 UPDATE Objetivo: {objetivo_id_nuevo} | Es Aporte: {es_aporte} | Monto: {monto_aporte}")
                
                # Si cambió de objetivo, eliminar el aporte viejo
                if objetivo_id_nuevo != objetivo_id_original and aporte_existente:
                    objetivo_repo.delete_contribution(aporte_existente.id)
                    aporte_existente = None
                    print(f"🗑️ Aporte anterior eliminado (cambió objetivo)")
                
                # Si ya existe aporte para este objetivo, actualizarlo
                if aporte_existente and objetivo_id_nuevo == objetivo_id_original:
                    # Actualizar monto del aporte existente
                    aporte_existente.monto = monto_aporte
                    aporte_existente.moneda = transaccion_actualizada.get('moneda', 'ARS')
                    aporte_existente.fecha = transaccion_actualizada.get('fecha_transaccion', date.today())
                    aporte_existente.descripcion = f"{accion} desde transacción: {transaccion_actualizada.get('descripcion', 'Sin descripción')}"
                    db.commit()
                    # Recalcular progreso del objetivo
                    objetivo_repo._recalculate_progress(UUID(objetivo_id_nuevo))
                    print(f"♻️ {accion} actualizado para objetivo {objetivo_id_nuevo} (monto: {monto_aporte})")
                else:
                    # Crear nuevo aporte
                    aporte_data = {
                        'objetivo_id': UUID(objetivo_id_nuevo),
                        'monto': monto_aporte,
                        'moneda': transaccion_actualizada.get('moneda', 'ARS'),
                        'fecha': transaccion_actualizada.get('fecha_transaccion', date.today()),
                        'descripcion': f"{accion} desde transacción: {transaccion_actualizada.get('descripcion', 'Sin descripción')}",
                        'tipo': 'transaccion',
                        'referencia_id': UUID(transaccion_id),
                        'tipo_referencia': 'transaccion'
                    }
                    objetivo_repo.add_contribution(aporte_data)
                    print(f"✅ {accion} creado para objetivo {objetivo_id_nuevo} (monto: {monto_aporte})")
        except Exception as aporte_error:
            print(f"⚠️ Error manejando aporte: {str(aporte_error)}")
        
        return transaccion_actualizada
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando transacción: {str(e)}")


@router.delete("/{transaccion_id}")
async def delete_transaction(
    transaccion_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Eliminar una transacción (solo si es del usuario)"""
    try:
        repo = TransaccionRepository(db)
        objetivo_repo = ObjetivoAhorroRepository(db)
        
        # Get transaction to check if it belongs to user
        transaccion = repo.get_by_id(UUID(transaccion_id))
        if not transaccion or str(transaccion.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        # 🎯 Si tenía objetivo, eliminar aporte asociado
        if transaccion.get('objetivo_id'):
            try:
                from app.models.db_models import AporteObjetivo
                aporte = db.query(AporteObjetivo).filter(
                    AporteObjetivo.referencia_id == UUID(transaccion_id),
                    AporteObjetivo.tipo_referencia == 'transaccion'
                ).first()
                if aporte:
                    objetivo_repo.delete_contribution(aporte.id)
                    print(f"🗑️ Aporte eliminado junto con la transacción")
            except Exception as aporte_error:
                print(f"⚠️ Error eliminando aporte: {str(aporte_error)}")
        
        success = repo.delete(UUID(transaccion_id))
        
        if not success:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        return {"message": "Transacción eliminada exitosamente", "id": transaccion_id}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando transacción: {str(e)}")


@router.post("/bulk-delete")
async def bulk_delete_transactions(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Eliminar múltiples transacciones"""
    try:
        ids = request.get("ids", [])
        
        if not ids:
            raise HTTPException(status_code=400, detail="No se proporcionaron IDs")
        
        repo = TransaccionRepository(db)
        deleted_count = 0
        failed_ids = []
        
        for transaccion_id in ids:
            try:
                success = repo.delete(UUID(transaccion_id))
                if success:
                    deleted_count += 1
                else:
                    failed_ids.append(transaccion_id)
            except Exception as e:
                print(f"❌ Error eliminando transacción {transaccion_id}: {e}")
                failed_ids.append(transaccion_id)
        
        return {
            "message": f"{deleted_count} transacciones eliminadas exitosamente",
            "deleted_count": deleted_count,
            "failed_count": len(failed_ids),
            "failed_ids": failed_ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en eliminación masiva: {str(e)}")


@router.post("/bulk-create")
async def bulk_create_transactions(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Crear múltiples transacciones de una vez"""
    try:
        transactions = request.get("transactions", [])
        
        if not transactions:
            raise HTTPException(status_code=400, detail="No se proporcionaron transacciones")
        
        if len(transactions) > 1000:
            raise HTTPException(status_code=400, detail="Máximo 1000 transacciones por lote")
        
        repo = TransaccionRepository(db)
        created_count = 0
        failed_count = 0
        errors = []
        
        for idx, transaccion_data in enumerate(transactions):
            try:
                # Remove 'id' if present
                if 'id' in transaccion_data:
                    del transaccion_data['id']
                
                # Remove unexpected fields
                transaccion_data.pop('incluir_en_cuota_alimentaria', None)
                transaccion_data.pop('gasto_compartido', None)
                transaccion_data.pop('objetivo_aportes', None)
                
                # Convert string IDs to UUID (only if not empty/null)
                if transaccion_data.get('categoria_id') and str(transaccion_data['categoria_id']).strip():
                    try:
                        transaccion_data['categoria_id'] = UUID(transaccion_data['categoria_id'])
                    except (ValueError, AttributeError):
                        transaccion_data['categoria_id'] = None
                else:
                    transaccion_data['categoria_id'] = None
                    
                if transaccion_data.get('metodo_pago_id') and str(transaccion_data['metodo_pago_id']).strip():
                    try:
                        transaccion_data['metodo_pago_id'] = UUID(transaccion_data['metodo_pago_id'])
                    except (ValueError, AttributeError):
                        transaccion_data['metodo_pago_id'] = None
                else:
                    transaccion_data['metodo_pago_id'] = None
                    
                if transaccion_data.get('usuario_id') and str(transaccion_data['usuario_id']).strip():
                    try:
                        transaccion_data['usuario_id'] = UUID(transaccion_data['usuario_id'])
                    except (ValueError, AttributeError):
                        transaccion_data['usuario_id'] = None
                else:
                    transaccion_data['usuario_id'] = None
                
                # Ensure monto_ars is set
                if 'monto_ars' not in transaccion_data or transaccion_data['monto_ars'] is None:
                    transaccion_data['monto_ars'] = transaccion_data.get('monto', 0)
                
                # Fix field name if needed
                if 'fecha' in transaccion_data:
                    transaccion_data['fecha_transaccion'] = transaccion_data.pop('fecha')
                
                repo.create(transaccion_data)
                created_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append({
                    "row": idx + 1,
                    "error": str(e),
                    "data": transaccion_data.get('descripcion', 'Sin descripción')
                })
                print(f"❌ Error creando transacción {idx + 1}: {e}")
        
        return {
            "message": f"{created_count} transacciones creadas exitosamente",
            "created_count": created_count,
            "failed_count": failed_count,
            "errors": errors[:10]  # Limit to first 10 errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en creación masiva: {str(e)}")


# 💳 ═══════════════════════════════════════════════════════════════
# ENDPOINTS PARA TARJETAS DE CRÉDITO
# ═══════════════════════════════════════════════════════════════

@router.get("/tarjetas/deuda")
async def get_deuda_tarjetas(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener deuda total y detalle de tarjetas de crédito del usuario autenticado"""
    try:
        repo = TransaccionRepository(db)
        
        deuda = repo.get_deuda_tarjetas(usuario_id=current_user.id)
        
        return deuda
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo deuda de tarjetas: {str(e)}")


@router.post("/tarjetas/pagar-resumen")
async def pagar_resumen_tarjeta(
    request: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Marcar transacciones de tarjeta como pagadas (pago de resumen)
    
    Body:
    {
        "transaccion_ids": ["uuid1", "uuid2", ...],
        "fecha_pago": "2026-01-15",
        "monto_total": 3500.00,
        "metodo_pago_id": "uuid",
        "notas": "Pago resumen Visa enero 2026"
    }
    """
    try:
        transaccion_ids = request.get("transaccion_ids", [])
        fecha_pago_str = request.get("fecha_pago")
        monto_total = request.get("monto_total", 0)
        metodo_pago_id = request.get("metodo_pago_id")
        notas = request.get("notas", "Pago resumen tarjeta")
        
        if not transaccion_ids:
            raise HTTPException(status_code=400, detail="No se proporcionaron transacciones")
        
        if not fecha_pago_str:
            raise HTTPException(status_code=400, detail="Fecha de pago requerida")
        
        # Convertir fecha string a date object
        fecha_pago = datetime.strptime(fecha_pago_str, "%Y-%m-%d").date()
        
        # Generar ID único para este resumen
        resumen_id = uuid.uuid4()
        
        repo = TransaccionRepository(db)
        
        # Marcar transacciones como pagadas
        transaccion_ids_uuid = [UUID(tid) for tid in transaccion_ids]
        count = repo.marcar_resumen_pagado(
            transaccion_ids=transaccion_ids_uuid,
            fecha_pago=fecha_pago,
            resumen_id=resumen_id
        )
        
        # Crear transacción de pago del resumen (esta SÍ afecta el balance)
        transaccion_pago = {
            'descripcion': notas,
            'monto': -abs(monto_total),  # Gasto
            'moneda': 'ARS',
            'monto_ars': -abs(monto_total),
            'fecha_transaccion': fecha_pago,
            'tipo': 'gasto',
            'notas': f"Pago de {count} transacciones de tarjeta",
            'metodo_pago_id': UUID(metodo_pago_id) if metodo_pago_id else None,
            'es_credito': False,  # Esta transacción NO es a crédito
            'tasa_cambio': 1.0
        }
        
        pago_creado = repo.create(transaccion_pago)
        
        return {
            "message": f"Resumen pagado exitosamente: {count} transacciones marcadas",
            "resumen_id": str(resumen_id),
            "transacciones_pagadas": count,
            "pago_transaccion": pago_creado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error pagando resumen: {str(e)}")
