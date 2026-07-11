"""add balance_inicial_mes table for balance neto (mes a mes)

Revision ID: add_balance_inicial_mes
Revises: None
Create Date: 2026-07-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_balance_inicial_mes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Crear tabla balance_inicial_mes: ancla el "Balance neto" (dinero real
    que el usuario debería tener) a partir de un mes dado. El endpoint de
    balance neto suma ingresos - gastos desde el ancla más reciente.
    """
    op.create_table(
        'balance_inicial_mes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('usuario_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('mes', sa.String(length=7), nullable=False),  # YYYY-MM
        sa.Column('moneda', sa.String(length=10), nullable=False),
        sa.Column('monto', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('creado_en', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('actualizado_en', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),

        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id', 'mes', 'moneda', name='uq_usuario_mes_moneda'),
        sa.CheckConstraint('monto >= 0', name='check_monto_positive'),
    )

    op.create_index('idx_balance_inicial_usuario_mes', 'balance_inicial_mes', ['usuario_id', 'mes'])

    print("✅ Tabla balance_inicial_mes creada exitosamente")


def downgrade():
    op.drop_index('idx_balance_inicial_usuario_mes', table_name='balance_inicial_mes')
    op.drop_table('balance_inicial_mes')
    print("⚠️  Tabla balance_inicial_mes eliminada")
