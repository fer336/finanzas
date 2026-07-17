import importlib.util
from pathlib import Path
from unittest.mock import patch


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "alembic"
    / "versions"
    / "update_metodos_pago_tipo_constraint.py"
)


def load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "update_metodos_pago_tipo_constraint",
        MIGRATION_PATH,
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_metodos_pago_tipo_constraint_matches_ui_contract():
    migration = load_migration_module()

    assert migration.ALLOWED_PAYMENT_METHOD_TYPES == (
        "tarjeta",
        "efectivo",
        "transferencia",
        "debito",
        "credito",
        "otro",
    )
    assert migration._tipo_check_sql() == (
        "tipo IN ('tarjeta', 'efectivo', 'transferencia', 'debito', 'credito', 'otro')"
    )


def test_upgrade_emits_widened_check_constraint():
    migration = load_migration_module()

    with patch.object(migration.op, "execute") as execute:
        migration.upgrade()

    executed_sql = "\n".join(call.args[0] for call in execute.call_args_list)

    assert "DROP CONSTRAINT IF EXISTS metodos_pago_tipo_check" in executed_sql
    assert "ADD CONSTRAINT metodos_pago_tipo_check" in executed_sql
    assert migration._tipo_check_sql() in executed_sql


def test_downgrade_keeps_constraint_data_safe():
    migration = load_migration_module()

    with patch.object(migration.op, "execute") as execute:
        migration.downgrade()

    executed_sql = "\n".join(call.args[0] for call in execute.call_args_list)

    assert "DROP CONSTRAINT IF EXISTS metodos_pago_tipo_check" in executed_sql
    assert "ADD CONSTRAINT metodos_pago_tipo_check" in executed_sql
    assert migration._tipo_check_sql() in executed_sql
