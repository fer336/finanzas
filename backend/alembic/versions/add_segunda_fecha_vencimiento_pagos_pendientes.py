"""add segunda_fecha_vencimiento to pagospendientes

Revision ID: add_segunda_fecha_pp
Revises: add_fecha_prestamo
Create Date: 2026-07-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_segunda_fecha_pp'
down_revision = 'add_fecha_prestamo'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('pagospendientes', sa.Column('segunda_fecha_vencimiento', sa.Date(), nullable=True))


def downgrade():
    op.drop_column('pagospendientes', 'segunda_fecha_vencimiento')
