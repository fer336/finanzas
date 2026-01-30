"""remove es_global from categorias and metodos_pago

Revision ID: remove_es_global_cat
Revises: 
Create Date: 2026-01-28

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_es_global_cat'
down_revision = None  # Set to your last migration ID if you have one
branch_labels = None
depends_on = None


def upgrade():
    """
    Eliminar columna es_global de categorias y metodos_pago
    y hacer usuario_id obligatorio (NOT NULL) en ambas tablas
    """
    # === CATEGORIAS ===
    # 1. Eliminar la columna es_global
    op.drop_column('categorias', 'es_global')
    
    # 2. Hacer usuario_id NOT NULL
    op.alter_column('categorias', 'usuario_id',
                    existing_type=sa.dialects.postgresql.UUID(),
                    nullable=False)
    
    # === METODOS_PAGO ===
    # 3. Eliminar la columna es_global
    op.drop_column('metodos_pago', 'es_global')
    
    # 4. Hacer usuario_id NOT NULL
    op.alter_column('metodos_pago', 'usuario_id',
                    existing_type=sa.dialects.postgresql.UUID(),
                    nullable=False)


def downgrade():
    """
    Revertir cambios: restaurar es_global y hacer usuario_id nullable
    """
    # === CATEGORIAS ===
    # 1. Hacer usuario_id nullable nuevamente
    op.alter_column('categorias', 'usuario_id',
                    existing_type=sa.dialects.postgresql.UUID(),
                    nullable=True)
    
    # 2. Agregar columna es_global con default False
    op.add_column('categorias', 
                  sa.Column('es_global', sa.Boolean(), 
                           server_default='false', nullable=False))
    
    # === METODOS_PAGO ===
    # 3. Hacer usuario_id nullable nuevamente
    op.alter_column('metodos_pago', 'usuario_id',
                    existing_type=sa.dialects.postgresql.UUID(),
                    nullable=True)
    
    # 4. Agregar columna es_global con default False
    op.add_column('metodos_pago', 
                  sa.Column('es_global', sa.Boolean(), 
                           server_default='false', nullable=False))

