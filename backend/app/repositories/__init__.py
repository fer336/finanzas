"""Repositories para acceso a datos - PostgreSQL"""

# Repositorios PostgreSQL (nuevos)
from .pago_pendiente_repository_pg import PagoPendienteRepositoryPG
from .transaccion_repository import TransaccionRepository
from .categoria_repository import CategoriaRepository
from .metodo_pago_repository import MetodoPagoRepository

# Repositorios obsoletos de NocoDB (deprecados)
# from .base import BaseRepository
# from .pago_pendiente_repository import PagoPendienteRepository

__all__ = [
    "PagoPendienteRepositoryPG",
    "TransaccionRepository",
    "CategoriaRepository",
    "MetodoPagoRepository",
]
