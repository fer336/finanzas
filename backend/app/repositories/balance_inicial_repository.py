"""
Repository para Balance Inicial
Maneja las operaciones CRUD de balances iniciales por mes y moneda
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
import calendar

from app.models.db_models import BalanceInicial, Transaccion
from app.schemas.balance_inicial import BalanceInicialCreate, BalanceInicialUpdate


class BalanceInicialRepository:
    """
    Repositorio para gestionar balances iniciales
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self, usuario_id: UUID, mes: Optional[str] = None) -> List[dict]:
        """
        Obtener todos los balances iniciales de un usuario
        
        Args:
            usuario_id: ID del usuario
            mes: (Opcional) Filtrar por mes específico (YYYY-MM)
        
        Returns:
            Lista de balances iniciales
        """
        query = self.db.query(BalanceInicial).filter(BalanceInicial.usuario_id == usuario_id)
        
        if mes:
            query = query.filter(BalanceInicial.mes == mes)
        
        balances = query.order_by(BalanceInicial.mes.desc(), BalanceInicial.moneda).all()
        return [balance.to_dict() for balance in balances]
    
    def get_by_id(self, balance_id: UUID, usuario_id: UUID) -> Optional[dict]:
        """
        Obtener un balance inicial por ID
        
        Args:
            balance_id: ID del balance inicial
            usuario_id: ID del usuario (para seguridad)
        
        Returns:
            Balance inicial o None
        """
        balance = self.db.query(BalanceInicial).filter(
            and_(
                BalanceInicial.id == balance_id,
                BalanceInicial.usuario_id == usuario_id
            )
        ).first()
        
        return balance.to_dict() if balance else None
    
    def get_by_mes_moneda(self, usuario_id: UUID, mes: str, moneda: str) -> Optional[dict]:
        """
        Obtener balance inicial de un mes y moneda específicos
        
        Args:
            usuario_id: ID del usuario
            mes: Mes en formato YYYY-MM
            moneda: Código de moneda (ARS, USD, etc.)
        
        Returns:
            Balance inicial o None
        """
        balance = self.db.query(BalanceInicial).filter(
            and_(
                BalanceInicial.usuario_id == usuario_id,
                BalanceInicial.mes == mes,
                BalanceInicial.moneda == moneda.upper()
            )
        ).first()
        
        return balance.to_dict() if balance else None
    
    def create(self, usuario_id: UUID, data: BalanceInicialCreate) -> dict:
        """
        Crear un balance inicial
        
        Args:
            usuario_id: ID del usuario
            data: Datos del balance inicial
        
        Returns:
            Balance inicial creado
        
        Raises:
            ValueError: Si ya existe un balance para ese mes y moneda
        """
        # Verificar si ya existe
        existing = self.get_by_mes_moneda(usuario_id, data.mes, data.moneda)
        if existing:
            raise ValueError(f"Ya existe un balance inicial para {data.mes} en {data.moneda}")
        
        balance = BalanceInicial(
            usuario_id=usuario_id,
            mes=data.mes,
            moneda=data.moneda.upper(),
            monto=data.monto
        )
        
        self.db.add(balance)
        self.db.commit()
        self.db.refresh(balance)
        
        return balance.to_dict()
    
    def update(self, balance_id: UUID, usuario_id: UUID, data: BalanceInicialUpdate) -> dict:
        """
        Actualizar un balance inicial
        
        Args:
            balance_id: ID del balance inicial
            usuario_id: ID del usuario (para seguridad)
            data: Datos a actualizar
        
        Returns:
            Balance inicial actualizado
        
        Raises:
            ValueError: Si el balance no existe
        """
        balance = self.db.query(BalanceInicial).filter(
            and_(
                BalanceInicial.id == balance_id,
                BalanceInicial.usuario_id == usuario_id
            )
        ).first()
        
        if not balance:
            raise ValueError("Balance inicial no encontrado")
        
        # Actualizar campos
        if data.monto is not None:
            balance.monto = data.monto
        
        balance.actualizado_en = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(balance)
        
        return balance.to_dict()
    
    def delete(self, balance_id: UUID, usuario_id: UUID) -> bool:
        """
        Eliminar un balance inicial
        
        Args:
            balance_id: ID del balance inicial
            usuario_id: ID del usuario (para seguridad)
        
        Returns:
            True si se eliminó, False si no existía
        """
        balance = self.db.query(BalanceInicial).filter(
            and_(
                BalanceInicial.id == balance_id,
                BalanceInicial.usuario_id == usuario_id
            )
        ).first()
        
        if not balance:
            return False
        
        self.db.delete(balance)
        self.db.commit()
        
        return True
    
    def upsert(self, usuario_id: UUID, data: BalanceInicialCreate) -> dict:
        """
        Crear o actualizar un balance inicial
        
        Args:
            usuario_id: ID del usuario
            data: Datos del balance inicial
        
        Returns:
            Balance inicial creado o actualizado
        """
        existing = self.get_by_mes_moneda(usuario_id, data.mes, data.moneda)
        
        if existing:
            # Actualizar existente
            balance = self.db.query(BalanceInicial).filter(
                and_(
                    BalanceInicial.usuario_id == usuario_id,
                    BalanceInicial.mes == data.mes,
                    BalanceInicial.moneda == data.moneda.upper()
                )
            ).first()
            
            balance.monto = data.monto
            balance.actualizado_en = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(balance)
            
            return balance.to_dict()
        else:
            # Crear nuevo
            return self.create(usuario_id, data)
    
    def bulk_create(self, usuario_id: UUID, mes: str, balances_data: List[dict]) -> List[dict]:
        """
        Crear múltiples balances iniciales a la vez
        
        Args:
            usuario_id: ID del usuario
            mes: Mes en formato YYYY-MM
            balances_data: Lista de {'moneda': 'ARS', 'monto': 1000}
        
        Returns:
            Lista de balances creados/actualizados
        """
        created_balances = []
        
        for balance_data in balances_data:
            data = BalanceInicialCreate(
                mes=mes,
                moneda=balance_data['moneda'],
                monto=balance_data['monto']
            )
            
            balance = self.upsert(usuario_id, data)
            created_balances.append(balance)
        
        return created_balances
    
    def copy_from_previous_month(self, usuario_id: UUID, mes_origen: str, mes_destino: str) -> List[dict]:
        """
        Copiar balances del mes anterior al mes actual
        
        Args:
            usuario_id: ID del usuario
            mes_origen: Mes origen (YYYY-MM)
            mes_destino: Mes destino (YYYY-MM)
        
        Returns:
            Lista de balances copiados
        """
        # Obtener balances del mes origen
        balances_origen = self.get_all(usuario_id, mes_origen)
        
        if not balances_origen:
            return []
        
        # Copiar al mes destino
        balances_copiados = []
        for balance in balances_origen:
            data = BalanceInicialCreate(
                mes=mes_destino,
                moneda=balance['moneda'],
                monto=balance['monto']
            )
            
            balance_copiado = self.upsert(usuario_id, data)
            balances_copiados.append(balance_copiado)
        
        return balances_copiados
    
    def get_meses_disponibles(self, usuario_id: UUID) -> List[str]:
        """
        Obtener lista de meses que tienen balances configurados
        
        Args:
            usuario_id: ID del usuario
        
        Returns:
            Lista de meses (YYYY-MM) ordenados descendentemente
        """
        meses = self.db.query(BalanceInicial.mes).filter(
            BalanceInicial.usuario_id == usuario_id
        ).distinct().order_by(BalanceInicial.mes.desc()).all()

        return [mes[0] for mes in meses]

    def calcular_balance_neto(self, usuario_id: UUID, mes: str, moneda: str = "ARS") -> dict:
        """
        Balance neto real de un mes: el dinero que el usuario debería tener.

        Ancla en el balance inicial configurado más reciente con mes <= al
        mes objetivo, y le suma ingresos - gastos desde ese mes (inclusive)
        hasta el fin del mes objetivo. Si no hay ancla configurada, arranca
        en 0 desde la primera transacción registrada — así se comporta
        correctamente para una cuenta recién reseteada.
        """
        ancla = (
            self.db.query(BalanceInicial)
            .filter(
                and_(
                    BalanceInicial.usuario_id == usuario_id,
                    BalanceInicial.moneda == moneda,
                    BalanceInicial.mes <= mes,
                )
            )
            .order_by(BalanceInicial.mes.desc())
            .first()
        )

        saldo_inicial = ancla.monto if ancla else Decimal("0")
        fecha_desde = date.fromisoformat(f"{ancla.mes}-01") if ancla else None

        anio, mes_num = (int(p) for p in mes.split("-"))
        ultimo_dia = calendar.monthrange(anio, mes_num)[1]
        fecha_hasta = date(anio, mes_num, ultimo_dia)

        query = self.db.query(
            func.coalesce(
                func.sum(case((Transaccion.tipo == "ingreso", func.abs(Transaccion.monto_ars)), else_=0)),
                0,
            ),
            func.coalesce(
                func.sum(case((Transaccion.tipo == "gasto", func.abs(Transaccion.monto_ars)), else_=0)),
                0,
            ),
        ).filter(
            Transaccion.usuario_id == usuario_id,
            Transaccion.fecha_transaccion <= fecha_hasta,
        )
        if fecha_desde:
            query = query.filter(Transaccion.fecha_transaccion >= fecha_desde)

        ingresos, gastos = query.first()
        ingresos = Decimal(ingresos)
        gastos = Decimal(gastos)
        balance_neto = saldo_inicial + ingresos - gastos

        return {
            "mes": mes,
            "moneda": moneda,
            "mes_ancla": ancla.mes if ancla else None,
            "saldo_inicial": float(saldo_inicial),
            "ingresos": float(ingresos),
            "gastos": float(gastos),
            "balance_neto": float(balance_neto),
        }

