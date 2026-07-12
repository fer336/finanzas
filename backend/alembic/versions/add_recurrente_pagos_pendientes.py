"""add recurrente/frecuencia_recurrencia columns to pagospendientes

Revision ID: add_recurrente_pp
Revises: add_prestamos
Create Date: 2026-07-12

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_recurrente_pp'
down_revision = 'add_prestamos'
branch_labels = None
depends_on = None


def upgrade():
    """
    El modelo/schema ya declaraban recurrente/frecuencia_recurrencia pero la
    tabla nunca tuvo esas columnas — crear un pago pendiente con
    Recurrente=True crasheaba (TypeError en el constructor de SQLAlchemy).
    """
    op.add_column('pagospendientes', sa.Column('recurrente', sa.Boolean(), server_default=sa.false()))
    op.add_column('pagospendientes', sa.Column('frecuencia_recurrencia', sa.String(length=20), nullable=True))


def downgrade():
    op.drop_column('pagospendientes', 'frecuencia_recurrencia')
    op.drop_column('pagospendientes', 'recurrente')
