"""
SQLAlchemy database models
"""
from sqlalchemy import Column, String, Numeric, Date, DateTime, Boolean, Text, JSON, Integer, ForeignKey, CheckConstraint, Index, text
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
    moneda_preferida = Column(String(3), default="ARS")
    timezone = Column(String(50), default="America/Argentina/Buenos_Aires")
    avatar_url = Column(Text, nullable=True)
    configuracion_notificaciones = Column(JSONB, default={"push": False, "email": True})
    tema_preferido = Column(String(20), default="claro")
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    picture = Column(Text, nullable=True)
    
    # Relationships
    transacciones = relationship("Transaccion", back_populates="usuario", cascade="all, delete-orphan")
    pagos_pendientes = relationship("PagoPendiente", back_populates="usuario", cascade="all, delete-orphan")
    resumenes_bancarios = relationship("ResumenBancario", back_populates="usuario", cascade="all, delete-orphan")


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
    fecha_actualizacion = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Multi-tenancy: cada categoría pertenece a un usuario
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    
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
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    
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
    fecha_transaccion = Column(Date, nullable=False, default=datetime.utcnow, index=True)
    tipo = Column(String(20), nullable=False, index=True)  # ingreso, gasto
    notas = Column(Text, nullable=True)
    archivo_adjunto = Column(Text, nullable=True)
    comprobante = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 💳 Tarjetas de Crédito
    es_credito = Column(Boolean, default=False)  # Si es gasto con tarjeta de crédito
    fecha_pago_real = Column(Date, nullable=True)  # Fecha en que se pagó el resumen
    resumen_tarjeta_id = Column(UUID(as_uuid=True), nullable=True)  # ID del resumen al que pertenece
    
    # 🎯 Objetivos de Ahorro
    es_aporte_objetivo = Column(Boolean, default=True)  # Si suma (True) o resta (False) del objetivo
    
    # Foreign Keys
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    metodo_pago_id = Column(UUID(as_uuid=True), ForeignKey("metodos_pago.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=True, index=True)
    objetivo_id = Column(UUID(as_uuid=True), ForeignKey("objetivos_ahorro.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Relationships
    categoria = relationship("Categoria", back_populates="transacciones")
    metodo_pago = relationship("MetodoPago", back_populates="transacciones")
    usuario = relationship("Usuario", back_populates="transacciones")
    objetivo = relationship("ObjetivoAhorro", back_populates="transacciones")
    
    # Check constraint
    __table_args__ = (
        CheckConstraint("tipo IN ('ingreso', 'gasto')", name="transacciones_tipo_check"),
        Index("idx_transacciones_usuario_fecha", "usuario_id", "fecha_transaccion"),
        Index("idx_transacciones_mes_anio", text("EXTRACT(year FROM fecha_transaccion)"), text("EXTRACT(month FROM fecha_transaccion)")),
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
    fechaactualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
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
    categorias_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=True)
    metodos_pago_id = Column(UUID(as_uuid=True), ForeignKey("metodos_pago.id"), nullable=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Relationships
    categoria = relationship("Categoria", back_populates="pagos_pendientes")
    metodo_pago = relationship("MetodoPago", back_populates="pagos_pendientes")
    usuario = relationship("Usuario", back_populates="pagos_pendientes")
    
    __table_args__ = (
        Index("idx_pagospendientes_usuario_vencimiento", "usuario_id", "fechavencimiento"),
    )


class ResumenBancario(Base):
    __tablename__ = "resumen_bancario"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información básica de la tarjeta
    banco = Column(String(100), nullable=True)
    tipo_tarjeta = Column(String(50), nullable=True)
    numero_resumen = Column(String(100), nullable=True)
    numero_cuenta = Column(String(50), nullable=True)
    url_factura = Column(Text, nullable=True)
    
    # Objetos JSON con información estructurada
    titular = Column(JSONB, nullable=True)  # nombre, sucursal, direccion, localidad, provincia, numero_socio, codigo_postal
    ciclo_facturacion = Column(JSONB, nullable=True)  # cierre_actual, proximo_cierre, vencimiento_actual, etc.
    totales = Column(JSONB, nullable=True)  # pago_minimo_pesos, saldo_actual_pesos, saldo_actual_dolares
    limites = Column(JSONB, nullable=True)  # compras, adelanto, financiacion, compras_cuotas
    tasas = Column(JSONB, nullable=True)  # tem_pesos, tna_pesos, tem_dolares, tna_dolares
    movimientos = Column(JSONB, nullable=True)  # pagos_mes_pesos, consumos_mes_pesos, saldo_anterior_pesos
    cargos = Column(JSONB, nullable=True)  # iva_21, impuesto_sellos, comision_mantenimiento, intereses_financiacion
    
    # Información de estado de pago
    minimo_pagado = Column(Boolean, default=False)
    total_pagado = Column(Boolean, default=False)
    fecha_pago_minimo = Column(DateTime(timezone=True), nullable=True)
    fecha_pago_total = Column(DateTime(timezone=True), nullable=True)
    
    # Fechas de control
    fecha_carga = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Key
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=True)
    
    # Relationships
    usuario = relationship("Usuario", back_populates="resumenes_bancarios")
    pagos = relationship("PagoResumenBancario", back_populates="resumen_bancario", cascade="all, delete-orphan")


class PagoResumenBancario(Base):
    """
    Historial de pagos realizados para resúmenes bancarios.
    Permite rastrear pagos totales, mínimos y parciales.
    """
    __tablename__ = "pagos_resumen_bancario"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    resumen_bancario_id = Column(UUID(as_uuid=True), ForeignKey("resumen_bancario.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Información del pago
    fecha_pago = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    monto_pesos = Column(Numeric(15, 2), default=0, nullable=False)
    monto_usd = Column(Numeric(15, 2), default=0, nullable=False)
    tipo_pago = Column(String(20), nullable=False, index=True)  # 'total', 'minimo', 'parcial'
    tipo_cambio = Column(Numeric(10, 2), nullable=True)
    
    # Transacciones asociadas (Array de UUIDs)
    transaccion_ids = Column(JSONB, nullable=True)
    
    # Categorización del pago
    metodo_pago_id = Column(UUID(as_uuid=True), nullable=True)
    categoria_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Información adicional
    notas = Column(Text, nullable=True)
    comprobante = Column(String(500), nullable=True)
    
    # Usuario que registró el pago
    usuario_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Timestamp de creación
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    resumen_bancario = relationship("ResumenBancario", back_populates="pagos")
    
    def __repr__(self):
        return f"<PagoResumenBancario(id={self.id}, resumen={self.resumen_bancario_id}, tipo={self.tipo_pago}, ARS={self.monto_pesos}, USD={self.monto_usd})>"


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
    fecha_actualizacion = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    usuarios_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)


class Presupuesto(Base):
    __tablename__ = "presupuestos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    monto_limite = Column(Numeric(15, 2), nullable=False)  # Renamed from monto_total
    monto_gastado = Column(Numeric(15, 2), default=0)  # Track spending
    periodo = Column(String(20), default="mensual")  # mensual, semanal, anual, personalizado
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    alerta_porcentaje = Column(Integer, default=80)  # Alert threshold
    estado = Column(String(50), default="activo")  # activo, completado, excedido
    color = Column(String(7), default="#4CAF50")
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=True)  # Optional category
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    estado = Column(String(20), default="en_progreso")  # pendiente, en_progreso, completado, cancelado
    
    # Metadata
    icono = Column(String(50), nullable=True)
    notas = Column(Text, nullable=True)
    prioridad = Column(String(20), default="media")  # baja, media, alta
    tipo = Column(String(50), nullable=True)  # viaje, compra, inversion, emergencia
    
    # Referencias
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    categoria = relationship("Categoria")
    usuario = relationship("Usuario")
    aportes = relationship("AporteObjetivo", back_populates="objetivo", cascade="all, delete-orphan")
    transacciones = relationship("Transaccion", back_populates="objetivo")


class AporteObjetivo(Base):
    __tablename__ = "aportes_objetivo"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    objetivo_id = Column(UUID(as_uuid=True), ForeignKey("objetivos_ahorro.id", ondelete="CASCADE"), nullable=False)
    monto = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(10), default="ARS")
    fecha = Column(Date, nullable=False, default=datetime.utcnow)
    descripcion = Column(Text, nullable=True)
    tipo = Column(String(50), nullable=True)  # efectivo, inversion, cuenta, transferencia
    referencia_id = Column(UUID(as_uuid=True), nullable=True)  # ID de transaccion, inversion, etc
    tipo_referencia = Column(String(50), nullable=True)  # transaccion, inversion, cuenta_bancaria
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    objetivo = relationship("ObjetivoAhorro", back_populates="aportes")

