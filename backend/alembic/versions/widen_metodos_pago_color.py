"""widen payment method color storage

Revision ID: widen_metodos_pago_color
Create Date: 2026-08-11
"""
from alembic import op
import sqlalchemy as sa


revision = "widen_metodos_pago_color"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "metodos_pago",
        "color",
        existing_type=sa.String(length=7),
        type_=sa.String(length=100),
        existing_nullable=True,
    )


def downgrade():
    # Existing CSS variable values may exceed seven characters, so a
    # destructive narrowing is intentionally not performed.
    op.alter_column(
        "metodos_pago",
        "color",
        existing_type=sa.String(length=100),
        type_=sa.String(length=100),
        existing_nullable=True,
    )
