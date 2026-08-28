"""
Router para gestión de archivos con MinIO
"""
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.services.minio_service import get_minio_service
from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.db_models import Transaccion, PagoPendiente, Prestamo

logger = logging.getLogger(__name__)

router = APIRouter()


def _verify_file_ownership(object_name: str, current_user, db: Session) -> None:
    """
    Verifica que el archivo pertenezca al usuario autenticado antes de
    borrarlo o generar una URL prefirmada.

    Los archivos subidos a partir de este fix quedan namespaced como
    "<prefix>/<usuario_id>/<archivo>", así que alcanza con chequear el path.
    Para archivos subidos ANTES del fix (sin el usuario_id en el path), se
    verifica que el object_name esté referenciado como comprobante en algún
    registro (transacción, pago pendiente o préstamo) de ese mismo usuario.
    """
    user_id_str = str(current_user.id)

    if object_name.split("/")[1:2] == [user_id_str]:
        return

    for model in (Transaccion, PagoPendiente, Prestamo):
        match = (
            db.query(model.id)
            .filter(
                model.usuario_id == current_user.id,
                model.comprobante.ilike(f"%{object_name}"),
            )
            .first()
        )
        if match is not None:
            return

    raise HTTPException(
        status_code=403,
        detail="No tenés permiso para acceder a este archivo",
    )


@router.post("/upload")
async def upload_file(
    current_user: CurrentUser,  # 🔒 Requiere autenticación (JWT o API key)
    file: UploadFile = File(...),
    prefix: str = Query(default="comprobantes", description="Prefijo/carpeta en el bucket")
):
    """
    Subir un archivo a MinIO
    
    Args:
        file: Archivo a subir
        prefix: Prefijo/carpeta dentro del bucket (default: comprobantes)
        
    Returns:
        JSONResponse: Información del archivo subido
    """
    try:
        # Validar tipo de archivo
        allowed_extensions = [".jpg", ".jpeg", ".png", ".pdf", ".webp", ".gif"]
        file_extension = file.filename.split(".")[-1].lower() if file.filename else ""
        
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no permitido. Extensiones permitidas: {', '.join(allowed_extensions)}"
            )
        
        # Validar tamaño (máximo 10MB)
        max_size = 10 * 1024 * 1024  # 10MB en bytes
        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Archivo muy grande. Tamaño máximo: 10MB"
            )
        
        # Recrear el UploadFile con el contenido leído
        await file.seek(0)
        
        # Obtener servicio MinIO y subir archivo
        # Namespace por usuario para poder verificar ownership en delete/presigned-url
        minio_service = get_minio_service()
        result = await minio_service.upload_file(file, prefix=f"{prefix}/{current_user.id}")
        
        logger.info(f"✅ Archivo subido exitosamente: {result['file_url']}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Archivo subido exitosamente",
                "data": result
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error subiendo archivo: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error subiendo archivo: {str(e)}"
        )


@router.delete("/delete")
async def delete_file(
    current_user: CurrentUser,  # 🔒 Requiere autenticación (JWT o API key)
    object_name: str = Query(..., description="Nombre del objeto en MinIO (ej: comprobantes/archivo.png)"),
    db: Session = Depends(get_db)
):
    """
    Eliminar un archivo de MinIO

    Args:
        object_name: Nombre del objeto en MinIO

    Returns:
        JSONResponse: Confirmación de eliminación
    """
    try:
        _verify_file_ownership(object_name, current_user, db)

        minio_service = get_minio_service()
        result = minio_service.delete_file(object_name)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Archivo eliminado exitosamente",
                "data": result
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando archivo: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error eliminando archivo: {str(e)}"
        )


@router.get("/presigned-url")
async def get_presigned_url(
    current_user: CurrentUser,  # 🔒 Requiere autenticación (JWT o API key)
    object_name: str = Query(..., description="Nombre del objeto en MinIO"),
    expires_hours: int = Query(default=1, description="Horas de expiración (default: 1)"),
    db: Session = Depends(get_db)
):
    """
    Generar una URL prefirmada para acceso temporal a un archivo

    Args:
        object_name: Nombre del objeto en MinIO
        expires_hours: Horas de expiración

    Returns:
        JSONResponse: URL prefirmada
    """
    try:
        from datetime import timedelta

        _verify_file_ownership(object_name, current_user, db)

        minio_service = get_minio_service()
        url = minio_service.get_presigned_url(
            object_name=object_name,
            expires=timedelta(hours=expires_hours)
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "url": url,
                "expires_in_hours": expires_hours
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generando URL prefirmada: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando URL: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Verificar estado del servicio MinIO
    
    Returns:
        JSONResponse: Estado del servicio
    """
    try:
        minio_service = get_minio_service()
        
        # Verificar si el bucket existe
        bucket_exists = minio_service.client.bucket_exists(minio_service.bucket_name)
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "bucket": minio_service.bucket_name,
                "bucket_exists": bucket_exists,
                "endpoint": minio_service.endpoint
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Error verificando salud de MinIO: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

