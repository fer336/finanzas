"""
Servicio para gestionar archivos con MinIO (S3-compatible)
Usa el método fput_object probado que funciona correctamente
"""
import os
import io
import logging
import tempfile
from datetime import datetime, timedelta
from typing import Optional, BinaryIO
from uuid import uuid4

from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)


class MinIOService:
    """Servicio para gestionar archivos en MinIO"""
    
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket_name: str = "facturas",
        secure: bool = True,
        region: str = "us-east-1"
    ):
        """
        Inicializar servicio MinIO
        
        Args:
            endpoint: URL del servidor MinIO (sin https://)
            access_key: Access key de MinIO
            secret_key: Secret key de MinIO
            bucket_name: Nombre del bucket (default: facturas)
            secure: Usar HTTPS (default: True)
            region: Región de MinIO (default: us-east-1)
        """
        self.endpoint = endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket_name = bucket_name
        self.secure = secure
        self.region = region
        
        # Inicializar cliente MinIO
        try:
            self.client = Minio(
                endpoint=endpoint,
                access_key=access_key,
                secret_key=secret_key,
                secure=secure,
                region=region
            )
            logger.info(f"✅ Cliente MinIO inicializado: {endpoint}/{bucket_name}")
            
            # Verificar si el bucket existe
            if not self.client.bucket_exists(bucket_name):
                logger.warning(f"⚠️ Bucket '{bucket_name}' no existe")
            else:
                logger.info(f"✅ Bucket '{bucket_name}' encontrado")
                
        except S3Error as e:
            logger.warning(f"⚠️ Error al verificar bucket '{bucket_name}': {e}")
            logger.warning(f"⚠️ Asumiendo que el bucket existe. Si hay problemas al subir archivos, verifica las credenciales de MinIO.")
        except Exception as e:
            logger.error(f"❌ Error inicializando MinIO: {e}")
            raise
    
    async def upload_file(
        self,
        file: UploadFile,
        prefix: str = "comprobantes"
    ) -> dict:
        """
        Subir un archivo a MinIO usando el método probado (fput_object)
        
        Args:
            file: Archivo a subir (FastAPI UploadFile)
            prefix: Prefijo/carpeta dentro del bucket (default: comprobantes)
            
        Returns:
            dict: Información del archivo subido
                {
                    "file_name": str,
                    "file_url": str,
                    "bucket": str,
                    "size": int
                }
        """
        temp_file_path = None
        try:
            # 1. Verificar que el bucket existe
            if not self.client.bucket_exists(self.bucket_name):
                logger.error(f"❌ El bucket '{self.bucket_name}' no existe")
                raise HTTPException(
                    status_code=500,
                    detail=f"El bucket '{self.bucket_name}' no existe en MinIO"
                )
            
            # 2. Generar nombre único para el archivo
            extension = os.path.splitext(file.filename)[1] if file.filename else ".bin"
            timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
            unique_id = str(uuid4())[:8]
            file_name = f"{timestamp}_{unique_id}{extension}"
            
            # 3. Construir la ruta completa dentro del bucket
            # Formato: comprobantes/YYYY-MM-DD-HHMMSS_uuid.ext
            object_name = f"{prefix}/{file_name}"
            
            # 4. Guardar temporalmente el archivo (método que funciona)
            import tempfile
            temp_file_path = f"/tmp/{file_name}"
            
            contents = await file.read()
            file_size = len(contents)
            
            with open(temp_file_path, "wb") as f:
                f.write(contents)
            
            logger.info(f"📤 Subiendo archivo a MinIO: {self.bucket_name}/{object_name}")
            logger.info(f"   Endpoint: {self.endpoint}")
            logger.info(f"   Access Key: {self.access_key}")
            logger.info(f"   Bucket: {self.bucket_name}")
            logger.info(f"   Secure: {self.secure}")
            
            # 5. Subir usando fput_object (método probado que funciona)
            self.client.fput_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                file_path=temp_file_path,
                content_type=file.content_type or "application/octet-stream"
            )
            
            # 6. Construir URL pública del archivo
            file_url = f"https://{self.endpoint}/{self.bucket_name}/{object_name}"
            
            logger.info(f"✅ Archivo subido exitosamente: {file_url}")
            
            return {
                "file_name": file_name,
                "file_url": file_url,
                "bucket": self.bucket_name,
                "object_name": object_name,
                "size": file_size,
                "content_type": file.content_type,
                "url": file_url  # Alias para compatibilidad
            }
            
        except S3Error as e:
            logger.error(f"❌ Error S3 subiendo archivo: {e}")
            logger.error(f"   Code: {e.code if hasattr(e, 'code') else 'N/A'}")
            logger.error(f"   Message: {e.message if hasattr(e, 'message') else str(e)}")
            
            # Diagnóstico de configuración
            if "Access Denied" in str(e) or "InvalidAccessKeyId" in str(e) or "SignatureDoesNotMatch" in str(e):
                logger.error("🔑 ERROR DE AUTENTICACIÓN: Verifica MINIO_ACCESS_KEY y MINIO_SECRET_KEY")
                logger.error(f"   Endpoint usado: {self.endpoint}")
                logger.error(f"   Access Key usada: {self.access_key[:3]}***{self.access_key[-3:] if len(self.access_key)>6 else ''}")
                logger.error(f"   Secret Key set: {'✅ SÍ' if self.secret_key else '❌ NO (Vacía)'}")
            
            raise HTTPException(
                status_code=500,
                detail=f"Error subiendo archivo a MinIO: {str(e)}"
            )
        except Exception as e:
            logger.error(f"❌ Error inesperado subiendo archivo: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error subiendo archivo: {str(e)}"
            )
        finally:
            # 7. Limpiar archivo temporal
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.debug(f"🗑️ Archivo temporal eliminado: {temp_file_path}")
                except Exception as e:
                    logger.warning(f"⚠️ No se pudo eliminar archivo temporal: {e}")
    
    def delete_file(self, object_name: str) -> dict:
        """
        Eliminar un archivo de MinIO
        
        Args:
            object_name: Nombre del objeto en MinIO (ej: comprobantes/archivo.png)
            
        Returns:
            dict: Confirmación de eliminación
        """
        try:
            logger.info(f"🗑️ Eliminando archivo de MinIO: {self.bucket_name}/{object_name}")
            
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
            
            logger.info(f"✅ Archivo eliminado exitosamente")
            
            return {
                "message": "Archivo eliminado exitosamente",
                "object_name": object_name
            }
            
        except S3Error as e:
            logger.error(f"❌ Error S3 eliminando archivo: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error eliminando archivo: {e}"
            )
        except Exception as e:
            logger.error(f"❌ Error inesperado eliminando archivo: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error eliminando archivo: {str(e)}"
            )
    
    def get_presigned_url(
        self,
        object_name: str,
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Generar una URL prefirmada para acceso temporal a un archivo
        
        Args:
            object_name: Nombre del objeto en MinIO
            expires: Tiempo de expiración (default: 1 hora)
            
        Returns:
            str: URL prefirmada
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=expires
            )
            return url
        except S3Error as e:
            logger.error(f"❌ Error generando URL prefirmada: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error generando URL: {e}"
            )
    
    def file_exists(self, object_name: str) -> bool:
        """
        Verificar si un archivo existe en MinIO
        
        Args:
            object_name: Nombre del objeto en MinIO
            
        Returns:
            bool: True si existe, False si no
        """
        try:
            self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=object_name
            )
            return True
        except S3Error:
            return False
        except Exception as e:
            logger.error(f"❌ Error verificando existencia de archivo: {e}")
            return False


# Instancia global del servicio MinIO
_minio_service: Optional[MinIOService] = None


def get_minio_service() -> MinIOService:
    """
    Obtener instancia del servicio MinIO (Singleton)
    
    Returns:
        MinIOService: Instancia del servicio
    """
    global _minio_service
    
    if _minio_service is None:
        from app.core.config import settings
        
        _minio_service = MinIOService(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            bucket_name=settings.MINIO_BUCKET_NAME,
            secure=settings.MINIO_SECURE,
            region=settings.MINIO_REGION
        )
    
    return _minio_service

