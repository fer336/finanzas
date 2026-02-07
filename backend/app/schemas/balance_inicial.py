"""
Pydantic schemas para Balance Inicial
"""
from pydantic import BaseModel, validator, Field
from decimal import Decimal, InvalidOperation
from typing import Optional
from datetime import datetime
import re


class BalanceInicialBase(BaseModel):
    """Schema base para Balance Inicial"""
    mes: str = Field(..., description="Mes en formato YYYY-MM (ej: 2026-02)")
    moneda: str = Field(..., min_length=3, max_length=10, description="Código de moneda (ARS, USD, EUR, etc.)")
    monto: Decimal = Field(default=Decimal('0'), ge=0, description="Monto del balance inicial (debe ser >= 0)")

    @validator('mes')
    def validate_mes(cls, v):
        """Validar formato YYYY-MM"""
        if not re.match(r'^\d{4}-(0[1-9]|1[0-2])$', v):
            raise ValueError('Formato de mes inválido. Use YYYY-MM (ej: 2026-02)')
        return v

    @validator('moneda')
    def validate_moneda(cls, v):
        """Validar código de moneda"""
        return v.upper().strip()

    class Config:
        orm_mode = True


class BalanceInicialCreate(BalanceInicialBase):
    """Schema para crear Balance Inicial"""
    pass


class BalanceInicialUpdate(BaseModel):
    """Schema para actualizar Balance Inicial (todos los campos opcionales)"""
    monto: Optional[Decimal] = Field(None, ge=0, description="Nuevo monto del balance inicial")

    class Config:
        orm_mode = True


class BalanceInicialResponse(BalanceInicialBase):
    """Schema para respuesta de Balance Inicial"""
    id: str
    usuario_id: str
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        orm_mode = True


class BalanceInicialCopyFromPreviousRequest(BaseModel):
    """Schema para copiar balances del mes anterior"""
    mes_destino: str = Field(..., description="Mes destino en formato YYYY-MM")

    @validator('mes_destino')
    def validate_mes_destino(cls, v):
        if not re.match(r'^\d{4}-(0[1-9]|1[0-2])$', v):
            raise ValueError('Formato de mes inválido. Use YYYY-MM')
        return v

    class Config:
        orm_mode = True


class BalanceInicialBulkCreateRequest(BaseModel):
    """Schema para crear múltiples balances iniciales a la vez"""
    mes: str = Field(..., description="Mes en formato YYYY-MM")
    balances: list[dict] = Field(..., description="Lista de balances por moneda: [{'moneda': 'ARS', 'monto': 1000}, ...]")

    @validator('mes')
    def validate_mes(cls, v):
        if not re.match(r'^\d{4}-(0[1-9]|1[0-2])$', v):
            raise ValueError('Formato de mes inválido. Use YYYY-MM')
        return v

    @validator('balances')
    def validate_balances(cls, v):
        if not v:
            raise ValueError('Debe proporcionar al menos un balance')
        
        # Validar cada balance
        for balance in v:
            if 'moneda' not in balance or 'monto' not in balance:
                raise ValueError('Cada balance debe tener "moneda" y "monto"')
            
            # Validar monto
            try:
                monto = Decimal(str(balance['monto']))
                if monto < 0:
                    raise ValueError(f'Monto debe ser >= 0 para {balance["moneda"]}')
            except (ValueError, InvalidOperation):
                raise ValueError(f'Monto inválido para {balance["moneda"]}')
        
        return v

    class Config:
        orm_mode = True

