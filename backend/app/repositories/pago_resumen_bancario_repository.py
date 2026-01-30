"""
Repository for managing payment history of bank summaries (pagos_resumen_bancario table)
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from uuid import UUID
from decimal import Decimal
import logging

from app.models.db_models import PagoResumenBancario

logger = logging.getLogger(__name__)


class PagoResumenBancarioRepository:
    """Repository for managing payment history of bank summaries"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, data: Dict[str, Any]) -> PagoResumenBancario:
        """
        Create a new payment record for a bank summary
        
        Args:
            data: Dictionary with payment data
                - resumen_bancario_id (UUID): ID of the bank summary
                - fecha_pago (datetime): Payment date
                - monto_pesos (Decimal): Amount paid in ARS
                - monto_usd (Decimal): Amount paid in USD
                - tipo_pago (str): 'total', 'minimo', or 'parcial'
                - tipo_cambio (Decimal, optional): Exchange rate used
                - transaccion_ids (list, optional): List of transaction IDs
                - metodo_pago_id (UUID, optional): Payment method ID
                - categoria_id (UUID, optional): Category ID
                - notas (str, optional): Notes
                - comprobante (str, optional): Receipt/proof
                - usuario_id (UUID, optional): User ID
        
        Returns:
            PagoResumenBancario: Created payment record
        """
        pago = PagoResumenBancario(**data)
        self.db.add(pago)
        self.db.flush()  # Flush to get the ID without committing
        logger.info(f"✅ Created payment record: ID={pago.id}, Resumen={pago.resumen_bancario_id}, Type={pago.tipo_pago}, ARS={pago.monto_pesos}, USD={pago.monto_usd}")
        return pago
    
    def get_by_id(self, pago_id: int) -> Optional[PagoResumenBancario]:
        """Get a payment record by ID"""
        return self.db.query(PagoResumenBancario).filter(PagoResumenBancario.id == pago_id).first()
    
    def get_by_resumen_id(self, resumen_bancario_id: UUID) -> List[PagoResumenBancario]:
        """
        Get all payment records for a specific bank summary
        
        Args:
            resumen_bancario_id: UUID of the bank summary
        
        Returns:
            List of payment records ordered by date (most recent first)
        """
        return (
            self.db.query(PagoResumenBancario)
            .filter(PagoResumenBancario.resumen_bancario_id == resumen_bancario_id)
            .order_by(desc(PagoResumenBancario.fecha_pago))
            .all()
        )
    
    def get_total_paid(self, resumen_bancario_id: UUID) -> Dict[str, Decimal]:
        """
        Calculate total amounts paid for a bank summary across all payments
        
        Args:
            resumen_bancario_id: UUID of the bank summary
        
        Returns:
            Dictionary with 'pesos' and 'usd' keys containing total paid amounts
        """
        result = (
            self.db.query(
                func.sum(PagoResumenBancario.monto_pesos).label('total_pesos'),
                func.sum(PagoResumenBancario.monto_usd).label('total_usd')
            )
            .filter(PagoResumenBancario.resumen_bancario_id == resumen_bancario_id)
            .first()
        )
        
        return {
            'pesos': Decimal(str(result.total_pesos or 0)),
            'usd': Decimal(str(result.total_usd or 0))
        }
    
    def delete(self, pago_id: int) -> bool:
        """
        Delete a payment record
        
        Args:
            pago_id: ID of the payment to delete
        
        Returns:
            True if deleted, False if not found
        """
        pago = self.get_by_id(pago_id)
        if not pago:
            return False
        
        self.db.delete(pago)
        self.db.flush()
        logger.info(f"🗑️ Deleted payment record: ID={pago_id}")
        return True
    
    def delete_by_resumen_id(self, resumen_bancario_id: UUID, moneda: Optional[str] = None) -> int:
        """
        Delete payment records for a bank summary
        
        Args:
            resumen_bancario_id: UUID of the bank summary
            moneda: Optional filter by currency ('ARS' or 'USD')
                    If None, deletes all payments for the summary
        
        Returns:
            Number of deleted records
        """
        query = self.db.query(PagoResumenBancario).filter(
            PagoResumenBancario.resumen_bancario_id == resumen_bancario_id
        )
        
        # If specific currency, only delete payments that have that currency
        if moneda == "ARS":
            query = query.filter(PagoResumenBancario.monto_pesos > 0)
        elif moneda == "USD":
            query = query.filter(PagoResumenBancario.monto_usd > 0)
        
        count = query.count()
        query.delete(synchronize_session=False)
        self.db.flush()
        
        logger.info(f"🗑️ Deleted {count} payment record(s) for resumen {resumen_bancario_id}")
        return count
    
    def to_dict(self, pago: PagoResumenBancario) -> Dict[str, Any]:
        """Convert payment record to dictionary"""
        return {
            "id": pago.id,
            "resumen_bancario_id": str(pago.resumen_bancario_id),
            "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None,
            "monto_pesos": float(pago.monto_pesos) if pago.monto_pesos else 0,
            "monto_usd": float(pago.monto_usd) if pago.monto_usd else 0,
            "tipo_pago": pago.tipo_pago,
            "tipo_cambio": float(pago.tipo_cambio) if pago.tipo_cambio else None,
            "transaccion_ids": pago.transaccion_ids,
            "metodo_pago_id": str(pago.metodo_pago_id) if pago.metodo_pago_id else None,
            "categoria_id": str(pago.categoria_id) if pago.categoria_id else None,
            "notas": pago.notas,
            "comprobante": pago.comprobante,
            "usuario_id": str(pago.usuario_id) if pago.usuario_id else None,
            "created_at": pago.created_at.isoformat() if pago.created_at else None
        }

