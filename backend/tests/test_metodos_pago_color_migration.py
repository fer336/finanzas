import importlib.util
from pathlib import Path
from unittest.mock import patch


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "alembic"
    / "versions"
    / "widen_metodos_pago_color.py"
)


def load_migration_module():
    spec = importlib.util.spec_from_file_location("widen_metodos_pago_color", MIGRATION_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_upgrade_widens_color_column_for_css_variable_values():
    migration = load_migration_module()

    with patch.object(migration.op, "alter_column") as alter_column:
        migration.upgrade()

    kwargs = alter_column.call_args.kwargs
    assert alter_column.call_args.args[:2] == ("metodos_pago", "color")
    assert kwargs["type_"].length == 100
    assert kwargs["existing_type"].length == 7
