from datetime import date
from pathlib import Path
import sys
from types import SimpleNamespace
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.db_models import Prestamo
from app.repositories.prestamo_repository import PrestamoRepository
from app.routers.prestamos import _normalize_estado


class FakeQuery:
    def __init__(self, records):
        self.records = list(records)

    def filter(self, condition):
        self.records = [record for record in self.records if self._matches(record, condition)]
        return self

    def order_by(self, *_args):
        self.records.sort(key=lambda record: record.fecha_vencimiento or date.max)
        return self

    def count(self):
        return len(self.records)

    def offset(self, value):
        self.records = self.records[value:]
        return self

    def limit(self, value):
        self.records = self.records[:value]
        return self

    def all(self):
        return self.records

    def _matches(self, record, condition):
        operator = condition.operator.__name__
        if operator == 'or_':
            return any(self._matches(record, clause) for clause in condition.clauses)

        value = getattr(record, condition.left.key)
        expected = condition.right.value
        if operator == 'eq':
            return value == expected
        if operator == 'ilike_op':
            return expected.strip('%').lower() in (value or '').lower()
        raise AssertionError(f'Unexpected filter operator: {operator}')


class FakeSession:
    def __init__(self, records):
        self.records = records

    def query(self, *_args):
        return FakeQuery(self.records)


def make_loan(usuario_id, **overrides):
    defaults = {
        'id': uuid4(),
        'usuario_id': usuario_id,
        'nombre_fuente': 'Banco Nación',
        'monto_prestado': 100,
        'monto_a_devolver': 120,
        'moneda': 'ARS',
        'fecha_prestamo': date(2026, 1, 1),
        'fecha_vencimiento': date(2026, 8, 20),
        'estado': 'pendiente',
        'notas': None,
        'comprobante': None,
        'fecha_creacion': None,
        'fecha_actualizacion': None,
        'fecha_pago': None,
    }
    return SimpleNamespace(**(defaults | overrides))


def test_normalizes_and_validates_supported_loan_statuses():
    assert _normalize_estado(' PENDIENTE ') == 'pendiente'
    assert _normalize_estado('pagado') == 'pagado'
    assert _normalize_estado(None) is None

    with pytest.raises(ValueError):
        _normalize_estado('cancelado')


def test_get_all_filters_status_and_search_without_crossing_user_boundary():
    owner_id = uuid4()
    other_user_id = uuid4()
    repository = PrestamoRepository(FakeSession([
        make_loan(owner_id, nombre_fuente='Banco Nación', notas='Refinanciación familiar'),
        make_loan(owner_id, nombre_fuente='Otro banco', estado='pagado', notas='Archivo'),
        make_loan(other_user_id, nombre_fuente='Banco Nación', notas='No debe aparecer'),
    ]))

    result = repository.get_all(usuario_id=owner_id, estado='PENDIENTE', search='FAMILIAR')

    assert [loan['nombre_fuente'] for loan in result['list']] == ['Banco Nación']
    assert result['pageInfo']['totalRows'] == 1


def test_get_all_searches_source_or_notes_and_counts_filtered_rows_before_pagination():
    owner_id = uuid4()
    repository = PrestamoRepository(FakeSession([
        make_loan(owner_id, nombre_fuente='Cooperativa Sol', fecha_vencimiento=date(2026, 8, 22)),
        make_loan(owner_id, nombre_fuente='Banco Nación', notas='Cuota del auto', fecha_vencimiento=date(2026, 8, 20)),
        make_loan(owner_id, nombre_fuente='Tarjeta', notas='Sin coincidencias', fecha_vencimiento=date(2026, 8, 21)),
    ]))

    result = repository.get_all(usuario_id=owner_id, search='COOPERATIVA', limit=1, offset=0)
    notes_result = repository.get_all(usuario_id=owner_id, search='AUTO', limit=1, offset=0)

    assert [loan['nombre_fuente'] for loan in result['list']] == ['Cooperativa Sol']
    assert result['pageInfo']['totalRows'] == 1
    assert [loan['nombre_fuente'] for loan in notes_result['list']] == ['Banco Nación']
    assert notes_result['pageInfo']['totalRows'] == 1
