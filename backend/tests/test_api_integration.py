"""
Integration Tests for API Endpoints
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal


class TestTransaccionesAPI:
    """Integration tests for /api/v1/transacciones endpoints"""
    
    def test_get_transacciones(self, client, test_transaccion, mock_auth_headers):
        """Test GET /api/v1/transacciones/"""
        response = client.get(
            "/api/v1/transacciones/",
            headers=mock_auth_headers,
            params={"limit": 10, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "list" in data
        assert "pageInfo" in data
    
    def test_get_transaccion_by_id(self, client, test_transaccion, mock_auth_headers):
        """Test GET /api/v1/transacciones/{id}"""
        response = client.get(
            f"/api/v1/transacciones/{test_transaccion.id}",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_transaccion.id)
        assert data["descripcion"] == test_transaccion.descripcion
    
    def test_create_transaccion(self, client, test_usuario, test_categoria, test_metodo_pago, mock_auth_headers):
        """Test POST /api/v1/transacciones/"""
        payload = {
            "descripcion": "API Test Transaction",
            "monto": -1500.00,
            "moneda": "ARS",
            "tipo": "gasto",
            "fecha_transaccion": date.today().isoformat(),
            "usuario_id": str(test_usuario.id),
            "categoria_id": str(test_categoria.id),
            "metodo_pago_id": str(test_metodo_pago.id)
        }
        
        response = client.post(
            "/api/v1/transacciones/",
            json=payload,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["descripcion"] == "API Test Transaction"
        assert float(data["monto_ars"]) == -1500.00
    
    def test_update_transaccion(self, client, test_transaccion, mock_auth_headers):
        """Test PATCH /api/v1/transacciones/{id}"""
        payload = {
            "descripcion": "Updated via API",
            "monto": -2500.00
        }
        
        response = client.patch(
            f"/api/v1/transacciones/{test_transaccion.id}",
            json=payload,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["descripcion"] == "Updated via API"
    
    def test_delete_transaccion(self, client, test_transaccion, mock_auth_headers):
        """Test DELETE /api/v1/transacciones/{id}"""
        response = client.delete(
            f"/api/v1/transacciones/{test_transaccion.id}",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get(
            f"/api/v1/transacciones/{test_transaccion.id}",
            headers=mock_auth_headers
        )
        assert get_response.status_code == 404
    
    def test_bulk_create_transacciones(self, client, test_usuario, test_categoria, test_metodo_pago, mock_auth_headers):
        """Test POST /api/v1/transacciones/bulk"""
        payload = {
            "transactions": [
                {
                    "descripcion": f"Bulk Transaction {i}",
                    "monto": -1000.00 * i,
                    "moneda": "ARS",
                    "tipo": "gasto",
                    "fecha_transaccion": date.today().isoformat(),
                    "usuario_id": str(test_usuario.id),
                    "categoria_id": str(test_categoria.id),
                    "metodo_pago_id": str(test_metodo_pago.id)
                }
                for i in range(1, 4)
            ]
        }
        
        response = client.post(
            "/api/v1/transacciones/bulk",
            json=payload,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["created_count"] == 3
        assert len(data["errors"]) == 0
    
    def test_download_csv_template(self, client):
        """Test GET /api/v1/transacciones/csv-template"""
        response = client.get("/api/v1/transacciones/csv-template")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "fecha_transaccion" in response.text


class TestPresupuestosAPI:
    """Integration tests for /api/v1/presupuestos endpoints"""
    
    def test_get_presupuestos(self, client, test_presupuesto, mock_auth_headers):
        """Test GET /api/v1/presupuestos/"""
        response = client.get(
            "/api/v1/presupuestos/",
            headers=mock_auth_headers,
            params={"limit": 10, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "list" in data
        assert "pageInfo" in data
    
    def test_get_presupuesto_by_id(self, client, test_presupuesto, mock_auth_headers):
        """Test GET /api/v1/presupuestos/{id}"""
        response = client.get(
            f"/api/v1/presupuestos/{test_presupuesto.id}",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_presupuesto.id)
        assert data["nombre"] == test_presupuesto.nombre
    
    def test_create_presupuesto(self, client, test_usuario, test_categoria, mock_auth_headers):
        """Test POST /api/v1/presupuestos/"""
        payload = {
            "nombre": "API Test Budget",
            "descripcion": "Test budget created via API",
            "monto_limite": 50000.00,
            "periodo": "mensual",
            "fecha_inicio": date.today().isoformat(),
            "fecha_fin": (date.today() + timedelta(days=30)).isoformat(),
            "alerta_porcentaje": 80,
            "color": "#4CAF50",
            "usuario_id": str(test_usuario.id),
            "categoria_id": str(test_categoria.id)
        }
        
        response = client.post(
            "/api/v1/presupuestos/",
            json=payload,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "API Test Budget"
        assert float(data["monto_limite"]) == 50000.00
    
    def test_update_presupuesto(self, client, test_presupuesto, mock_auth_headers):
        """Test PATCH /api/v1/presupuestos/{id}"""
        payload = {
            "nombre": "Updated Budget via API",
            "monto_limite": 75000.00
        }
        
        response = client.patch(
            f"/api/v1/presupuestos/{test_presupuesto.id}",
            json=payload,
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Updated Budget via API"
        assert float(data["monto_limite"]) == 75000.00
    
    def test_delete_presupuesto(self, client, test_presupuesto, mock_auth_headers):
        """Test DELETE /api/v1/presupuestos/{id}"""
        response = client.delete(
            f"/api/v1/presupuestos/{test_presupuesto.id}",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get(
            f"/api/v1/presupuestos/{test_presupuesto.id}",
            headers=mock_auth_headers
        )
        assert get_response.status_code == 404
    
    def test_get_active_presupuestos(self, client, test_presupuesto, mock_auth_headers):
        """Test GET /api/v1/presupuestos/active"""
        response = client.get(
            "/api/v1/presupuestos/active",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "list" in data
        assert len(data["list"]) > 0


class TestCategoriasAPI:
    """Integration tests for /api/v1/categorias endpoints"""
    
    def test_get_categorias(self, client, test_categoria, mock_auth_headers):
        """Test GET /api/v1/categorias/"""
        response = client.get(
            "/api/v1/categorias/",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "list" in data
        assert len(data["list"]) > 0
    
    def test_get_categoria_by_id(self, client, test_categoria, mock_auth_headers):
        """Test GET /api/v1/categorias/{id}"""
        response = client.get(
            f"/api/v1/categorias/{test_categoria.id}",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_categoria.id)
        assert data["nombre"] == test_categoria.nombre


class TestMetodosPagoAPI:
    """Integration tests for /api/v1/metodos-pago endpoints"""
    
    def test_get_metodos_pago(self, client, test_metodo_pago, mock_auth_headers):
        """Test GET /api/v1/metodos-pago/"""
        response = client.get(
            "/api/v1/metodos-pago/",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "list" in data
        assert len(data["list"]) > 0
    
    def test_get_metodo_pago_by_id(self, client, test_metodo_pago, mock_auth_headers):
        """Test GET /api/v1/metodos-pago/{id}"""
        response = client.get(
            f"/api/v1/metodos-pago/{test_metodo_pago.id}",
            headers=mock_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_metodo_pago.id)
        assert data["nombre"] == test_metodo_pago.nombre


class TestHealthEndpoint:
    """Integration tests for health check endpoint"""
    
    def test_health_check(self, client):
        """Test GET /api/health"""
        response = client.get("/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

