"""add monedas_usuario table for custom currencies

Revision ID: add_monedas_usuario
Revises: remove_es_global_cat
Create Date: 2026-02-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_monedas_usuario'
down_revision = None  # No depende de ninguna migración anterior
branch_labels = None
depends_on = None


def upgrade():
    """
    Crear tabla monedas_usuario para permitir a los usuarios
    personalizar las monedas que usan en sus transacciones
    """
    # Crear tabla monedas_usuario
    op.create_table(
        'monedas_usuario',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('codigo', sa.String(length=10), nullable=False, comment='Código ISO: USD, EUR, BTC, etc.'),
        sa.Column('nombre', sa.String(length=100), nullable=False, comment='Nombre completo: Dólar Estadounidense'),
        sa.Column('simbolo', sa.String(length=10), nullable=False, comment='Símbolo: $, €, £, ₿'),
        sa.Column('icono', sa.String(length=50), nullable=True, comment='Lucide icon name: DollarSign, Bitcoin, etc.'),
        sa.Column('color', sa.String(length=50), nullable=True, server_default='from-blue-500 to-cyan-500', comment='Tailwind gradient classes'),
        sa.Column('es_predeterminada', sa.Boolean(), nullable=False, server_default='false', comment='Si es una moneda del sistema'),
        sa.Column('activa', sa.Boolean(), nullable=False, server_default='true', comment='Si el usuario la tiene activa'),
        sa.Column('orden', sa.Integer(), nullable=False, server_default='0', comment='Orden de visualización'),
        sa.Column('tasa_cambio_a_ars', sa.Numeric(precision=15, scale=4), nullable=True, comment='Tasa de conversión a ARS'),
        sa.Column('ultima_actualizacion_tasa', sa.DateTime(timezone=True), nullable=True),
        sa.Column('usuario_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fecha_creacion', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('fecha_actualizacion', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        
        # Foreign Key
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        
        # Primary Key
        sa.PrimaryKeyConstraint('id')
    )
    
    # Crear índices para mejor performance
    op.create_index('idx_monedas_usuario_id', 'monedas_usuario', ['usuario_id'])
    op.create_index('idx_monedas_activas', 'monedas_usuario', ['usuario_id', 'activa'])
    op.create_index('idx_monedas_codigo', 'monedas_usuario', ['usuario_id', 'codigo'], unique=True)
    op.create_index('idx_monedas_orden', 'monedas_usuario', ['usuario_id', 'orden'])
    
    # Actualizar tabla Usuario para agregar relación (si no existe)
    # La relación se maneja en el modelo SQLAlchemy, no requiere cambio en DB
    
    print("✅ Tabla monedas_usuario creada exitosamente")
    print("💡 Recuerda: Cuando un nuevo usuario se registre, debes inicializar sus monedas predeterminadas")


def downgrade():
    """
    Revertir cambios: eliminar tabla monedas_usuario
    """
    # Eliminar índices
    op.drop_index('idx_monedas_orden', table_name='monedas_usuario')
    op.drop_index('idx_monedas_codigo', table_name='monedas_usuario')
    op.drop_index('idx_monedas_activas', table_name='monedas_usuario')
    op.drop_index('idx_monedas_usuario_id', table_name='monedas_usuario')
    
    # Eliminar tabla
    op.drop_table('monedas_usuario')
    
    print("⚠️  Tabla monedas_usuario eliminada")

