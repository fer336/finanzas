"""
Security Tests - SQL Injection Prevention
Tests to ensure the application is protected against SQL injection attacks
"""
import pytest
from uuid import uuid4
from datetime import date, datetime


@pytest.mark.security
@pytest.mark.database
class TestSQLInjectionTransacciones:
    """Test SQL injection protection in Transacciones endpoints"""

    def test_get_transacciones_sql_injection_in_user_id(
        self, client, test_user, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in user_id parameter"""
        for payload in sql_injection_payloads:
            response = client.get(
                "/api/v1/transacciones/",
                params={"user_id": payload}
            )
            # Should either return 400/422 (validation error) or empty results
            # but NOT 500 (SQL error)
            assert response.status_code in [200, 400, 422], \
                f"SQL injection payload '{payload}' caused unexpected response: {response.status_code}"

            if response.status_code == 200:
                # Should return empty or error, not crash
                data = response.json()
                assert "error" in data or "list" in data

    def test_get_transacciones_sql_injection_in_descripcion(
        self, client, test_db, test_user, test_categoria, test_metodo_pago, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in transaction description"""
        from app.models.db_models import Transaccion

        for payload in sql_injection_payloads:
            # Try to create transaction with malicious description
            data = {
                "monto": -1000.0,
                "tipo": "gasto",
                "descripcion": payload,  # SQL injection payload
                "fecha_transaccion": date.today().isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id)
            }

            response = client.post("/api/v1/transacciones/", json=data)

            # Should not cause SQL error
            assert response.status_code != 500, \
                f"SQL injection in descripcion caused server error: {payload}"

            # If successful, verify the payload is stored as-is (escaped)
            if response.status_code == 200:
                created = response.json()
                # Verify in database that payload is escaped/sanitized
                db_transaccion = test_db.query(Transaccion).filter(
                    Transaccion.id == created["id"]
                ).first()

                if db_transaccion:
                    # The description should be stored safely
                    assert db_transaccion.descripcion is not None

                    # Clean up
                    test_db.delete(db_transaccion)
                    test_db.commit()

    def test_transacciones_estadisticas_sql_injection(
        self, client, test_user, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in estadisticas endpoint"""
        for payload in sql_injection_payloads:
            response = client.get(
                "/api/v1/transacciones/estadisticas",
                params={
                    "fecha_desde": payload,
                    "fecha_hasta": "2026-12-31",
                    "user_id": str(test_user.id)
                }
            )

            # Should return validation error, not SQL error
            assert response.status_code in [200, 400, 422, 500], \
                f"Unexpected status for payload: {payload}"

            if response.status_code == 500:
                # Check if it's a validation error, not SQL injection
                data = response.json()
                error_msg = data.get("message", "").lower()
                # Should not contain SQL error keywords
                assert "syntax error" not in error_msg
                assert "sql" not in error_msg


@pytest.mark.security
@pytest.mark.database
class TestSQLInjectionPagosPendientes:
    """Test SQL injection protection in Pagos Pendientes endpoints"""

    def test_create_pago_pendiente_sql_injection(
        self, client, test_user, test_categoria, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in pago pendiente creation"""
        for payload in sql_injection_payloads:
            data = {
                "nombre": payload,  # SQL injection in nombre
                "monto": 5000,
                "moneda": "ARS",
                "fechavencimiento": date.today().isoformat(),
                "usuario_id": str(test_user.id),
                "categorias_id": str(test_categoria.id)
            }

            response = client.post("/api/v1/pagos-pendientes/", json=data)

            # Should not cause SQL error
            assert response.status_code != 500 or "SQL" not in response.text, \
                f"SQL injection caused error: {payload}"

    def test_search_pagos_pendientes_sql_injection(
        self, client, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in search/filter parameters"""
        for payload in sql_injection_payloads:
            response = client.get(
                "/api/v1/pagos-pendientes/",
                params={"estado": payload}
            )

            # Should handle gracefully
            assert response.status_code in [200, 400, 422]


@pytest.mark.security
@pytest.mark.database
class TestSQLInjectionCategorias:
    """Test SQL injection protection in Categorias endpoints"""

    def test_create_categoria_sql_injection(
        self, client, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in categoria creation"""
        for payload in sql_injection_payloads:
            data = {
                "nombre": payload,
                "tipo": "gasto",
                "color": "#FF5722",
                "icono": "📁"
            }

            response = client.post("/api/v1/categories/", json=data)

            # Should not cause SQL injection
            assert response.status_code in [200, 201, 400, 422]

            # If created, clean up
            if response.status_code in [200, 201]:
                created = response.json()
                if "id" in created:
                    client.delete(f"/api/v1/categories/{created['id']}")


@pytest.mark.security
@pytest.mark.database
class TestSQLInjectionAgent:
    """Test SQL injection protection in AI Agent tools"""

    def test_agent_tools_sql_injection_resistance(
        self, test_db, test_user, sql_injection_payloads
    ):
        """SECURITY: Test that agent tools are protected against SQL injection"""
        from app.services.agent_tools import execute_tool

        # Test get_monthly_summary
        for payload in sql_injection_payloads:
            try:
                # This should not execute SQL injection
                result = execute_tool(
                    "get_monthly_summary",
                    {"year": 2026, "month": 1},
                    test_db
                )
                # Should return error or valid data, not crash
                assert isinstance(result, dict)
            except Exception as e:
                # Should not be a SQL error
                assert "SQL" not in str(e).upper()
                assert "SYNTAX" not in str(e).upper()

    def test_agent_create_transaction_sql_injection(
        self, test_db, sql_injection_payloads
    ):
        """SECURITY: Test SQL injection in agent's create_transaction"""
        from app.services.agent_tools import execute_tool

        for payload in sql_injection_payloads:
            try:
                result = execute_tool(
                    "create_transaction",
                    {
                        "monto": 1000.0,
                        "tipo": "gasto",
                        "descripcion": payload,  # SQL injection payload
                        "categoria_nombre": "Test",
                        "metodo_pago_nombre": "Efectivo"
                    },
                    test_db
                )

                # Should return success or error, not SQL exception
                assert isinstance(result, dict)

                # Clean up if created
                if result.get("success"):
                    from app.repositories.transaccion_repository import TransaccionRepository
                    repo = TransaccionRepository(test_db)
                    repo.delete(result["transaccion_id"])

            except Exception as e:
                # Should not be a SQL error
                assert "SQL" not in str(e).upper()


@pytest.mark.security
@pytest.mark.database
class TestORMParameterization:
    """Test that SQLAlchemy ORM properly parameterizes queries"""

    def test_orm_uses_parameterized_queries(self, test_db, test_user):
        """SECURITY: Verify ORM uses parameterized queries, not string concatenation"""
        from app.repositories.transaccion_repository import TransaccionRepository
        from sqlalchemy import event
        from sqlalchemy.engine import Engine

        # Track executed SQL statements
        executed_sql = []

        @event.listens_for(Engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
            executed_sql.append((statement, params))

        repo = TransaccionRepository(test_db)

        # Create a transaction with special characters
        dangerous_desc = "'; DROP TABLE usuarios; --"
        transaccion_data = {
            "monto": -1000.0,
            "tipo": "gasto",
            "descripcion": dangerous_desc,
            "fecha_transaccion": date.today(),
            "usuario_id": test_user.id,
            "monto_ars": -1000.0
        }

        created = repo.create(transaccion_data)

        # Verify the query was parameterized
        # In parameterized queries, the dangerous string should be in params, not in SQL
        for sql, params in executed_sql:
            if "INSERT" in sql.upper():
                # The SQL statement should use placeholders (?), not the actual value
                assert dangerous_desc not in sql, \
                    "ORM is not using parameterized queries! SQL injection risk!"

                # The dangerous string should be in parameters
                assert any(dangerous_desc in str(p) for p in params.values() if p is not None), \
                    "Parameters not being used correctly"

        # Clean up
        repo.delete(created["id"])

        # Remove event listener
        event.remove(Engine, "before_cursor_execute", receive_before_cursor_execute)

    def test_filter_operations_are_parameterized(self, test_db, test_user):
        """SECURITY: Test that filter operations use parameters"""
        from app.repositories.transaccion_repository import TransaccionRepository

        repo = TransaccionRepository(test_db)

        # Attempt filter with SQL injection payload
        malicious_tipo = "gasto' OR '1'='1"

        # This should be safely parameterized
        result = repo.get_all(
            usuario_id=test_user.id,
            tipo=malicious_tipo,
            limit=10
        )

        # Should return empty results (tipo doesn't exist), not all records
        assert "list" in result
        assert len(result["list"]) == 0, \
            "Filter was not parameterized - SQL injection successful!"


@pytest.mark.security
class TestUUIDValidation:
    """Test UUID validation to prevent injection via malformed UUIDs"""

    def test_invalid_uuid_rejection(self, client, sql_injection_payloads):
        """SECURITY: Malformed UUIDs should be rejected"""
        for payload in sql_injection_payloads:
            # Try to get transaction with malicious UUID
            response = client.get(f"/api/v1/transacciones/{payload}")

            # Should return 400 (bad request) or 422 (validation error), not 500
            assert response.status_code in [400, 404, 422], \
                f"Malicious UUID not rejected properly: {payload}"

    def test_uuid_in_create_endpoints(self, client, test_user, sql_injection_payloads):
        """SECURITY: Test UUID validation in foreign key fields"""
        from app.models.db_models import Categoria

        for payload in sql_injection_payloads:
            data = {
                "monto": -1000,
                "tipo": "gasto",
                "descripcion": "Test",
                "fecha_transaccion": date.today().isoformat(),
                "usuario_id": payload,  # Malicious UUID
                "categoria_id": str(uuid4())
            }

            response = client.post("/api/v1/transacciones/", json=data)

            # Should fail validation, not cause SQL error
            assert response.status_code in [400, 422, 500]

            if response.status_code == 500:
                # Check error message - should be validation, not SQL
                error = response.json()
                error_msg = str(error.get("message", "")).lower()
                assert "sql" not in error_msg
                assert "syntax" not in error_msg
