"""update metodos_pago tipo constraint

Revision ID: update_metodos_pago_tipo
Revises:
Create Date: 2026-07-17

"""
from alembic import op

ALLOWED_PAYMENT_METHOD_TYPES = (
    'tarjeta',
    'efectivo',
    'transferencia',
    'debito',
    'credito',
    'otro',
)


def _tipo_check_sql():
    values = ", ".join(f"'{value}'" for value in ALLOWED_PAYMENT_METHOD_TYPES)
    return f"tipo IN ({values})"


# revision identifiers, used by Alembic.
revision = 'update_metodos_pago_tipo'
# Standalone on purpose: this repo currently has multiple independent Alembic
# heads and the production fix must be targetable with
# `alembic upgrade update_metodos_pago_tipo` without traversing unrelated
# historical branches.
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Allow every payment-method type used by the UI.

    The frontend payment method modal can submit: tarjeta, efectivo,
    transferencia, debito, credito, and otro. PostgreSQL was rejecting
    credito/debito because the existing check constraint was narrower.
    """
    op.execute("ALTER TABLE metodos_pago DROP CONSTRAINT IF EXISTS metodos_pago_tipo_check")
    op.execute(
        f"""
        ALTER TABLE metodos_pago
        ADD CONSTRAINT metodos_pago_tipo_check
        CHECK ({_tipo_check_sql()})
        """
    )


def downgrade():
    """
    Keep the widened constraint on downgrade.

    This migration fixes the persisted DB/API/UI contract. Reverting to the old
    narrower check would fail after users create valid debito/credito rows, so
    rollback must remain data-safe.
    """
    op.execute("ALTER TABLE metodos_pago DROP CONSTRAINT IF EXISTS metodos_pago_tipo_check")
    op.execute(
        f"""
        ALTER TABLE metodos_pago
        ADD CONSTRAINT metodos_pago_tipo_check
        CHECK ({_tipo_check_sql()})
        """
    )
