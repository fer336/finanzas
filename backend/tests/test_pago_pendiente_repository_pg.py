from datetime import date
from pathlib import Path
import sys
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.db_models import PagoPendiente
from app.repositories.pago_pendiente_repository_pg import PagoPendienteRepositoryPG
from app.routers.pagos_pendientes import _normalize_due_date_aliases, _validate_second_due_date_after_first
from fastapi import HTTPException


class FakeQuery:
    def __init__(self, result):
        self.result = result

    def filter(self, *_args, **_kwargs):
        return self

    def first(self):
        return self.result


class FakeSession:
    def __init__(self, result):
        self.result = result
        self.committed = False
        self.refreshed = None

    def query(self, *_args, **_kwargs):
        return FakeQuery(self.result)

    def commit(self):
        self.committed = True

    def refresh(self, value):
        self.refreshed = value


def make_pago():
    pago = PagoPendiente(
        id=uuid4(),
        nombre='Seguro del auto',
        descripcion='Póliza mensual',
        monto=1200,
        moneda='ARS',
        fechavencimiento=date(2026, 7, 20),
        segunda_fecha_vencimiento=date(2026, 7, 25),
        prioridad='media',
        tipo='factura',
        notas='nota vigente',
        url_pdf='https://s3.qeva.xyz/facturas/invoice.pdf',
        comprobante='https://s3.qeva.xyz/facturas/comprobantes/receipt.pdf',
        estado='pendiente',
        recurrente=False,
    )
    pago.categoria = None
    pago.metodo_pago = None
    pago.usuario = None
    return pago


def test_update_preserves_omitted_document_fields_and_unrelated_none_fields():
    pago = make_pago()
    repository = PagoPendienteRepositoryPG(FakeSession(pago))

    result = repository.update(pago.id, {'nombre': 'Seguro actualizado', 'notas': None})

    assert result['nombre'] == 'Seguro actualizado'
    assert result['url_pdf'] == 'https://s3.qeva.xyz/facturas/invoice.pdf'
    assert result['comprobante'] == 'https://s3.qeva.xyz/facturas/comprobantes/receipt.pdf'
    assert result['notas'] == 'nota vigente'


def test_update_clears_nullable_document_fields_when_null_is_explicit():
    pago = make_pago()
    repository = PagoPendienteRepositoryPG(FakeSession(pago))

    result = repository.update(pago.id, {'url_pdf': None, 'comprobante': None, 'notas': None})

    assert result['url_pdf'] is None
    assert result['comprobante'] is None
    assert result['notas'] == 'nota vigente'


def test_serializes_second_due_date():
    pago = make_pago()
    repository = PagoPendienteRepositoryPG(FakeSession(pago))

    result = repository._to_dict(pago)

    assert result['fechavencimiento'] == '2026-07-20'
    assert result['segunda_fecha_vencimiento'] == '2026-07-25'


def test_update_clears_second_due_date_when_null_is_explicit():
    pago = make_pago()
    repository = PagoPendienteRepositoryPG(FakeSession(pago))

    result = repository.update(pago.id, {'segunda_fecha_vencimiento': None})

    assert result['segunda_fecha_vencimiento'] is None


def test_update_preserves_second_due_date_when_omitted():
    pago = make_pago()
    repository = PagoPendienteRepositoryPG(FakeSession(pago))

    result = repository.update(pago.id, {'nombre': 'Seguro actualizado'})

    assert result['segunda_fecha_vencimiento'] == '2026-07-25'


def test_router_normalizes_second_due_date_aliases_to_canonical_date():
    payload = {
        'FechaVencimiento': '2026-07-20',
        'SegundaFechaVencimiento': '2026-07-25',
    }

    _normalize_due_date_aliases(payload)

    assert payload['fechavencimiento'] == date(2026, 7, 20)
    assert payload['segunda_fecha_vencimiento'] == date(2026, 7, 25)
    assert 'FechaVencimiento' not in payload
    assert 'SegundaFechaVencimiento' not in payload


def test_router_rejects_second_due_date_on_or_before_first():
    try:
        _validate_second_due_date_after_first(date(2026, 7, 20), date(2026, 7, 20))
    except HTTPException as exc:
        assert exc.status_code == 400
        assert 'posterior' in exc.detail
    else:
        raise AssertionError('Expected HTTPException')
