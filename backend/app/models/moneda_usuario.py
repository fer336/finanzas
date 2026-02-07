"""
Modelo de Monedas Personalizadas por Usuario
Permite a cada usuario configurar las monedas que desea usar
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class MonedaUsuario(Base):
    """
    Modelo para monedas personalizadas por usuario
    Cada usuario puede agregar las monedas que necesite
    """
    __tablename__ = "monedas_usuario"

    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(10), nullable=False)  # ISO 4217: USD, EUR, BTC, etc.
    nombre = Column(String(100), nullable=False)  # Dólar Estadounidense, Bitcoin, etc.
    simbolo = Column(String(10), nullable=False)  # $, €, ₿, £, etc.
    
    # Configuración visual
    icono = Column(String(50), nullable=True)  # Lucide icon name: DollarSign, Bitcoin, etc.
    color = Column(String(50), default="from-blue-500 to-cyan-500")  # Gradient colors
    
    # Metadata
    es_predeterminada = Column(Boolean, default=False)  # Si es una moneda del sistema
    activa = Column(Boolean, default=True)  # Si el usuario la tiene activa
    orden = Column(Integer, default=0)  # Orden de visualización
    
    # Conversión (opcional)
    tasa_cambio_a_ars = Column(Numeric(15, 4), nullable=True)  # Tasa de conversión a ARS
    ultima_actualizacion_tasa = Column(DateTime, nullable=True)
    
    # Relación con usuario
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"))
    
    # Timestamps
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
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
            "tasa_cambio_a_ars": float(self.tasa_cambio_a_ars) if self.tasa_cambio_a_ars else None,
            "ultima_actualizacion_tasa": self.ultima_actualizacion_tasa.isoformat() if self.ultima_actualizacion_tasa else None,
            "usuario_id": str(self.usuario_id),
            "fecha_creacion": self.fecha_creacion.isoformat(),
            "fecha_actualizacion": self.fecha_actualizacion.isoformat()
        }


# Monedas predeterminadas del sistema
MONEDAS_PREDETERMINADAS = [
    {
        "codigo": "ARS",
        "nombre": "Peso Argentino",
        "simbolo": "$",
        "icono": "DollarSign",
        "color": "from-blue-500 to-cyan-500",
        "orden": 1
    },
    {
        "codigo": "USD",
        "nombre": "Dólar Estadounidense",
        "simbolo": "$",
        "icono": "DollarSign",
        "color": "from-green-500 to-emerald-500",
        "orden": 2
    },
    {
        "codigo": "EUR",
        "nombre": "Euro",
        "simbolo": "€",
        "icono": "Euro",
        "color": "from-purple-500 to-pink-500",
        "orden": 3
    },
    {
        "codigo": "BRL",
        "nombre": "Real Brasileño",
        "simbolo": "R$",
        "icono": "BanknoteIcon",
        "color": "from-yellow-500 to-orange-500",
        "orden": 4
    },
    {
        "codigo": "GBP",
        "nombre": "Libra Esterlina",
        "simbolo": "£",
        "icono": "PoundSterling",
        "color": "from-indigo-500 to-violet-500",
        "orden": 5
    }
]

