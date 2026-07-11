"""add prestamos table for loan tracking

Revision ID: add_prestamos
Revises: None
Create Date: 2026-07-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_prestamos'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Crear tabla prestamos: préstamos tomados por el usuario — monto
    prestado vs. monto a devolver, fecha de vencimiento y de dónde vino
    (nombre_fuente). Se paga vía el mismo endpoint genérico de pagos
    (item_type='prestamo'), que crea un gasto real en transacciones.
    """
    op.create_table(
        'prestamos',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('nombre_fuente', sa.Text(), nullable=False),
        sa.Column('monto_prestado', sa.Numeric(15, 2), nullable=False),
        sa.Column('monto_a_devolver', sa.Numeric(15, 2), nullable=False),
        sa.Column('moneda', sa.String(length=10), nullable=False, server_default='ARS'),
        sa.Column('fecha_vencimiento', sa.Date(), nullable=False),
        sa.Column('fecha_pago', sa.Date(), nullable=True),
        sa.Column('estado', sa.String(length=50), nullable=False, server_default='pendiente'),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('comprobante', sa.Text(), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('fecha_actualizacion', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('usuario_id', postgresql.UUID(as_uuid=True), nullable=False),

        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index('idx_prestamos_usuario_vencimiento', 'prestamos', ['usuario_id', 'fecha_vencimiento'])

    print("✅ Tabla prestamos creada exitosamente")


def downgrade():
    op.drop_index('idx_prestamos_usuario_vencimiento', table_name='prestamos')
    op.drop_table('prestamos')
    print("⚠️  Tabla prestamos eliminada")
