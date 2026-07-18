from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, date

# Base schema for Pagos Pendientes
class PagoPendienteBase(BaseModel):
    """Schema base para Pagos Pendientes"""
    Descripcion: str = Field(..., description="Descripción del pago pendiente")
    Monto: float = Field(..., description="Monto del pago")
    Moneda: str = Field(default="ARS", description="Moneda del pago (ARS, USD, etc.)")
    FechaVencimiento: str = Field(..., description="Fecha de vencimiento del pago")
    SegundaFechaVencimiento: Optional[date] = Field(None, description="Segundo vencimiento opcional")
    segunda_fecha_vencimiento: Optional[date] = Field(None, description="Segundo vencimiento opcional")
    Estado: str = Field(default="pendiente", description="Estado del pago (pendiente, en_mora, pagado, vencido, cancelado)")
    Tipo: str = Field(..., description="Tipo de pago (factura, servicio, prestamo, impuesto, etc.)")
    Prioridad: str = Field(default="media", description="Prioridad del pago (baja, media, alta, critica)")
    Notas: Optional[str] = Field(None, description="Notas adicionales sobre el pago")
    Recurrente: bool = Field(default=False, description="Si es un pago recurrente")
    FrecuenciaRecurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia (mensual, anual, etc.)")
    ArchivoAdjunto: Optional[str] = Field(None, description="URL del archivo adjunto (ticket, comprobante, etc.)")
    Comprobante: Optional[str] = Field(None, description="URL del comprobante de pago (imagen/pdf)")

# Schema for creating Pagos Pendientes
class PagoPendienteCreate(PagoPendienteBase):
    """Schema para crear un pago pendiente"""
    FechaCreacion: Optional[str] = Field(None, description="Fecha de creación en formato ISO")
    FechaActualizacion: Optional[str] = Field(None, description="Fecha de última actualización")

# Schema for creating Pagos Pendientes (simplified for frontend)
class PagoPendienteCreateRequest(BaseModel):
    """Schema simplificado para crear pagos pendientes desde el frontend"""
    descripcion: str = Field(..., description="Descripción del pago pendiente")
    monto: float = Field(..., description="Monto del pago")
    moneda: str = Field(default="ARS", description="Moneda del pago")
    fecha_vencimiento: str = Field(..., description="Fecha de vencimiento (YYYY-MM-DD)")
    segunda_fecha_vencimiento: Optional[date] = Field(None, description="Segundo vencimiento opcional")
    estado: str = Field(default="pendiente", description="Estado del pago")
    tipo: str = Field(..., description="Tipo de pago")
    prioridad: str = Field(default="media", description="Prioridad del pago")
    notas: Optional[str] = Field(None, description="Notas adicionales")
    recurrente: bool = Field(default=False, description="Si es recurrente")
    frecuencia_recurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia")
    categoria_id: Optional[str] = Field(None, description="ID de categoría asociada")
    metodo_pago_id: Optional[str] = Field(None, description="ID del método de pago")
    archivo_adjunto: Optional[str] = Field(None, description="URL del archivo adjunto")
    comprobante: Optional[str] = Field(None, description="URL del comprobante")

# Schema for updating Pagos Pendientes
class PagoPendienteUpdate(BaseModel):
    """Schema para actualizar un pago pendiente"""
    Descripcion: Optional[str] = Field(None, description="Descripción del pago")
    Monto: Optional[float] = Field(None, description="Monto del pago")
    Moneda: Optional[str] = Field(None, description="Moneda del pago")
    FechaVencimiento: Optional[str] = Field(None, description="Fecha de vencimiento")
    SegundaFechaVencimiento: Optional[date] = Field(None, description="Segundo vencimiento opcional")
    segunda_fecha_vencimiento: Optional[date] = Field(None, description="Segundo vencimiento opcional")
    Estado: Optional[str] = Field(None, description="Estado del pago")
    Tipo: Optional[str] = Field(None, description="Tipo de pago")
    Prioridad: Optional[str] = Field(None, description="Prioridad del pago")
    Notas: Optional[str] = Field(None, description="Notas adicionales")
    Recurrente: Optional[bool] = Field(None, description="Si es recurrente")
    FrecuenciaRecurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia")
    ArchivoAdjunto: Optional[str] = Field(None, description="URL del archivo adjunto")
    Comprobante: Optional[str] = Field(None, description="URL del comprobante")
    FechaActualizacion: Optional[str] = Field(None, description="Fecha de actualización")

# Schema for Pago Pendiente response
class PagoPendienteResponse(PagoPendienteBase):
    """Schema de respuesta completo para un pago pendiente"""
    Id: str = Field(..., description="ID único del pago pendiente")
    FechaCreacion: str = Field(..., description="Fecha de creación")
    FechaActualizacion: str = Field(..., description="Fecha de última actualización")

# Schema for simplified Pago Pendiente response
class PagoPendienteSimple(BaseModel):
    """Schema simplificado para listas de pagos pendientes"""
    id: str = Field(..., description="ID del pago pendiente")
    descripcion: str = Field(..., description="Descripción del pago")
    monto: float = Field(..., description="Monto del pago")
    moneda: str = Field(..., description="Moneda del pago")
    fecha_vencimiento: str = Field(..., description="Fecha de vencimiento")
    segunda_fecha_vencimiento: Optional[date] = Field(None, description="Segundo vencimiento opcional")
    dias_para_vencimiento: int = Field(..., description="Días para el vencimiento")
    estado: str = Field(..., description="Estado del pago")
    tipo: str = Field(..., description="Tipo de pago")
    prioridad: str = Field(..., description="Prioridad del pago")
    estado_urgencia: str = Field(..., description="Estado de urgencia (normal, proximo, vencido)")
    notas: Optional[str] = Field(None, description="Notas adicionales")
    recurrente: bool = Field(..., description="Si es recurrente")
    frecuencia_recurrencia: Optional[str] = Field(None, description="Frecuencia de recurrencia")
    archivo_adjunto: Optional[str] = Field(None, description="URL del archivo adjunto")
    comprobante: Optional[str] = Field(None, description="URL del comprobante")

# Schema for dashboard de pagos pendientes
class PagosPendientesDashboard(BaseModel):
    """Schema para dashboard de pagos pendientes"""
    total_pendientes: int = Field(..., description="Total de pagos pendientes")
    total_vencidos: int = Field(..., description="Total de pagos vencidos")
    total_proximos_7_dias: int = Field(..., description="Pagos que vencen en 7 días")
    total_proximos_30_dias: int = Field(..., description="Pagos que vencen en 30 días")
    monto_total_pendiente: float = Field(..., description="Monto total pendiente")
    monto_total_vencido: float = Field(..., description="Monto total vencido")
    monto_proximos_7_dias: float = Field(..., description="Monto de pagos próximos (7 días)")
    monto_proximos_30_dias: float = Field(..., description="Monto de pagos próximos (30 días)")
    pagos_criticos: List[Dict[str, Any]] = Field(..., description="Lista de pagos críticos")
    proximos_vencimientos: List[Dict[str, Any]] = Field(..., description="Próximos vencimientos")

# Schema for marcar como pagado
class MarcarComoPagado(BaseModel):
    """Schema para marcar un pago como completado"""
    fecha_pago: str = Field(..., description="Fecha en que se realizó el pago")
    monto_pagado: Optional[float] = Field(None, description="Monto pagado (si difiere del original)")
    metodo_pago_id: Optional[str] = Field(None, description="ID del método de pago utilizado")
    notas_pago: Optional[str] = Field(None, description="Notas sobre el pago realizado")
    archivo_adjunto: Optional[str] = Field(None, description="URL del comprobante de pago")
    crear_transaccion: bool = Field(default=True, description="Si crear automáticamente la transacción")

# Enums for validation
class EstadoPago(str):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    VENCIDO = "vencido"
    EN_MORA = "en_mora"
    CANCELADO = "cancelado"
    PARCIAL = "parcial"

class TipoPago(str):
    FACTURA = "factura"
    SERVICIO = "servicio"
    PRESTAMO = "prestamo"
    IMPUESTO = "impuesto"
    ALQUILER = "alquiler"
    TARJETA_CREDITO = "tarjeta_credito"
    SEGURO = "seguro"
    SUSCRIPCION = "suscripcion"
    OTRO = "otro"

class PrioridadPago(str):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"

class EstadoUrgencia(str):
    NORMAL = "normal"
    PROXIMO = "proximo"
    VENCIDO = "vencido"
    CRITICO = "critico"

class FrecuenciaRecurrencia(str):
    DIARIO = "diario"
    SEMANAL = "semanal"
    MENSUAL = "mensual"
    BIMESTRAL = "bimestral"
    TRIMESTRAL = "trimestral"
    SEMESTRAL = "semestral"
    ANUAL = "anual"
