"""
DTOs para Pagos Pendientes
"""
from datetime import date, datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import AliasChoices, Field, field_validator
from enum import Enum

from .base import BaseDTO, TimestampMixin, ActiveMixin


class EstadoPago(str, Enum):
    """Estados posibles de un pago"""
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    EN_MORA = "en_mora"
    VENCIDO = "vencido"
    CANCELADO = "cancelado"


class PrioridadPago(str, Enum):
    """Prioridades de pago"""
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"


class TipoPago(str, Enum):
    """Tipos de pago"""
    UNICO = "unico"
    RECURRENTE = "recurrente"
    MENSUAL = "mensual"
    ANUAL = "anual"


class MonedaType(str, Enum):
    """Tipos de moneda"""
    ARS = "ARS"
    USD = "USD"


class CategoriaDTO(BaseDTO):
    """DTO para Categoría"""
    nombre: str = Field(..., alias="Nombre")
    tipo: str = Field(..., alias="Tipo")
    color: Optional[str] = Field(None, alias="Color")
    icono: Optional[str] = Field(None, alias="Icono")
    activa: bool = Field(True, alias="Activa")
    descripcion: Optional[str] = Field(None, alias="Descripcion")


class MetodoPagoDTO(BaseDTO):
    """DTO para Método de Pago"""
    nombre: str = Field(..., alias="Nombre")
    tipo: str = Field(..., alias="Tipo")
    activo: bool = Field(True, alias="Activo")
    color: Optional[str] = Field(None, alias="Color")
    icono: Optional[str] = Field(None, alias="Icono")
    descripcion: Optional[str] = Field(None, alias="Descripcion")


class UsuarioDTO(BaseDTO):
    """DTO para Usuario"""
    email: str = Field(..., alias="Email")
    nombre_completo: str = Field(..., alias="NombreCompleto")
    activo: bool = Field(True, alias="Activo")
    moneda_preferida: MonedaType = Field(MonedaType.ARS, alias="MonedaPreferida")
    timezone: str = Field("America/Argentina/Buenos_Aires", alias="Timezone")
    avatar_url: Optional[str] = Field(None, alias="AvatarUrl")
    configuracion_notificaciones: Optional[Dict[str, Any]] = Field(None, alias="ConfiguracionNotificaciones")
    tema_preferido: str = Field("dark", alias="TemaPreferido")


class PagoPendienteCreateDTO(BaseDTO, TimestampMixin, ActiveMixin):
    """DTO para crear un pago pendiente"""
    nombre: str = Field(..., min_length=1, max_length=255, alias="Nombre")
    descripcion: Optional[str] = Field(None, alias="Descripcion")
    monto: float = Field(..., gt=0, alias="Monto")
    moneda: MonedaType = Field(MonedaType.ARS, alias="Moneda")
    fechavencimiento: date = Field(..., alias="Fechavencimiento")
    segunda_fecha_vencimiento: Optional[date] = Field(
        None,
        validation_alias=AliasChoices(
            "segunda_fecha_vencimiento",
            "segundaFechaVencimiento",
            "SegundaFechaVencimiento",
            "fecha_segundo_vencimiento",
            "fechasegundovencimiento",
        ),
    )
    estado: EstadoPago = Field(EstadoPago.PENDIENTE, alias="Estado")
    prioridad: PrioridadPago = Field(PrioridadPago.MEDIA, alias="Prioridad")
    tipo: TipoPago = Field(TipoPago.UNICO, alias="Tipo")
    frecuenciarecurrencia: Optional[int] = Field(None, alias="Frecuenciarecurrencia")
    proximovencimiento: Optional[date] = Field(None, alias="Proximovencimiento")
    notas: Optional[str] = Field(None, alias="Notas")
    interes: float = Field(0.0, alias="Interes")
    recargo: float = Field(0.0, alias="Recargo")
    diasgracia: int = Field(0, alias="Diasgracia")
    creadopor: Optional[str] = Field(None, alias="Creadopor")
    fecha_emision: Optional[str] = Field(None, alias="fecha_emision")
    liquidacion: Optional[str] = Field(None, alias="liquidacion")
    periodo: Optional[str] = Field(None, alias="periodo")
    deuda_registrada: Optional[Dict[str, Any]] = Field(None, alias="deuda_registrada")
    pagada: bool = Field(False, alias="pagada")
    url_pdf: Optional[str] = Field(None, alias="url_pdf")
    comprobante: Optional[str] = Field(None, alias="Comprobante")
    num_factura: Optional[str] = Field(None, alias="num_factura")
    usuarios_id: Optional[UUID] = Field(None, alias="usuarios_id")
    categorias_id: Optional[UUID] = Field(None, alias="categorias_id")
    metodos_pago_id: Optional[UUID] = Field(None, alias="metodos_pago_id")


class PagoPendienteUpdateDTO(BaseDTO, TimestampMixin):
    """DTO para actualizar un pago pendiente"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255, alias="Nombre")
    descripcion: Optional[str] = Field(None, alias="Descripcion")
    monto: Optional[float] = Field(None, gt=0, alias="Monto")
    moneda: Optional[MonedaType] = Field(None, alias="Moneda")
    fechavencimiento: Optional[date] = Field(None, alias="Fechavencimiento")
    segunda_fecha_vencimiento: Optional[date] = Field(
        None,
        validation_alias=AliasChoices(
            "segunda_fecha_vencimiento",
            "segundaFechaVencimiento",
            "SegundaFechaVencimiento",
            "fecha_segundo_vencimiento",
            "fechasegundovencimiento",
        ),
    )
    fechapago: Optional[date] = Field(None, alias="Fechapago")
    estado: Optional[EstadoPago] = Field(None, alias="Estado")
    prioridad: Optional[PrioridadPago] = Field(None, alias="Prioridad")
    tipo: Optional[TipoPago] = Field(None, alias="Tipo")
    frecuenciarecurrencia: Optional[int] = Field(None, alias="Frecuenciarecurrencia")
    proximovencimiento: Optional[date] = Field(None, alias="Proximovencimiento")
    notas: Optional[str] = Field(None, alias="Notas")
    interes: Optional[float] = Field(None, alias="Interes")
    recargo: Optional[float] = Field(None, alias="Recargo")
    diasgracia: Optional[int] = Field(None, alias="Diasgracia")
    modificadopor: Optional[str] = Field(None, alias="Modificadopor")
    fecha_emision: Optional[str] = Field(None, alias="fecha_emision")
    liquidacion: Optional[str] = Field(None, alias="liquidacion")
    periodo: Optional[str] = Field(None, alias="periodo")
    deuda_registrada: Optional[Dict[str, Any]] = Field(None, alias="deuda_registrada")
    pagada: Optional[bool] = Field(None, alias="pagada")
    url_pdf: Optional[str] = Field(None, alias="url_pdf")
    comprobante: Optional[str] = Field(None, alias="Comprobante")
    num_factura: Optional[str] = Field(None, alias="num_factura")
    usuarios_id: Optional[UUID] = Field(None, alias="usuarios_id")
    categorias_id: Optional[UUID] = Field(None, alias="categorias_id")
    metodos_pago_id: Optional[UUID] = Field(None, alias="metodos_pago_id")


class PagoPendienteResponseDTO(BaseDTO, TimestampMixin, ActiveMixin):
    """DTO para respuesta de pago pendiente"""
    id: UUID = Field(..., alias="Id")
    nombre: str = Field(..., alias="Nombre")
    descripcion: Optional[str] = Field(None, alias="Descripcion")
    monto: float = Field(..., alias="Monto")
    moneda: MonedaType = Field(..., alias="Moneda")
    fechavencimiento: date = Field(..., alias="Fechavencimiento")
    segunda_fecha_vencimiento: Optional[date] = Field(
        None,
        validation_alias=AliasChoices(
            "segunda_fecha_vencimiento",
            "segundaFechaVencimiento",
            "SegundaFechaVencimiento",
            "fecha_segundo_vencimiento",
            "fechasegundovencimiento",
        ),
    )
    fechapago: Optional[date] = Field(None, alias="Fechapago")
    estado: EstadoPago = Field(..., alias="Estado")
    prioridad: PrioridadPago = Field(..., alias="Prioridad")
    tipo: TipoPago = Field(..., alias="Tipo")
    frecuenciarecurrencia: Optional[int] = Field(None, alias="Frecuenciarecurrencia")
    proximovencimiento: Optional[date] = Field(None, alias="Proximovencimiento")
    notas: Optional[str] = Field(None, alias="Notas")
    interes: float = Field(0.0, alias="Interes")
    recargo: float = Field(0.0, alias="Recargo")
    diasgracia: int = Field(0, alias="Diasgracia")
    creadopor: Optional[str] = Field(None, alias="Creadopor")
    modificadopor: Optional[str] = Field(None, alias="Modificadopor")
    fecha_emision: Optional[str] = Field(None, alias="fecha_emision")
    liquidacion: Optional[str] = Field(None, alias="liquidacion")
    periodo: Optional[str] = Field(None, alias="periodo")
    deuda_registrada: Optional[Dict[str, Any]] = Field(None, alias="deuda_registrada")
    pagada: bool = Field(False, alias="pagada")
    url_pdf: Optional[str] = Field(None, alias="url_pdf")
    comprobante: Optional[str] = Field(None, alias="Comprobante")
    num_factura: Optional[str] = Field(None, alias="num_factura")
    usuarios_id: Optional[UUID] = Field(None, alias="usuarios_id")
    categorias_id: Optional[UUID] = Field(None, alias="categorias_id")
    metodos_pago_id: Optional[UUID] = Field(None, alias="metodos_pago_id")
    
    # Relaciones
    usuarios: Optional[UsuarioDTO] = Field(None, alias="Usuarios")
    categorias: Optional[CategoriaDTO] = Field(None, alias="Categorias")
    metodos_pago: Optional[MetodoPagoDTO] = Field(None, alias="MetodosPago")


class PagosPendientesListResponseDTO(BaseDTO):
    """DTO para respuesta de lista de pagos pendientes"""
    list: list[PagoPendienteResponseDTO]
    page_info: Dict[str, Any] = Field(..., alias="PageInfo")
    
    @field_validator('page_info', mode='before')
    def validate_page_info(cls, v):
        if isinstance(v, dict):
            return v
        return {"page": 1, "pageSize": 25, "totalRows": 0}
