"""
Unit Tests for Repositories
"""
import pytest
from uuid import uuid4
from datetime import date, timedelta
from decimal import Decimal

from app.repositories.transaccion_repository import TransaccionRepository
from app.repositories.presupuesto_repository import PresupuestoRepository
from app.repositories.categoria_repository import CategoriaRepository
from app.repositories.metodo_pago_repository import MetodoPagoRepository


class TestTransaccionRepository:
    """Test cases for TransaccionRepository"""
    
    def test_create_transaccion(self, test_db, test_usuario, test_categoria, test_metodo_pago):
        """Test creating a transaction"""
        repo = TransaccionRepository(test_db)
        
        data = {
            "descripcion": "Test Transaction",
            "monto": -1000.00,
            "monto_ars": Decimal("-1000.00"),
            "moneda": "ARS",
            "tipo": "gasto",
            "fecha_transaccion": date.today(),
            "usuario_id": test_usuario.id,
            "categoria_id": test_categoria.id,
            "metodo_pago_id": test_metodo_pago.id
        }
        
        result = repo.create(data)
        
        assert result is not None
        assert result["descripcion"] == "Test Transaction"
        assert float(result["monto_ars"]) == -1000.00
        assert result["tipo"] == "gasto"
    
    def test_get_transaccion_by_id(self, test_db, test_transaccion):
        """Test getting a transaction by ID"""
        repo = TransaccionRepository(test_db)
        
        result = repo.get_by_id(test_transaccion.id)
        
        assert result is not None
        assert result["id"] == str(test_transaccion.id)
        assert result["descripcion"] == test_transaccion.descripcion
    
    def test_get_all_transacciones(self, test_db, test_transaccion):
        """Test getting all transactions"""
        repo = TransaccionRepository(test_db)
        
        result = repo.get_all(usuario_id=test_transaccion.usuario_id, limit=10, offset=0)
        
        assert "list" in result
        assert "pageInfo" in result
        assert len(result["list"]) > 0
        assert result["pageInfo"]["totalRows"] > 0
    
    def test_update_transaccion(self, test_db, test_transaccion):
        """Test updating a transaction"""
        repo = TransaccionRepository(test_db)
        
        update_data = {
            "descripcion": "Updated Transaction",
            "monto_ars": Decimal("-2000.00")
        }
        
        result = repo.update(test_transaccion.id, update_data)
        
        assert result is not None
        assert result["descripcion"] == "Updated Transaction"
        assert float(result["monto_ars"]) == -2000.00
    
    def test_delete_transaccion(self, test_db, test_transaccion):
        """Test deleting a transaction"""
        repo = TransaccionRepository(test_db)
        
        result = repo.delete(test_transaccion.id)
        
        assert result is True
        
        # Verify it's deleted
        deleted = repo.get_by_id(test_transaccion.id)
        assert deleted is None
    
    def test_bulk_create_transacciones(self, test_db, test_usuario, test_categoria, test_metodo_pago):
        """Test bulk creating transactions"""
        repo = TransaccionRepository(test_db)
        
        transactions_data = [
            {
                "descripcion": f"Transaction {i}",
                "monto": -1000.00 * i,
                "monto_ars": Decimal(f"-{1000 * i}.00"),
                "moneda": "ARS",
                "tipo": "gasto",
                "fecha_transaccion": date.today(),
                "usuario_id": test_usuario.id,
                "categoria_id": test_categoria.id,
                "metodo_pago_id": test_metodo_pago.id
            }
            for i in range(1, 6)
        ]
        
        result = repo.bulk_create(transactions_data)
        
        assert result["created_count"] == 5
        assert len(result["errors"]) == 0
    
    def test_bulk_delete_transacciones(self, test_db, test_usuario, test_categoria, test_metodo_pago):
        """Test bulk deleting transactions"""
        repo = TransaccionRepository(test_db)
        
        # Create multiple transactions
        ids = []
        for i in range(3):
            data = {
                "descripcion": f"Transaction {i}",
                "monto": -1000.00,
                "monto_ars": Decimal("-1000.00"),
                "moneda": "ARS",
                "tipo": "gasto",
                "fecha_transaccion": date.today(),
                "usuario_id": test_usuario.id,
                "categoria_id": test_categoria.id,
                "metodo_pago_id": test_metodo_pago.id
            }
            created = repo.create(data)
            ids.append(uuid4(created["id"]))  # Convert string to UUID
        
        result = repo.bulk_delete(ids)
        
        assert result["deleted_count"] == 3
        assert len(result["failed_ids"]) == 0


class TestPresupuestoRepository:
    """Test cases for PresupuestoRepository"""
    
    def test_create_presupuesto(self, test_db, test_usuario, test_categoria):
        """Test creating a budget"""
        repo = PresupuestoRepository(test_db)
        
        data = {
            "nombre": "Test Budget",
            "descripcion": "Test description",
            "monto_limite": Decimal("50000.00"),
            "monto_gastado": Decimal("0.00"),
            "periodo": "mensual",
            "fecha_inicio": date.today(),
            "fecha_fin": date.today() + timedelta(days=30),
            "alerta_porcentaje": 80,
            "estado": "activo",
            "color": "#4CAF50",
            "usuario_id": test_usuario.id,
            "categoria_id": test_categoria.id
        }
        
        result = repo.create(data)
        
        assert result is not None
        assert result["nombre"] == "Test Budget"
        assert float(result["monto_limite"]) == 50000.00
        assert result["estado"] == "activo"
    
    def test_get_presupuesto_by_id(self, test_db, test_presupuesto):
        """Test getting a budget by ID"""
        repo = PresupuestoRepository(test_db)
        
        result = repo.get_by_id(test_presupuesto.id)
        
        assert result is not None
        assert result["id"] == str(test_presupuesto.id)
        assert result["nombre"] == test_presupuesto.nombre
    
    def test_get_all_presupuestos(self, test_db, test_presupuesto):
        """Test getting all budgets"""
        repo = PresupuestoRepository(test_db)
        
        result = repo.get_all(usuario_id=test_presupuesto.usuario_id, limit=10, offset=0)
        
        assert "list" in result
        assert "pageInfo" in result
        assert len(result["list"]) > 0
    
    def test_calculate_spent_amount(self, test_db, test_presupuesto, test_transaccion):
        """Test calculating spent amount for a budget"""
        repo = PresupuestoRepository(test_db)
        
        # Update transaction to match budget dates and category
        test_transaccion.fecha_transaccion = test_presupuesto.fecha_inicio
        test_transaccion.categoria_id = test_presupuesto.categoria_id
        test_transaccion.usuario_id = test_presupuesto.usuario_id
        test_db.commit()
        
        spent = repo.calculate_spent_amount(test_presupuesto.id)
        
        assert spent >= 0
        assert isinstance(spent, Decimal)
    
    def test_update_presupuesto(self, test_db, test_presupuesto):
        """Test updating a budget"""
        repo = PresupuestoRepository(test_db)
        
        update_data = {
            "nombre": "Updated Budget",
            "monto_limite": Decimal("75000.00")
        }
        
        result = repo.update(test_presupuesto.id, update_data)
        
        assert result is not None
        assert result["nombre"] == "Updated Budget"
        assert float(result["monto_limite"]) == 75000.00
    
    def test_delete_presupuesto(self, test_db, test_presupuesto):
        """Test deleting a budget"""
        repo = PresupuestoRepository(test_db)
        
        result = repo.delete(test_presupuesto.id)
        
        assert result is True
        
        # Verify it's deleted
        deleted = repo.get_by_id(test_presupuesto.id)
        assert deleted is None


class TestCategoriaRepository:
    """Test cases for CategoriaRepository"""
    
    def test_get_all_categorias(self, test_db, test_categoria):
        """Test getting all categories"""
        repo = CategoriaRepository(test_db)
        
        result = repo.get_all()
        
        assert "list" in result
        assert len(result["list"]) > 0
    
    def test_get_categoria_by_id(self, test_db, test_categoria):
        """Test getting a category by ID"""
        repo = CategoriaRepository(test_db)
        
        result = repo.get_by_id(test_categoria.id)
        
        assert result is not None
        assert result["id"] == str(test_categoria.id)
        assert result["nombre"] == test_categoria.nombre


class TestMetodoPagoRepository:
    """Test cases for MetodoPagoRepository"""
    
    def test_get_all_metodos_pago(self, test_db, test_metodo_pago):
        """Test getting all payment methods"""
        repo = MetodoPagoRepository(test_db)
        
        result = repo.get_all()
        
        assert "list" in result
        assert len(result["list"]) > 0
    
    def test_get_metodo_pago_by_id(self, test_db, test_metodo_pago):
        """Test getting a payment method by ID"""
        repo = MetodoPagoRepository(test_db)
        
        result = repo.get_by_id(test_metodo_pago.id)
        
        assert result is not None
        assert result["id"] == str(test_metodo_pago.id)
        assert result["nombre"] == test_metodo_pago.nombre

