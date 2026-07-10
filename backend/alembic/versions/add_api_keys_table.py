"""add api_keys table for long-lived revocable API tokens

Revision ID: add_api_keys
Revises: None
Create Date: 2026-07-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_api_keys'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Crear tabla api_keys para permitir autenticación de scripts/agentes
    externos mediante tokens de larga duración y revocables
    """
    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('usuario_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('key_hash', sa.String(length=64), nullable=False),
        sa.Column('key_prefix', sa.String(length=16), nullable=False),
        sa.Column('creado_en', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('ultimo_uso', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revocado_en', sa.DateTime(timezone=True), nullable=True),

        # Foreign Key
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),

        # Primary Key
        sa.PrimaryKeyConstraint('id'),

        # Unique constraint
        sa.UniqueConstraint('key_hash', name='uq_api_keys_key_hash')
    )

    op.create_index('idx_api_keys_usuario_id', 'api_keys', ['usuario_id'])
    op.create_index('idx_api_keys_key_hash', 'api_keys', ['key_hash'])

    print("✅ Tabla api_keys creada exitosamente")


def downgrade():
    """
    Revertir cambios: eliminar tabla api_keys
    """
    op.drop_index('idx_api_keys_key_hash', table_name='api_keys')
    op.drop_index('idx_api_keys_usuario_id', table_name='api_keys')

    op.drop_table('api_keys')

    print("⚠️  Tabla api_keys eliminada")
