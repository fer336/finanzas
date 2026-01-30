"""
Performance Tests
Tests for response times, database query optimization, and resource usage
"""
import pytest
import time
from datetime import date, timedelta
from uuid import uuid4
import psutil
import os


@pytest.mark.performance
class TestEndpointResponseTimes:
    """Test that API endpoints respond within acceptable time limits"""

    def test_get_transacciones_performance(
        self, client, test_user, bulk_transacciones, performance_timer
    ):
        """PERFORMANCE: GET /transacciones should respond quickly"""
        with performance_timer:
            response = client.get(
                "/api/v1/transacciones/",
                params={"user_id": str(test_user.id), "limit": 100}
            )

        assert response.status_code == 200
        assert performance_timer.elapsed() < 1.0, \
            f"GET /transacciones took {performance_timer.elapsed():.3f}s (limit: 1.0s)"

    def test_create_transaccion_performance(
        self, client, test_user, test_categoria, test_metodo_pago, performance_timer
    ):
        """PERFORMANCE: POST /transacciones should respond quickly"""
        data = {
            "monto": -5000.0,
            "tipo": "gasto",
            "descripcion": "Performance test",
            "fecha_transaccion": date.today().isoformat(),
            "usuario_id": str(test_user.id),
            "categoria_id": str(test_categoria.id),
            "metodo_pago_id": str(test_metodo_pago.id)
        }

        with performance_timer:
            response = client.post("/api/v1/transacciones/", json=data)

        assert response.status_code == 200
        assert performance_timer.elapsed() < 0.5, \
            f"POST /transacciones took {performance_timer.elapsed():.3f}s (limit: 0.5s)"

        # Cleanup
        if response.status_code == 200:
            created_id = response.json()["id"]
            client.delete(f"/api/v1/transacciones/{created_id}")

    def test_estadisticas_performance(
        self, client, test_user, bulk_transacciones, performance_timer
    ):
        """PERFORMANCE: Estadisticas endpoint with 100 transactions"""
        fecha_desde = (date.today() - timedelta(days=100)).isoformat()
        fecha_hasta = date.today().isoformat()

        with performance_timer:
            response = client.get(
                "/api/v1/transacciones/estadisticas",
                params={
                    "fecha_desde": fecha_desde,
                    "fecha_hasta": fecha_hasta,
                    "user_id": str(test_user.id)
                }
            )

        assert response.status_code == 200
        assert performance_timer.elapsed() < 2.0, \
            f"Estadisticas took {performance_timer.elapsed():.3f}s (limit: 2.0s)"

    def test_bulk_create_performance(
        self, client, test_user, test_categoria, test_metodo_pago, performance_timer
    ):
        """PERFORMANCE: Bulk creation of 50 transactions"""
        transactions = []
        for i in range(50):
            transactions.append({
                "monto": -float(1000 + i),
                "tipo": "gasto",
                "descripcion": f"Bulk test {i}",
                "fecha_transaccion": date.today().isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id)
            })

        with performance_timer:
            response = client.post(
                "/api/v1/transacciones/bulk-create",
                json={"transactions": transactions}
            )

        assert response.status_code == 200
        elapsed = performance_timer.elapsed()
        avg_time_per_transaction = elapsed / 50

        assert elapsed < 5.0, \
            f"Bulk create 50 transactions took {elapsed:.3f}s (limit: 5.0s)"
        assert avg_time_per_transaction < 0.1, \
            f"Average time per transaction: {avg_time_per_transaction:.4f}s (limit: 0.1s)"

    def test_health_check_performance(self, client, performance_timer):
        """PERFORMANCE: Health check should be instant"""
        with performance_timer:
            response = client.get("/health")

        assert response.status_code == 200
        assert performance_timer.elapsed() < 0.1, \
            f"Health check took {performance_timer.elapsed():.3f}s (limit: 0.1s)"


@pytest.mark.performance
@pytest.mark.database
class TestDatabaseQueryOptimization:
    """Test database query efficiency"""

    def test_no_n_plus_1_query_problem(self, test_db, test_user, bulk_transacciones):
        """PERFORMANCE: Check for N+1 query problem in transacciones"""
        from app.repositories.transaccion_repository import TransaccionRepository
        from sqlalchemy import event
        from sqlalchemy.engine import Engine

        query_count = [0]

        @event.listens_for(Engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
            query_count[0] += 1

        repo = TransaccionRepository(test_db)

        # Get 100 transactions with relationships
        result = repo.get_all(usuario_id=test_user.id, limit=100)
        transactions = result["list"]

        # With eager loading (joinedload), should use 1-2 queries max
        # Without eager loading, would use 1 + 100 + 100 queries (N+1 problem)
        assert query_count[0] <= 3, \
            f"N+1 query problem detected! Executed {query_count[0]} queries for 100 records"

        event.remove(Engine, "before_cursor_execute", receive_before_cursor_execute)

    def test_pagination_efficiency(self, test_db, test_user, bulk_transacciones):
        """PERFORMANCE: Pagination should not load all records"""
        from app.repositories.transaccion_repository import TransaccionRepository

        repo = TransaccionRepository(test_db)

        # Request only 10 records
        start_time = time.perf_counter()
        result = repo.get_all(usuario_id=test_user.id, limit=10, offset=0)
        time_10_records = time.perf_counter() - start_time

        # Request 100 records
        start_time = time.perf_counter()
        result_100 = repo.get_all(usuario_id=test_user.id, limit=100, offset=0)
        time_100_records = time.perf_counter() - start_time

        # Time should scale linearly, not exponentially
        # 100 records should take less than 15x time of 10 records
        time_ratio = time_100_records / time_10_records if time_10_records > 0 else 0
        assert time_ratio < 15, \
            f"Pagination not efficient: 100 records took {time_ratio:.1f}x time of 10 records"

    def test_index_usage_on_fecha_transaccion(self, test_db, test_user, bulk_transacciones):
        """PERFORMANCE: Verify indexes are used for date queries"""
        from app.repositories.transaccion_repository import TransaccionRepository

        repo = TransaccionRepository(test_db)

        # Query by date range (should use index)
        start_time = time.perf_counter()
        result = repo.get_all(
            usuario_id=test_user.id,
            fecha_desde=date.today() - timedelta(days=30),
            fecha_hasta=date.today(),
            limit=100
        )
        elapsed = time.perf_counter() - start_time

        # With proper indexes, should be fast even with 100 records
        assert elapsed < 0.5, \
            f"Date range query took {elapsed:.3f}s - index may not be used"

    def test_estadisticas_query_efficiency(self, test_db, test_user, bulk_transacciones):
        """PERFORMANCE: Estadisticas should use aggregation efficiently"""
        from app.repositories.transaccion_repository import TransaccionRepository

        repo = TransaccionRepository(test_db)

        start_time = time.perf_counter()
        stats = repo.get_estadisticas(
            fecha_desde=str(date.today() - timedelta(days=100)),
            fecha_hasta=str(date.today()),
            usuario_id=test_user.id
        )
        elapsed = time.perf_counter() - start_time

        # Aggregation queries should be optimized
        assert elapsed < 1.0, \
            f"Estadisticas query took {elapsed:.3f}s (limit: 1.0s)"

        # Verify results
        assert "total_ingresos" in stats
        assert "total_gastos" in stats
        assert "balance_neto" in stats


@pytest.mark.performance
class TestMemoryUsage:
    """Test memory usage and potential leaks"""

    def test_bulk_operations_memory_usage(
        self, test_db, test_user, test_categoria, test_metodo_pago
    ):
        """PERFORMANCE: Bulk operations should not cause memory spikes"""
        from app.models.db_models import Transaccion

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Create 500 transactions
        transactions = []
        for i in range(500):
            t = Transaccion(
                id=uuid4(),
                monto=-float(1000 + i),
                moneda="ARS",
                monto_ars=-float(1000 + i),
                tasa_cambio=1.0,
                descripcion=f"Memory test {i}",
                fecha_transaccion=date.today(),
                tipo="gasto",
                usuario_id=test_user.id,
                categoria_id=test_categoria.id,
                metodo_pago_id=test_metodo_pago.id
            )
            transactions.append(t)

        test_db.bulk_save_objects(transactions)
        test_db.commit()

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable (less than 100 MB for 500 records)
        assert memory_increase < 100, \
            f"Memory increased by {memory_increase:.1f} MB for 500 transactions"

        # Cleanup
        test_db.query(Transaccion).filter(
            Transaccion.descripcion.like("Memory test%")
        ).delete()
        test_db.commit()

    def test_session_cleanup(self, test_db):
        """PERFORMANCE: Database sessions should be properly cleaned up"""
        from app.database import SessionLocal

        # Create and close multiple sessions
        sessions = []
        for _ in range(10):
            session = SessionLocal()
            sessions.append(session)

        # Close all sessions
        for session in sessions:
            session.close()

        # All sessions should be closed
        for session in sessions:
            assert not session.is_active, "Session not properly closed"


@pytest.mark.performance
@pytest.mark.slow
class TestConcurrentRequests:
    """Test behavior under concurrent load"""

    def test_concurrent_read_requests(self, client, test_user, bulk_transacciones):
        """PERFORMANCE: Handle multiple concurrent read requests"""
        import concurrent.futures

        def get_transacciones():
            response = client.get(
                "/api/v1/transacciones/",
                params={"user_id": str(test_user.id), "limit": 50}
            )
            return response.status_code, response.elapsed.total_seconds() if hasattr(response, 'elapsed') else 0

        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            start_time = time.perf_counter()
            futures = [executor.submit(get_transacciones) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
            elapsed = time.perf_counter() - start_time

        # All requests should succeed
        assert all(status == 200 for status, _ in results), \
            "Some concurrent requests failed"

        # Total time should be less than sequential time
        # (should benefit from concurrent execution)
        assert elapsed < 5.0, \
            f"10 concurrent requests took {elapsed:.3f}s (limit: 5.0s)"

    def test_concurrent_write_requests(
        self, client, test_user, test_categoria, test_metodo_pago
    ):
        """PERFORMANCE: Handle concurrent write requests without race conditions"""
        import concurrent.futures

        def create_transaccion(index):
            data = {
                "monto": -float(1000 + index),
                "tipo": "gasto",
                "descripcion": f"Concurrent test {index}",
                "fecha_transaccion": date.today().isoformat(),
                "usuario_id": str(test_user.id),
                "categoria_id": str(test_categoria.id),
                "metodo_pago_id": str(test_metodo_pago.id)
            }
            response = client.post("/api/v1/transacciones/", json=data)
            return response.status_code, response.json() if response.status_code == 200 else None

        # Make 5 concurrent write requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_transaccion, i) for i in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All requests should succeed (no race conditions)
        successful = [r for r in results if r[0] == 200]
        assert len(successful) == 5, \
            f"Only {len(successful)}/5 concurrent writes succeeded"

        # All should have unique IDs
        ids = [r[1]["id"] for r in successful if r[1]]
        assert len(ids) == len(set(ids)), "Duplicate IDs detected - race condition!"

        # Cleanup
        for status, data in successful:
            if data:
                client.delete(f"/api/v1/transacciones/{data['id']}")


@pytest.mark.performance
class TestConnectionPooling:
    """Test database connection pooling efficiency"""

    def test_connection_pool_reuse(self, test_db):
        """PERFORMANCE: Connections should be reused from pool"""
        from app.database import engine

        # Get pool statistics
        pool = engine.pool

        initial_size = pool.size()
        initial_checkedout = pool.checkedout()

        # Make multiple queries
        for _ in range(10):
            from app.repositories.transaccion_repository import TransaccionRepository
            repo = TransaccionRepository(test_db)
            repo.get_all(limit=1)

        final_size = pool.size()
        final_checkedout = pool.checkedout()

        # Pool should not grow significantly (connections are reused)
        assert final_size <= initial_size + 2, \
            f"Connection pool grew from {initial_size} to {final_size} - not reusing connections"

    def test_connection_pool_not_exhausted(self):
        """PERFORMANCE: Connection pool should not be exhausted under normal load"""
        from app.database import SessionLocal, engine

        sessions = []
        try:
            # Create multiple sessions
            for _ in range(5):
                session = SessionLocal()
                sessions.append(session)
                # Make a query
                session.execute("SELECT 1")

            # Pool should still have connections available
            pool = engine.pool
            assert pool.checkedout() < pool.size(), \
                "Connection pool is exhausted"

        finally:
            # Cleanup
            for session in sessions:
                session.close()
