"""
SQLAlchemy database models
"""

from sqlalchemy import (
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    Boolean,
    Text,
    JSON,
    Integer,
    ForeignKey,
    CheckConstraint,
    Index,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    is_active = Column("active", Boolean, default=True, index=True)
    google_id = Column(String(255), nullable=True, index=True)  # Google OAuth ID
    moneda_preferida = Column(String(3), default="ARS")
    timezone = Column(String(50), default="America/Argentina/Buenos_Aires")
    avatar_url = Column(Text, nullable=True)
    configuracion_notificaciones = Column(JSONB, default={"push": False, "email": True})
    tema_preferido = Column(String(20), default="claro")
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    picture = Column(Text, nullable=True)

    # Relationships
    transacciones = relationship(
        "Transaccion", back_populates="usuario", cascade="all, delete-orphan"
    )
    pagos_pendientes = relationship(
        "PagoPendiente", back_populates="usuario", cascade="all, delete-orphan"
    )
    prestamos = relationship(
        "Prestamo", back_populates="usuario", cascade="all, delete-orphan"
    )
    monedas = relationship(
        "MonedaUsuario", back_populates="usuario", cascade="all, delete-orphan"
    )
    balances_iniciales = relationship(
        "BalanceInicial", back_populates="usuario", cascade="all, delete-orphan"
    )


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    key_hash = Column(String(64), nullable=False, unique=True, index=True)
    key_prefix = Column(String(16), nullable=False)
    creado_en = Column(DateTime(timezone=True), default=datetime.utcnow)
    ultimo_uso = Column(DateTime(timezone=True), nullable=True)
    revocado_en = Column(DateTime(timezone=True), nullable=True)

    usuario = relationship("Usuario")


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)  # ingreso, gasto
    color = Column(String(7), nullable=True)
    icono = Column(String(50), nullable=True)
    activa = Column(Boolean, default=True)
    descripcion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Multi-tenancy: cada categoría pertenece a un usuario
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    transacciones = relationship("Transaccion", back_populates="categoria")
    pagos_pendientes = relationship("PagoPendiente", back_populates="categoria")
    usuario = relationship("Usuario", foreign_keys=[usuario_id])


class MetodoPago(Base):
    __tablename__ = "metodos_pago"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(50), nullable=True)
    activo = Column(Boolean, default=True)
    color = Column(String(7), nullable=True)
    icono = Column(String(50), nullable=True)
    descripcion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Multi-tenancy: cada método de pago pertenece a un usuario
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    transacciones = relationship("Transaccion", back_populates="metodo_pago")
    pagos_pendientes = relationship("PagoPendiente", back_populates="metodo_pago")
    usuario = relationship("Usuario", foreign_keys=[usuario_id])


class Transaccion(Base):
    __tablename__ = "transacciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    monto = Column(Numeric(15, 2), nullable=True)
    moneda = Column(String(3), default="ARS")
    monto_ars = Column(Numeric(15, 2), nullable=False)
    tasa_cambio = Column(Numeric(10, 4), default=1.0)
    descripcion = Column(Text, nullable=True)
    fecha_transaccion = Column(
        Date, nullable=False, default=datetime.utcnow, index=True
    )
    tipo = Column(String(20), nullable=False, index=True)  # ingreso, gasto
    notas = Column(Text, nullable=True)
    archivo_adjunto = Column(Text, nullable=True)
    comprobante = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # 💳 Tarjetas de Crédito
    es_credito = Column(Boolean, default=False)  # Si es gasto con tarjeta de crédito
    fecha_pago_real = Column(Date, nullable=True)  # Fecha en que se pagó el resumen
    resumen_tarjeta_id = Column(
        UUID(as_uuid=True), nullable=True
    )  # ID del resumen al que pertenece

    # 🎯 Objetivos de Ahorro
    es_aporte_objetivo = Column(
        Boolean, default=True
    )  # Si suma (True) o resta (False) del objetivo

    # Foreign Keys
    categoria_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categorias.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )
    metodo_pago_id = Column(
        UUID(as_uuid=True),
        ForeignKey("metodos_pago.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    objetivo_id = Column(
        UUID(as_uuid=True),
        ForeignKey("objetivos_ahorro.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    categoria = relationship("Categoria", back_populates="transacciones")
    metodo_pago = relationship("MetodoPago", back_populates="transacciones")
    usuario = relationship("Usuario", back_populates="transacciones")
    objetivo = relationship("ObjetivoAhorro", back_populates="transacciones")

    # Check constraint
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('ingreso', 'gasto')", name="transacciones_tipo_check"
        ),
        Index("idx_transacciones_usuario_fecha", "usuario_id", "fecha_transaccion"),
        Index(
            "idx_transacciones_mes_anio",
            text("EXTRACT(year FROM fecha_transaccion)"),
            text("EXTRACT(month FROM fecha_transaccion)"),
        ),
    )


class PagoPendiente(Base):
    __tablename__ = "pagospendientes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(Text, nullable=True)
    descripcion = Column(Text, nullable=True)
    monto = Column(Numeric, nullable=True)
    moneda = Column(String(50), nullable=True)
    fechavencimiento = Column(Date, nullable=True)
    fechacreacion = Column(DateTime, default=datetime.utcnow)
    fechaactualizacion = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    prioridad = Column(String(50), nullable=True)
    tipo = Column(String(50), nullable=True)
    proximovencimiento = Column(Date, nullable=True)
    notas = Column(Text, nullable=True)
    interes = Column(Numeric, nullable=True)
    recargo = Column(Numeric, nullable=True)
    fecha_emision = Column(Text, nullable=True)
    liquidacion = Column(Text, nullable=True)
    periodo = Column(Text, nullable=True)
    deuda_registrada = Column(JSON, nullable=True)
    url_pdf = Column(Text, nullable=True)
    num_factura = Column(Text, nullable=True)
    incluirencuotaalimentaria = Column(Boolean, default=False)
    gastocompartido = Column(Boolean, default=False)
    estado = Column(String(50), default="pendiente")
    fechapago = Column(Date, nullable=True)
    comprobante = Column(Text, nullable=True)

    # Foreign Keys
    categorias_id = Column(
        UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=True
    )
    metodos_pago_id = Column(
        UUID(as_uuid=True), ForeignKey("metodos_pago.id"), nullable=True
    )
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Relationships
    categoria = relationship("Categoria", back_populates="pagos_pendientes")
    metodo_pago = relationship("MetodoPago", back_populates="pagos_pendientes")
    usuario = relationship("Usuario", back_populates="pagos_pendientes")

    __table_args__ = (
        Index(
            "idx_pagospendientes_usuario_vencimiento", "usuario_id", "fechavencimiento"
        ),
    )


class Prestamo(Base):
    """Préstamo tomado por el usuario: monto recibido vs. monto a devolver,
    con fecha de vencimiento y de dónde vino (nombre_fuente)."""

    __tablename__ = "prestamos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_fuente = Column(Text, nullable=False)  # quién prestó (banco/persona)
    monto_prestado = Column(Numeric(15, 2), nullable=False)
    monto_a_devolver = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(10), nullable=False, default="ARS")
    fecha_vencimiento = Column(Date, nullable=False)
    fecha_pago = Column(Date, nullable=True)
    estado = Column(String(50), nullable=False, default="pendiente")
    notas = Column(Text, nullable=True)
    comprobante = Column(Text, nullable=True)

    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    usuario = relationship("Usuario", back_populates="prestamos")

    __table_args__ = (
        Index("idx_prestamos_usuario_vencimiento", "usuario_id", "fecha_vencimiento"),
    )


class ObjetivoFinanciero(Base):
    __tablename__ = "objetivos_financieros"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    monto_objetivo = Column(Numeric(15, 2), nullable=False)
    monto_actual = Column(Numeric(15, 2), default=0)
    fecha_inicio = Column(Date, nullable=True)
    fecha_limite = Column(Date, nullable=True)
    estado = Column(String(50), default="activo")
    prioridad = Column(String(50), nullable=True)
    categoria = Column(String(100), nullable=True)
    notas = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    usuarios_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)


class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    monto_limite = Column(Numeric(15, 2), nullable=False)  # Renamed from monto_total
    monto_gastado = Column(Numeric(15, 2), default=0)  # Track spending
    periodo = Column(
        String(20), default="mensual"
    )  # mensual, semanal, anual, personalizado
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    alerta_porcentaje = Column(Integer, default=80)  # Alert threshold
    estado = Column(String(50), default="activo")  # activo, completado, excedido
    color = Column(String(7), default="#4CAF50")
    categoria_id = Column(
        UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=True
    )  # Optional category
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    categoria = relationship("Categoria")
    usuario = relationship("Usuario")


class TipoCambio(Base):
    __tablename__ = "tipos_cambio"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moneda_origen = Column(String(3), nullable=False)
    moneda_destino = Column(String(3), nullable=False)
    tasa = Column(Numeric(10, 4), nullable=False)
    fecha = Column(Date, nullable=False)
    fuente = Column(String(100), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)


class ObjetivoAhorro(Base):
    __tablename__ = "objetivos_ahorro"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)

    # Meta
    monto_objetivo = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(3), default="ARS")

    # Progreso
    monto_actual = Column(Numeric(15, 2), default=0)
    porcentaje_completado = Column(Numeric(5, 2), default=0)

    # Fechas
    fecha_inicio = Column(Date, nullable=False, default=datetime.utcnow)
    fecha_objetivo = Column(Date, nullable=True)

    # Estado
    estado = Column(
        String(20), default="en_progreso"
    )  # pendiente, en_progreso, completado, cancelado

    # Metadata
    icono = Column(String(50), nullable=True)
    notas = Column(Text, nullable=True)
    prioridad = Column(String(20), default="media")  # baja, media, alta
    tipo = Column(String(50), nullable=True)  # viaje, compra, inversion, emergencia

    # Referencias
    categoria_id = Column(
        UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=True
    )
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    categoria = relationship("Categoria")
    usuario = relationship("Usuario")
    aportes = relationship(
        "AporteObjetivo", back_populates="objetivo", cascade="all, delete-orphan"
    )
    transacciones = relationship("Transaccion", back_populates="objetivo")


class AporteObjetivo(Base):
    __tablename__ = "aportes_objetivo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    objetivo_id = Column(
        UUID(as_uuid=True),
        ForeignKey("objetivos_ahorro.id", ondelete="CASCADE"),
        nullable=False,
    )
    monto = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(10), default="ARS")
    fecha = Column(Date, nullable=False, default=datetime.utcnow)
    descripcion = Column(Text, nullable=True)
    tipo = Column(
        String(50), nullable=True
    )  # efectivo, inversion, cuenta, transferencia
    referencia_id = Column(
        UUID(as_uuid=True), nullable=True
    )  # ID de transaccion, inversion, etc
    tipo_referencia = Column(
        String(50), nullable=True
    )  # transaccion, inversion, cuenta_bancaria
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    objetivo = relationship("ObjetivoAhorro", back_populates="aportes")


class MonedaUsuario(Base):
    """
    Modelo para monedas personalizadas por usuario
    Permite a cada usuario configurar las monedas que desea usar
    """

    __tablename__ = "monedas_usuario"

    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(10), nullable=False)  # ISO 4217: USD, EUR, BTC, etc.
    nombre = Column(String(100), nullable=False)  # Dólar Estadounidense, Bitcoin, etc.
    simbolo = Column(String(10), nullable=False)  # $, €, ₿, £, etc.

    # Configuración visual
    icono = Column(
        String(50), nullable=True
    )  # Lucide icon name: DollarSign, Bitcoin, etc.
    color = Column(String(50), default="from-blue-500 to-cyan-500")  # Gradient colors

    # Metadata
    es_predeterminada = Column(Boolean, default=False)  # Si es una moneda del sistema
    activa = Column(Boolean, default=True)  # Si el usuario la tiene activa
    orden = Column(Integer, default=0)  # Orden de visualización

    # Conversión (opcional)
    tasa_cambio_a_ars = Column(
        Numeric(15, 4), nullable=True
    )  # Tasa de conversión a ARS
    ultima_actualizacion_tasa = Column(DateTime(timezone=True), nullable=True)

    # Relación con usuario
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    usuario = relationship("Usuario", back_populates="monedas")

    def __repr__(self):
        return f"<MonedaUsuario {self.codigo}: {self.nombre}>"

    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            "id": str(self.id),
            "codigo": self.codigo,
            "nombre": self.nombre,
            "simbolo": self.simbolo,
            "icono": self.icono,
            "color": self.color,
            "es_predeterminada": self.es_predeterminada,
            "activa": self.activa,
            "orden": self.orden,
            "tasa_cambio_a_ars": float(self.tasa_cambio_a_ars)
            if self.tasa_cambio_a_ars
            else None,
            "ultima_actualizacion_tasa": self.ultima_actualizacion_tasa.isoformat()
            if self.ultima_actualizacion_tasa
            else None,
            "usuario_id": str(self.usuario_id),
            "fecha_creacion": self.fecha_creacion.isoformat(),
            "fecha_actualizacion": self.fecha_actualizacion.isoformat(),
        }


class BalanceInicial(Base):
    """
    Balance inicial de un mes específico para una moneda específica
    Permite al usuario configurar el balance inicial de cada mes
    """

    __tablename__ = "balance_inicial_mes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Mes en formato YYYY-MM (ej: "2026-02")
    mes = Column(String(7), nullable=False, index=True)

    # Código de moneda (ARS, USD, EUR, etc.)
    moneda = Column(String(10), nullable=False)

    # Monto del balance inicial
    monto = Column(Numeric(15, 2), nullable=False, default=0)

    # Metadatos
    creado_en = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    actualizado_en = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relaciones
    usuario = relationship("Usuario", back_populates="balances_iniciales")

    # Constraint: Un usuario solo puede tener un balance inicial por mes y moneda
    __table_args__ = (
        Index("idx_balance_inicial_usuario_mes", "usuario_id", "mes"),
        CheckConstraint("monto >= 0", name="check_monto_positive"),
        UniqueConstraint("usuario_id", "mes", "moneda", name="uq_usuario_mes_moneda"),
    )

    def __repr__(self):
        return f"<BalanceInicial {self.mes} {self.moneda}: {self.monto}>"

    def to_dict(self):
        """Convertir a diccionario para JSON"""
        return {
            "id": str(self.id),
            "usuario_id": str(self.usuario_id),
            "mes": self.mes,
            "moneda": self.moneda,
            "monto": float(self.monto),
            "creado_en": self.creado_en.isoformat(),
            "actualizado_en": self.actualizado_en.isoformat(),
        }
