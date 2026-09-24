"""
Tests for MinIO public URL configuration.

Production sets MINIO_ENDPOINT to an internal Docker hostname (e.g. "minio:9000")
that is unreachable from browsers. These tests verify that stored/public URLs and
presigned URLs are built against a configurable public origin instead.
"""
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlparse
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from minio import Minio
from app.services.minio_service import MinIOService


@pytest.fixture(autouse=True)
def _no_network_bucket_check():
    """MinIOService.__init__ calls bucket_exists(); avoid a real network call."""
    with patch.object(Minio, "bucket_exists", return_value=True):
        yield


def _make_service(**overrides):
    kwargs = dict(
        endpoint="minio:9000",
        access_key="dummy-access-key",
        secret_key="dummy-secret-key",
        bucket_name="facturas",
        secure=False,
        region="us-east-1",
    )
    kwargs.update(overrides)
    return MinIOService(**kwargs)


def test_build_public_url_uses_configured_public_url():
    service = _make_service(public_url="https://s3.qeva.xyz")

    url = service.build_public_url("transacciones/x.jpg")

    assert url == "https://s3.qeva.xyz/facturas/transacciones/x.jpg"


def test_build_public_url_strips_trailing_slash_on_public_url():
    service = _make_service(public_url="https://s3.qeva.xyz/")

    url = service.build_public_url("transacciones/x.jpg")

    assert url == "https://s3.qeva.xyz/facturas/transacciones/x.jpg"


def test_build_public_url_falls_back_to_endpoint_when_not_configured():
    service = _make_service(public_url=None)

    url = service.build_public_url("transacciones/x.jpg")

    assert url == "https://minio:9000/facturas/transacciones/x.jpg"


def test_presigned_url_uses_public_host_when_public_url_differs_from_endpoint():
    service = _make_service(public_url="https://s3.qeva.xyz")

    url = service.get_presigned_url("transacciones/x.jpg")

    parsed = urlparse(url)
    assert parsed.scheme == "https"
    assert parsed.hostname == "s3.qeva.xyz"
    assert parsed.path == "/facturas/transacciones/x.jpg"


def test_presigned_client_is_cached_across_calls():
    service = _make_service(public_url="https://s3.qeva.xyz")

    client_first = service._get_presign_client()
    client_second = service._get_presign_client()

    assert client_first is client_second
    assert client_first is not service.client


def test_presigned_client_reuses_internal_client_when_public_url_matches_endpoint():
    service = _make_service(endpoint="s3.qeva.xyz", secure=True, public_url="https://s3.qeva.xyz")

    client = service._get_presign_client()

    assert client is service.client
