"""add fecha_prestamo column to prestamos

Revision ID: add_fecha_prestamo
Revises: add_recurrente_pp
Create Date: 2026-07-12

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_fecha_prestamo'
down_revision = 'add_recurrente_pp'
branch_labels = None
depends_on = None


def upgrade():
    """
    Fecha en la que se recibió el dinero del préstamo — distinta de
    fecha_vencimiento (cuándo hay que devolverlo). Se usa para fechar la
    transacción de ingreso que ahora se crea junto con el préstamo.
    """
    op.add_column('prestamos', sa.Column('fecha_prestamo', sa.Date(), nullable=True))


def downgrade():
    op.drop_column('prestamos', 'fecha_prestamo')
