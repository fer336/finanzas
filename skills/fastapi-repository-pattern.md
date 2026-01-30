# fastapi-repository-pattern

## 📋 Propósito
Implementar una separación clara entre la lógica de negocio y el acceso a datos en el backend FastAPI, siguiendo el patrón Repository para facilitar testing, mantenibilidad y escalabilidad.

## 🎯 Cuándo Usar
- Al crear un nuevo endpoint que requiere acceso a base de datos
- Al refactorizar código con queries SQLAlchemy directas en routers
- Al necesitar reutilizar lógica de acceso a datos en múltiples endpoints
- Al escribir tests unitarios (permite mockear el repository fácilmente)

## 📐 Patrón de Diseño
**Repository Pattern** + **Dependency Injection**

## 💻 Implementación

### Estructura de 3 Capas

```
app/
├── routers/           # Capa de presentación (HTTP)
│   └── transacciones.py
├── services/          # Lógica de negocio (opcional)
│   └── agent_tools.py
├── repositories/      # Acceso a datos (DB)
│   └── transaccion_repository.py
└── models/
    └── db_models.py   # Modelos SQLAlchemy
```

### 1. Router (Capa HTTP)

```python
# app/routers/transacciones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.repositories.transaccion_repository import TransaccionRepositoryPG

router = APIRouter(prefix="/api/transacciones", tags=["transacciones"])

@router.get("/")
async def list_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todas las transacciones con paginación"""
    repo = TransaccionRepositoryPG(db)
    transactions = repo.get_all(skip=skip, limit=limit)
    return {
        "success": True,
        "data": transactions,
        "total": len(transactions)
    }

@router.post("/")
async def create_transaction(
    transaccion_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Crea una nueva transacción"""
    repo = TransaccionRepositoryPG(db)
    
    try:
        nueva_transaccion = repo.create(transaccion_data)
        return {
            "success": True,
            "message": "Transacción creada exitosamente",
            "data": nueva_transaccion
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando transacción: {str(e)}")

@router.get("/{transaccion_id}")
async def get_transaction(
    transaccion_id: str,
    db: Session = Depends(get_db)
):
    """Obtiene una transacción por ID"""
    repo = TransaccionRepositoryPG(db)
    transaccion = repo.get_by_id(transaccion_id)
    
    if not transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    return {
        "success": True,
        "data": transaccion
    }

@router.put("/{transaccion_id}")
async def update_transaction(
    transaccion_id: str,
    transaccion_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Actualiza una transacción existente"""
    repo = TransaccionRepositoryPG(db)
    
    try:
        updated = repo.update(transaccion_id, transaccion_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        return {
            "success": True,
            "message": "Transacción actualizada exitosamente",
            "data": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{transaccion_id}")
async def delete_transaction(
    transaccion_id: str,
    db: Session = Depends(get_db)
):
    """Elimina una transacción"""
    repo = TransaccionRepositoryPG(db)
    
    success = repo.delete(transaccion_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    return {
        "success": True,
        "message": "Transacción eliminada exitosamente"
    }
```

### 2. Repository (Acceso a Datos)

```python
# app/repositories/transaccion_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from uuid import UUID
from app.models.db_models import Transaccion, Categoria, MetodoPago

class TransaccionRepositoryPG:
    """Repository para operaciones CRUD de Transacciones en PostgreSQL"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        tipo: Optional[str] = None,
        moneda: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Obtiene todas las transacciones con filtros opcionales"""
        query = self.db.query(Transaccion).options(
            joinedload(Transaccion.categoria),
            joinedload(Transaccion.metodo_pago)
        )
        
        if tipo:
            query = query.filter(func.lower(Transaccion.tipo) == tipo.lower())
        
        if moneda:
            query = query.filter(Transaccion.moneda == moneda)
        
        transacciones = query.order_by(Transaccion.fecha_transaccion.desc()).offset(skip).limit(limit).all()
        
        return [self._to_dict(t) for t in transacciones]
    
    def get_by_id(self, transaccion_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene una transacción por ID"""
        try:
            transaccion = self.db.query(Transaccion).options(
                joinedload(Transaccion.categoria),
                joinedload(Transaccion.metodo_pago)
            ).filter(Transaccion.id == UUID(transaccion_id)).first()
            
            return self._to_dict(transaccion) if transaccion else None
        except Exception as e:
            print(f"Error al obtener transacción: {str(e)}")
            return None
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea una nueva transacción"""
        try:
            nueva_transaccion = Transaccion(
                descripcion=data.get('descripcion', ''),
                monto=data.get('monto', 0),
                tipo=data.get('tipo', 'gasto'),
                moneda=data.get('moneda', 'ARS'),
                fecha_transaccion=data.get('fecha_transaccion', date.today()),
                categoria_id=UUID(data['categoria_id']) if data.get('categoria_id') else None,
                metodo_pago_id=UUID(data['metodo_pago_id']) if data.get('metodo_pago_id') else None,
                objetivo_id=UUID(data['objetivo_id']) if data.get('objetivo_id') else None,
                es_credito=data.get('es_credito', False),
                es_aporte_objetivo=data.get('es_aporte_objetivo', True),
                notas=data.get('notas')
            )
            
            self.db.add(nueva_transaccion)
            self.db.commit()
            self.db.refresh(nueva_transaccion)
            
            return self._to_dict(nueva_transaccion)
        
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Error al crear transacción: {str(e)}")
    
    def update(self, transaccion_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Actualiza una transacción existente"""
        try:
            transaccion = self.db.query(Transaccion).filter(
                Transaccion.id == UUID(transaccion_id)
            ).first()
            
            if not transaccion:
                return None
            
            # Actualizar campos
            for key, value in data.items():
                if key.endswith('_id') and value:
                    value = UUID(value)
                if hasattr(transaccion, key):
                    setattr(transaccion, key, value)
            
            self.db.commit()
            self.db.refresh(transaccion)
            
            return self._to_dict(transaccion)
        
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Error al actualizar transacción: {str(e)}")
    
    def delete(self, transaccion_id: str) -> bool:
        """Elimina una transacción"""
        try:
            transaccion = self.db.query(Transaccion).filter(
                Transaccion.id == UUID(transaccion_id)
            ).first()
            
            if not transaccion:
                return False
            
            self.db.delete(transaccion)
            self.db.commit()
            
            return True
        
        except Exception as e:
            self.db.rollback()
            print(f"Error al eliminar transacción: {str(e)}")
            return False
    
    def get_balance_by_currency(self, moneda: str = 'ARS') -> Dict[str, float]:
        """Calcula el balance (ingresos - gastos) por moneda"""
        ingresos = self.db.query(func.sum(Transaccion.monto)).filter(
            and_(
                func.lower(Transaccion.tipo) == 'ingreso',
                Transaccion.moneda == moneda,
                Transaccion.es_credito == False
            )
        ).scalar() or 0
        
        gastos = self.db.query(func.sum(Transaccion.monto)).filter(
            and_(
                func.lower(Transaccion.tipo) == 'gasto',
                Transaccion.moneda == moneda,
                Transaccion.es_credito == False
            )
        ).scalar() or 0
        
        return {
            'ingresos': float(ingresos),
            'gastos': float(gastos),
            'balance': float(ingresos - gastos),
            'moneda': moneda
        }
    
    def _to_dict(self, transaccion: Transaccion) -> Dict[str, Any]:
        """Convierte un modelo SQLAlchemy a diccionario"""
        if not transaccion:
            return None
        
        return {
            'id': str(transaccion.id),
            'descripcion': transaccion.descripcion,
            'monto': float(transaccion.monto),
            'tipo': transaccion.tipo,
            'moneda': transaccion.moneda,
            'fecha_transaccion': transaccion.fecha_transaccion.isoformat(),
            'categoria_id': str(transaccion.categoria_id) if transaccion.categoria_id else None,
            'metodo_pago_id': str(transaccion.metodo_pago_id) if transaccion.metodo_pago_id else None,
            'objetivo_id': str(transaccion.objetivo_id) if transaccion.objetivo_id else None,
            'es_credito': transaccion.es_credito,
            'es_aporte_objetivo': getattr(transaccion, 'es_aporte_objetivo', True),
            'fecha_pago_real': transaccion.fecha_pago_real.isoformat() if transaccion.fecha_pago_real else None,
            'notas': transaccion.notas,
            'Categorias': {
                'id': str(transaccion.categoria.id),
                'Nombre': transaccion.categoria.nombre
            } if transaccion.categoria else None,
            'MetodosPago': {
                'id': str(transaccion.metodo_pago.id),
                'Nombre': transaccion.metodo_pago.nombre
            } if transaccion.metodo_pago else None
        }
```

## ✅ Checklist Pre-Commit

- [ ] ¿El router solo maneja HTTP (request/response)?
- [ ] ¿El repository solo interactúa con la DB?
- [ ] ¿Usé `joinedload()` para evitar N+1 queries?
- [ ] ¿Los errores se manejan con `try/except` y `rollback()`?
- [ ] ¿Los IDs son UUID, no integers?
- [ ] ¿Usé `Depends(get_db)` para inyección de dependencias?
- [ ] ¿Los métodos del repository retornan Dict[str, Any]?
- [ ] ¿Implementé `_to_dict()` para serialización consistente?

## ❌ Anti-Patrones

- ❌ **NO hacer queries en el router**  
  ```python
  # MAL
  @router.get("/")
  def list(db: Session = Depends(get_db)):
      return db.query(Transaccion).all()
  ```
  ✅ **SÍ delegar al repository**

- ❌ **NO retornar modelos SQLAlchemy directamente**  
  ✅ **SÍ convertir a dict con `_to_dict()`**

- ❌ **NO usar `SELECT *` sin necesidad**  
  ✅ **SÍ usar `joinedload()` para relaciones específicas**

- ❌ **NO olvidar `commit()` después de cambios**  
  ✅ **SÍ hacer `commit()` y `refresh()`**

## 🔧 Testeo

```python
# tests/test_transaccion_repository.py
import pytest
from app.repositories.transaccion_repository import TransaccionRepositoryPG

def test_create_transaction(db_session):
    repo = TransaccionRepositoryPG(db_session)
    
    data = {
        'descripcion': 'Test transaction',
        'monto': 100.0,
        'tipo': 'gasto',
        'moneda': 'ARS'
    }
    
    result = repo.create(data)
    
    assert result['descripcion'] == 'Test transaction'
    assert result['monto'] == 100.0
```

## 🔗 Recursos

- [FastAPI Dependency Injection](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)
- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)

