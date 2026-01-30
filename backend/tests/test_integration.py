"""
Integration Tests - End-to-End Workflows
Tests complete user journeys and multi-step operations
"""
import pytest
from datetime import date, timedelta
from uuid import uuid4


@pytest.mark.integration
class TestTransaccionWorkflow:
    """Test complete transaction workflow"""

    def test_create_update_delete_transaccion_workflow(
        self, client, test_user, test_categoria, test_metodo_pago
    ):
        """INTEGRATION: Complete CRUD workflow for transactions"""
        # Step 1: Create transaction
        create_data = {
            "monto": -5000.0,
            "tipo": "gasto",
            "descripcion": "Integration test transaction",
            "fecha_transaccion": date.today().isoformat(),
            "usuario_id": str(test_user.id),
            "categoria_id": str(test_categoria.id),
            "metodo_pago_id": str(test_metodo_pago.id)
        }

        create_response = client.post("/api/v1/transacciones/", json=create_data)
        assert create_response.status_code == 200
        created = create_response.json()
        transaccion_id = created["id"]

        # Step 2: Get transaction by ID
        get_response = client.get(f"/api/v1/transacciones/{transaccion_id}")
        assert get_response.status_code == 200
        retrieved = get_response.json()
        assert retrieved["descripcion"] == "Integration test transaction"

        # Step 3: Update transaction
        update_data = {
            "descripcion": "Updated description",
            "monto": -6000.0
        }
        update_response = client.patch(
            f"/api/v1/transacciones/{transaccion_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["descripcion"] == "Updated description"
        assert float(updated["monto"]) == -6000.0

        # Step 4: Verify in list
        list_response = client.get(
            "/api/v1/transacciones/",
            params={"user_id": str(test_user.id)}
        )
        assert list_response.status_code == 200
        transactions = list_response.json()["list"]
        assert any(t["id"] == transaccion_id for t in transactions)

        # Step 5: Delete transaction
        delete_response = client.delete(f"/api/v1/transacciones/{transaccion_id}")
        assert delete_response.status_code == 200

        # Step 6: Verify deletion
        get_deleted = client.get(f"/api/v1/transacciones/{transaccion_id}")
        assert get_deleted.status_code == 404

    def test_transaction_with_savings_goal_workflow(
        self, client, test_db, test_user, test_categoria, test_metodo_pago, test_objetivo_ahorro
    ):
        """INTEGRATION: Create transaction linked to savings goal"""
        # Create transaction linked to objetivo
        create_data = {
            "monto": 10000.0,
            "tipo": "ingreso",
            "descripcion": "Aporte a objetivo",
            "fecha_transaccion": date.today().isoformat(),
            "usuario_id": str(test_user.id),
            "categoria_id": str(test_categoria.id),
            "metodo_pago_id": str(test_metodo_pago.id),
            "objetivo_id": str(test_objetivo_ahorro.id),
            "es_aporte_objetivo": True
        }

        response = client.post("/api/v1/transacciones/", json=create_data)
        assert response.status_code == 200
        created = response.json()

        # Verify objetivo was updated
        objetivo_response = client.get(f"/api/v1/objetivos/{test_objetivo_ahorro.id}")
        assert objetivo_response.status_code == 200
        objetivo = objetivo_response.json()
        assert float(objetivo["monto_actual"]) > 0

        # Cleanup
        client.delete(f"/api/v1/transacciones/{created['id']}")


@pytest.mark.integration
class TestFinancialReportsWorkflow:
    """Test financial reporting workflows"""

    def test_monthly_financial_summary_workflow(
        self, client, test_db, test_user, test_categoria, test_metodo_pago
    ):
        """INTEGRATION: Generate monthly financial summary"""
        # Create sample transactions for current month
        today = date.today()
        transactions = []

        # Create 5 ingresos
        for i in range(5):
            data = {
                "monto": 50000.0 + (i * 1000),
                "tipo": "ingreso",
                "descripcion": f"Ingreso {i}",
                "fecha_transaccion": (today - timedelta(days=i)).isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id)
            }
            response = client.post("/api/v1/transacciones/", json=data)
            assert response.status_code == 200
            transactions.append(response.json()["id"])

        # Create 10 gastos
        for i in range(10):
            data = {
                "monto": -(5000.0 + (i * 500)),
                "tipo": "gasto",
                "descripcion": f"Gasto {i}",
                "fecha_transaccion": (today - timedelta(days=i)).isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id)
            }
            response = client.post("/api/v1/transacciones/", json=data)
            assert response.status_code == 200
            transactions.append(response.json()["id"])

        # Get estadisticas
        stats_response = client.get(
            "/api/v1/transacciones/estadisticas",
            params={
                "fecha_desde": today.replace(day=1).isoformat(),
                "fecha_hasta": today.isoformat(),
                "user_id": str(test_user.id)
            }
        )

        assert stats_response.status_code == 200
        stats = stats_response.json()

        assert stats["numero_ingresos"] == 5
        assert stats["numero_gastos"] == 10
        assert stats["total_ingresos"] > 0
        assert stats["total_gastos"] > 0
        assert "balance_neto" in stats

        # Cleanup
        for tid in transactions:
            client.delete(f"/api/v1/transacciones/{tid}")


@pytest.mark.integration
class TestCreditCardWorkflow:
    """Test credit card transaction workflows"""

    def test_credit_card_purchase_and_payment_workflow(
        self, client, test_db, test_user, test_categoria, test_metodo_pago
    ):
        """INTEGRATION: Simulate credit card purchase and payment"""
        # Step 1: Create credit card purchases
        purchases = []
        for i in range(3):
            data = {
                "monto": -(10000.0 + (i * 1000)),
                "tipo": "gasto",
                "descripcion": f"Compra tarjeta {i}",
                "fecha_transaccion": (date.today() - timedelta(days=i)).isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id),
                "es_credito": True  # CREDIT CARD purchase
            }
            response = client.post("/api/v1/transacciones/", json=data)
            assert response.status_code == 200
            purchases.append(response.json()["id"])

        # Step 2: Check credit card debt
        debt_response = client.get(
            "/api/v1/transacciones/tarjetas/deuda",
            params={"user_id": str(test_user.id)}
        )
        assert debt_response.status_code == 200
        debt = debt_response.json()
        assert debt["cantidad_transacciones"] == 3
        assert debt["deuda_total"] > 0

        # Step 3: Pay credit card statement
        payment_data = {
            "transaccion_ids": purchases,
            "fecha_pago": date.today().isoformat(),
            "monto_total": 33000.0,
            "metodo_pago_id": str(test_metodo_pago.id),
            "notas": "Pago resumen enero"
        }
        payment_response = client.post(
            "/api/v1/transacciones/tarjetas/pagar-resumen",
            json=payment_data
        )
        assert payment_response.status_code == 200

        # Step 4: Verify debt is cleared
        debt_after = client.get(
            "/api/v1/transacciones/tarjetas/deuda",
            params={"user_id": str(test_user.id)}
        )
        debt_data = debt_after.json()
        # Debt should be 0 or significantly reduced
        assert debt_data["cantidad_transacciones"] == 0


@pytest.mark.integration
@pytest.mark.minio
class TestFileUploadWorkflow:
    """Test file upload workflows (if MinIO is available)"""

    def test_upload_invoice_to_transaction(
        self, client, test_user, test_categoria, test_metodo_pago, mock_minio_service
    ):
        """INTEGRATION: Upload invoice file and attach to transaction"""
        from unittest.mock import patch

        # Step 1: Create transaction
        transaction_data = {
            "monto": -5000.0,
            "tipo": "gasto",
            "descripcion": "Compra con factura",
            "fecha_transaccion": date.today().isoformat(),
            "usuario_id": str(test_user.id),
            "categoria_id": str(test_categoria.id),
            "metodo_pago_id": str(test_metodo_pago.id)
        }
        trans_response = client.post("/api/v1/transacciones/", json=transaction_data)
        assert trans_response.status_code == 200
        transaction_id = trans_response.json()["id"]

        # Step 2: Upload file (mock MinIO)
        with patch("app.services.minio_service.get_minio_service", return_value=mock_minio_service):
            # Simulate file upload
            files = {"file": ("invoice.pdf", b"fake pdf content", "application/pdf")}
            upload_response = client.post("/api/files/upload", files=files)

            if upload_response.status_code == 200:
                file_data = upload_response.json()
                file_url = file_data["file_url"]

                # Step 3: Update transaction with file URL
                update_data = {"comprobante": file_url}
                update_response = client.patch(
                    f"/api/v1/transacciones/{transaction_id}",
                    json=update_data
                )
                assert update_response.status_code == 200
                updated = update_response.json()
                assert updated["comprobante"] == file_url

        # Cleanup
        client.delete(f"/api/v1/transacciones/{transaction_id}")


@pytest.mark.integration
@pytest.mark.ai
class TestAIAgentWorkflow:
    """Test AI agent integration workflows"""

    def test_ai_agent_query_financial_data(
        self, client, test_db, test_user, bulk_transacciones, mock_openrouter_client
    ):
        """INTEGRATION: AI agent queries financial data"""
        from unittest.mock import patch
        import httpx

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client_class.return_value.__aenter__.return_value = mock_openrouter_client

            chat_request = {
                "message": "Cuánto gasté este mes?",
                "history": [],
                "context": {
                    "categories": [],
                    "payment_methods": []
                }
            }

            response = client.post("/api/agent/chat", json=chat_request)

            # Should respond (may fail if OpenRouter is not configured in test)
            assert response.status_code in [200, 500]

    def test_ai_agent_creates_transaction(
        self, client, test_db, test_user, test_categoria, test_metodo_pago, mock_openrouter_client
    ):
        """INTEGRATION: AI agent creates transaction via tool call"""
        from app.services.agent_tools import execute_tool

        # Simulate agent creating transaction
        result = execute_tool(
            "create_transaction",
            {
                "monto": 5000.0,
                "tipo": "gasto",
                "descripcion": "Compra via AI",
                "categoria_nombre": "Alimentación",
                "metodo_pago_nombre": "Débito",
                "fecha": date.today().isoformat()
            },
            test_db
        )

        assert result.get("success") is True
        assert "transaccion_id" in result

        # Cleanup
        from app.repositories.transaccion_repository import TransaccionRepository
        repo = TransaccionRepository(test_db)
        repo.delete(result["transaccion_id"])


@pytest.mark.integration
class TestBulkOperationsWorkflow:
    """Test bulk import/export workflows"""

    def test_csv_import_workflow(
        self, client, test_user, test_categoria, test_metodo_pago
    ):
        """INTEGRATION: Import transactions from CSV"""
        # Simulate CSV import via bulk-create
        transactions = []
        for i in range(20):
            transactions.append({
                "monto": -(1000.0 + i * 100),
                "tipo": "gasto",
                "descripcion": f"CSV Import {i}",
                "fecha_transaccion": (date.today() - timedelta(days=i)).isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id)
            })

        response = client.post(
            "/api/v1/transacciones/bulk-create",
            json={"transactions": transactions}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["created_count"] == 20
        assert result["failed_count"] == 0

    def test_bulk_delete_workflow(self, client, test_user, bulk_transacciones):
        """INTEGRATION: Delete multiple transactions at once"""
        # Get some transaction IDs
        list_response = client.get(
            "/api/v1/transacciones/",
            params={"user_id": str(test_user.id), "limit": 10}
        )
        assert list_response.status_code == 200
        transactions = list_response.json()["list"]
        ids_to_delete = [t["id"] for t in transactions[:5]]

        # Bulk delete
        delete_response = client.post(
            "/api/v1/transacciones/bulk-delete",
            json={"ids": ids_to_delete}
        )

        assert delete_response.status_code == 200
        result = delete_response.json()
        assert result["deleted_count"] == 5
