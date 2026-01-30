from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal

# Nested schemas for related entities
class MetodoPagoInfo(BaseModel):
    """Información del método de pago relacionado"""
    Nombre: Optional[str] = None
    Tipo: Optional[str] = None
    Activo: Optional[bool] = None
    Color: Optional[str] = None
    Icono: Optional[str] = None
    Descripcion: Optional[str] = None
    FechaCreacion: Optional[str] = None

class UsuarioInfo(BaseModel):
    """Información del usuario relacionado"""
    Email: Optional[str] = None
    NombreCompleto: Optional[str] = None
    Activo: Optional[bool] = None
    MonedaPreferida: Optional[str] = None
    Timezone: Optional[str] = None
    AvatarUrl: Optional[str] = None
    ConfiguracionNotificaciones: Optional[Dict[str, Any]] = None
    TemaPreferido: Optional[str] = None
    FechaCreacion: Optional[str] = None
    FechaActualizacion: Optional[str] = None
    UltimoLogin: Optional[str] = None

class CategoriaInfo(BaseModel):
    """Información de la categoría relacionada"""
    Nombre: Optional[str] = None
    Tipo: Optional[str] = None
    Color: Optional[str] = None
    Icono: Optional[str] = None
    Activa: Optional[bool] = None
    Descripcion: Optional[str] = None
    FechaCreacion: Optional[str] = None
    FechaActualizacion: Optional[str] = None

# Base schema for Transacciones
class TransaccionBase(BaseModel):
    """Schema base para Transacciones"""
    Monto: float = Field(..., description="Monto de la transacción")
    Moneda: str = Field(default="ARS", description="Moneda de la transacción (ARS, USD, EUR, etc.)")
    MontoArs: Optional[float] = Field(None, description="Monto convertido a ARS")
    TasaCambio: Optional[float] = Field(None, description="Tasa de cambio utilizada")
    Descripcion: str = Field(..., description="Descripción de la transacción")
    FechaTransaccion: str = Field(..., description="Fecha de la transacción en formato ISO")
    Tipo: str = Field(..., description="Tipo de transacción (ingreso, gasto, transferencia)")
    EsRecurrente: bool = Field(default=False, description="Si es una transacción recurrente")
    FrecuenciaRecurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia")
    Etiquetas: Optional[Dict[str, Any]] = Field(None, description="Etiquetas adicionales")
    Notas: Optional[str] = Field(None, description="Notas adicionales")
    ArchivoAdjunto: Optional[str] = Field(None, description="URL del archivo adjunto")
    Comprobante: Optional[str] = Field(None, description="URL del comprobante (minio)")

# Schema for creating Transacciones (full API schema)
class TransaccionCreate(TransaccionBase):
    """Schema para crear una transacción con todos los campos de la API"""
    FechaCreacion: Optional[str] = Field(None, description="Fecha de creación en formato ISO")
    FechaActualizacion: Optional[str] = Field(None, description="Fecha de última actualización")

# Schema for creating Transacciones (simplified for frontend)
class TransaccionCreateRequest(BaseModel):
    """Schema simplificado para crear transacciones desde el frontend"""
    monto: float = Field(..., description="Monto de la transacción")
    moneda: str = Field(default="ARS", description="Moneda de la transacción")
    descripcion: str = Field(..., description="Descripción de la transacción")
    fecha_transaccion: Optional[str] = Field(None, description="Fecha de la transacción (YYYY-MM-DD)")
    tipo: str = Field(..., description="Tipo (ingreso, gasto, transferencia)")
    categoria_id: Optional[str] = Field(None, description="ID de la categoría")
    metodo_pago_id: Optional[str] = Field(None, description="ID del método de pago")
    es_recurrente: bool = Field(default=False, description="Si es recurrente")
    frecuencia_recurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia")
    notas: Optional[str] = Field(None, description="Notas adicionales")
    etiquetas: Optional[List[str]] = Field(None, description="Lista de etiquetas")
    usuario_id: Optional[str] = Field(None, description="ID del usuario propietario de la transacción (temporal: opcional)")
    comprobante: Optional[str] = Field(None, description="URL del comprobante")

# Schema for updating Transacciones
class TransaccionUpdate(BaseModel):
    """Schema para actualizar una transacción"""
    Monto: Optional[float] = Field(None, description="Monto de la transacción")
    Moneda: Optional[str] = Field(None, description="Moneda de la transacción")
    MontoArs: Optional[float] = Field(None, description="Monto en ARS")
    TasaCambio: Optional[float] = Field(None, description="Tasa de cambio")
    Descripcion: Optional[str] = Field(None, description="Descripción de la transacción")
    FechaTransaccion: Optional[str] = Field(None, description="Fecha de la transacción")
    Tipo: Optional[str] = Field(None, description="Tipo de transacción")
    EsRecurrente: Optional[bool] = Field(None, description="Si es recurrente")
    FrecuenciaRecurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia")
    Etiquetas: Optional[Dict[str, Any]] = Field(None, description="Etiquetas")
    Notas: Optional[str] = Field(None, description="Notas")
    ArchivoAdjunto: Optional[str] = Field(None, description="Archivo adjunto")
    Comprobante: Optional[str] = Field(None, description="URL del comprobante")
    FechaActualizacion: Optional[str] = Field(None, description="Fecha de actualización")

# Schema for Transaccion response (complete)
class TransaccionResponse(TransaccionBase):
    """Schema de respuesta completo para una transacción"""
    Id: str = Field(..., description="ID único de la transacción")
    FechaCreacion: str = Field(..., description="Fecha de creación")
    FechaActualizacion: str = Field(..., description="Fecha de última actualización")
    ObjetivoAportes: Optional[int] = Field(None, description="Número de aportes relacionados")
    MetodosPago: Optional[MetodoPagoInfo] = Field(None, description="Información del método de pago")
    Usuarios: Optional[UsuarioInfo] = Field(None, description="Información del usuario")
    Categorias: Optional[CategoriaInfo] = Field(None, description="Información de la categoría")

# Schema for simplified Transaccion response (for frontend lists)
class TransaccionSimple(BaseModel):
    """Schema simplificado para listas de transacciones"""
    id: str = Field(..., description="ID de la transacción")
    monto: float = Field(..., description="Monto de la transacción")
    moneda: str = Field(..., description="Moneda de la transacción")
    monto_ars: Optional[float] = Field(None, description="Monto en ARS")
    descripcion: str = Field(..., description="Descripción de la transacción")
    fecha_transaccion: str = Field(..., description="Fecha de la transacción")
    tipo: str = Field(..., description="Tipo de transacción")
    es_recurrente: bool = Field(..., description="Si es recurrente")
    notas: Optional[str] = Field(None, description="Notas")
    
    # Información relacionada
    categoria_nombre: Optional[str] = Field(None, description="Nombre de la categoría")
    categoria_tipo: Optional[str] = Field(None, description="Tipo de categoría")
    categoria_color: Optional[str] = Field(None, description="Color de la categoría")
    categoria_icono: Optional[str] = Field(None, description="Icono de la categoría")
    
    metodo_pago_nombre: Optional[str] = Field(None, description="Nombre del método de pago")
    metodo_pago_tipo: Optional[str] = Field(None, description="Tipo del método de pago")
    metodo_pago_icono: Optional[str] = Field(None, description="Icono del método de pago")
    
    usuario_email: Optional[str] = Field(None, description="Email del usuario")
    
    # Campos calculados
    dias_desde_transaccion: Optional[int] = Field(None, description="Días desde la transacción")
    es_transaccion_reciente: bool = Field(default=False, description="Si es de los últimos 7 días")

# Schema for list response
class TransaccionesListResponse(BaseModel):
    """Schema para respuesta de lista de transacciones"""
    list: List[TransaccionResponse] = Field(..., description="Lista de transacciones")
    pageInfo: Optional[Dict[str, Any]] = Field(None, description="Información de paginación")

# Schema for transaction statistics
class TransaccionStats(BaseModel):
    """Schema para estadísticas de transacciones"""
    periodo: str = Field(..., description="Período analizado")
    total_ingresos: float = Field(..., description="Total de ingresos")
    total_gastos: float = Field(..., description="Total de gastos")
    balance_neto: float = Field(..., description="Balance neto (ingresos - gastos)")
    numero_transacciones: int = Field(..., description="Número total de transacciones")
    promedio_ingreso: float = Field(..., description="Promedio de ingresos")
    promedio_gasto: float = Field(..., description="Promedio de gastos")
    transacciones_recurrentes: int = Field(..., description="Número de transacciones recurrentes")
    categorias_mas_utilizadas: List[Dict[str, Any]] = Field(..., description="Categorías más utilizadas")
    metodos_pago_mas_utilizados: List[Dict[str, Any]] = Field(..., description="Métodos de pago más utilizados")

# Schema for cash flow analysis
class AnalisisFlujoEfectivo(BaseModel):
    """Schema para análisis de flujo de efectivo"""
    fecha: str = Field(..., description="Fecha del análisis")
    ingresos_periodo: float = Field(..., description="Ingresos del período")
    gastos_periodo: float = Field(..., description="Gastos del período")
    flujo_neto: float = Field(..., description="Flujo neto del período")
    balance_acumulado: float = Field(..., description="Balance acumulado")
    tendencia: str = Field(..., description="Tendencia (positiva, negativa, estable)")

# Schema for spending by category
class GastoPorCategoria(BaseModel):
    """Schema para análisis de gastos por categoría"""
    categoria_id: str = Field(..., description="ID de la categoría")
    categoria_nombre: str = Field(..., description="Nombre de la categoría")
    total_gastado: float = Field(..., description="Total gastado en la categoría")
    numero_transacciones: int = Field(..., description="Número de transacciones")
    porcentaje_total: float = Field(..., description="Porcentaje del total de gastos")
    promedio_transaccion: float = Field(..., description="Promedio por transacción")
    tendencia_mensual: str = Field(..., description="Tendencia mensual")

# Schema for transaction import
class ImportarTransacciones(BaseModel):
    """Schema para importar transacciones masivamente"""
    archivo_tipo: str = Field(..., description="Tipo de archivo (csv, excel, json)")
    mapeo_campos: Dict[str, str] = Field(..., description="Mapeo de campos del archivo")
    validar_duplicados: bool = Field(default=True, description="Si validar duplicados")
    categoria_default: Optional[str] = Field(None, description="Categoría por defecto")
    metodo_pago_default: Optional[str] = Field(None, description="Método de pago por defecto")

# Schema for transaction filters
class FiltrosTransacciones(BaseModel):
    """Schema para filtros avanzados de transacciones"""
    fecha_desde: Optional[str] = Field(None, description="Fecha desde (YYYY-MM-DD)")
    fecha_hasta: Optional[str] = Field(None, description="Fecha hasta (YYYY-MM-DD)")
    monto_minimo: Optional[float] = Field(None, description="Monto mínimo")
    monto_maximo: Optional[float] = Field(None, description="Monto máximo")
    tipos: Optional[List[str]] = Field(None, description="Tipos de transacción")
    categorias: Optional[List[str]] = Field(None, description="IDs de categorías")
    metodos_pago: Optional[List[str]] = Field(None, description="IDs de métodos de pago")
    monedas: Optional[List[str]] = Field(None, description="Monedas")
    solo_recurrentes: Optional[bool] = Field(None, description="Solo transacciones recurrentes")
    texto_busqueda: Optional[str] = Field(None, description="Búsqueda en descripción/notas")

# Enums for validation
class TipoTransaccion(str):
    INGRESO = "ingreso"
    GASTO = "gasto"
    TRANSFERENCIA = "transferencia"
    AJUSTE = "ajuste"

class FrecuenciaRecurrencia(str):
    DIARIA = "diaria"
    SEMANAL = "semanal"
    QUINCENAL = "quincenal"
    MENSUAL = "mensual"
    BIMESTRAL = "bimestral"
    TRIMESTRAL = "trimestral"
    SEMESTRAL = "semestral"
    ANUAL = "anual"

class TendenciaTransaccion(str):
    POSITIVA = "positiva"
    NEGATIVA = "negativa"
    ESTABLE = "estable"
    CRECIENTE = "creciente"
    DECRECIENTE = "decreciente"