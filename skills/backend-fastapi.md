# Skill: Backend FastAPI Patterns

> **Para**: Backend Agent  
> **Dominio**: Services, Repositories, Business Logic, Validation

---

## 📋 Cuándo Usar Este Skill

- ✅ Crear servicios de lógica de negocio
- ✅ Crear repositorios de acceso a datos
- ✅ Implementar validaciones con Pydantic
- ✅ Manejar transacciones de base de datos

---

## 🚨 REGLAS CRÍTICAS

### 1. Repository Pattern Obligatorio

**SIEMPRE** separa en capas:
- **Router** → Define endpoint (API Agent)
- **Service** → Lógica de negocio (Backend Agent)
- **Repository** → Acceso a datos (Backend Agent)
- **Model** → Esquema DB (Database Agent)

```python
# ✅ CORRECTO - Separación de capas

# repositories/transaccion_repository.py
class TransaccionRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, data: TransaccionCreate) -> dict:
        transaccion = Transaccion(**data.dict())
        self.db.add(transaccion)
        self.db.commit()
        self.db.refresh(transaccion)
        return self._to_dict(transaccion)
    
    def get_by_id(self, id: UUID) -> dict:
        transaccion = self.db.query(Transaccion).filter(Transaccion.id == id).first()
        return self._to_dict(transaccion) if transaccion else None
    
    def _to_dict(self, transaccion: Transaccion) -> dict:
        return {
            "id": str(transaccion.id),
            "monto": float(transaccion.monto),
            "tipo": transaccion.tipo,
            # ...
        }

# services/transaccion_service.py
class TransaccionService:
    def __init__(self, repo: TransaccionRepository):
        self.repo = repo
    
    def crear_transaccion(self, data: TransaccionCreate) -> dict:
        # Validación de negocio
        if data.monto <= 0:
            raise ValueError("Monto debe ser positivo")
        
        if data.tipo not in ['ingreso', 'gasto']:
            raise ValueError("Tipo inválido")
        
        # Crear
        transaccion = self.repo.create(data)
        
        # Lógica adicional (ej: actualizar balance)
        self._actualizar_balance(transaccion)
        
        return transaccion
    
    def _actualizar_balance(self, transaccion: dict):
        # Lógica de negocio privada
        pass

# ❌ INCORRECTO - Todo en el router
@router.post("/")
async def create_transaction(data: dict, db: Session = Depends(get_db)):
    transaccion = Transaccion(**data)
    db.add(transaccion)
    db.commit()
    return transaccion  # MAL: lógica en router
```

---

### 2. Validación con Pydantic

```python
# ✅ CORRECTO
from pydantic import BaseModel, validator, Field
from decimal import Decimal
from uuid import UUID
from datetime import date

class TransaccionCreate(BaseModel):
    monto: Decimal = Field(gt=0, description="Monto debe ser positivo")
    moneda: str = Field(default="ARS", pattern="^(ARS|USD|EUR|BRL)$")
    tipo: str
    descripcion: str = Field(min_length=1, max_length=500)
    categoria_id: UUID
    fecha_transaccion: date
    
    @validator('tipo')
    def validate_tipo(cls, v):
        if v not in ['ingreso', 'gasto']:
            raise ValueError('Tipo debe ser "ingreso" o "gasto"')
        return v
    
    @validator('descripcion')
    def validate_descripcion(cls, v):
        if not v.strip():
            raise ValueError('Descripción no puede estar vacía')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "monto": 1500.50,
                "moneda": "ARS",
                "tipo": "gasto",
                "descripcion": "Compra supermercado",
                "categoria_id": "123e4567-e89b-12d3-a456-426614174000",
                "fecha_transaccion": "2026-01-24"
            }
        }

# ❌ INCORRECTO - Validación manual
def create_transaction(data: dict):
    if 'monto' not in data:
        raise ValueError("Monto requerido")
    if data['monto'] <= 0:
        raise ValueError("Monto debe ser positivo")
    # ... más validaciones manuales
```

---

### 3. Manejo de Errores Consistente

```python
# ✅ CORRECTO
from fastapi import HTTPException

class CategoriaService:
    def get_by_id(self, id: UUID) -> dict:
        categoria = self.repo.get_by_id(id)
        if not categoria:
            raise HTTPException(
                status_code=404,
                detail=f"Categoría {id} no encontrada"
            )
        return categoria
    
    def create(self, data: CategoriaCreate) -> dict:
        # Validación de negocio
        if self.repo.exists_by_name(data.nombre):
            raise HTTPException(
                status_code=409,
                detail=f"Categoría '{data.nombre}' ya existe"
            )
        
        try:
            return self.repo.create(data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error creando categoría: {str(e)}"
            )

# ❌ INCORRECTO
def get_by_id(self, id: UUID):
    categoria = self.repo.get_by_id(id)
    return categoria or {}  # MAL: retornar dict vacío
    
def create(self, data: CategoriaCreate):
    if self.repo.exists_by_name(data.nombre):
        return None  # MAL: retornar None
```

---

## 📐 PATRONES OBLIGATORIOS

### Service + Repository Pattern

```python
# services/categoria_service.py
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException
from app.repositories.categoria_repository import CategoriaRepository
from app.models.schemas import CategoriaCreate, CategoriaUpdate

class CategoriaService:
    """
    Servicio de lógica de negocio para categorías
    """
    def __init__(self, repo: CategoriaRepository):
        self.repo = repo
    
    def get_all(self, tipo: Optional[str] = None, activa: Optional[bool] = None) -> List[dict]:
        """
        Obtener todas las categorías con filtros opcionales
        """
        return self.repo.get_all(tipo=tipo, activa=activa)
    
    def get_by_id(self, id: UUID) -> dict:
        """
        Obtener categoría por ID
        """
        categoria = self.repo.get_by_id(id)
        if not categoria:
            raise HTTPException(
                status_code=404,
                detail=f"Categoría {id} no encontrada"
            )
        return categoria
    
    def create(self, data: CategoriaCreate) -> dict:
        """
        Crear nueva categoría
        """
        # Validación de negocio
        if self.repo.exists_by_name(data.nombre):
            raise HTTPException(
                status_code=409,
                detail=f"Categoría '{data.nombre}' ya existe"
            )
        
        # Validar tipo
        if data.tipo not in ['ingreso', 'gasto']:
            raise HTTPException(
                status_code=400,
                detail="Tipo debe ser 'ingreso' o 'gasto'"
            )
        
        # Crear
        try:
            return self.repo.create(data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error creando categoría: {str(e)}"
            )
    
    def update(self, id: UUID, data: CategoriaUpdate) -> dict:
        """
        Actualizar categoría existente
        """
        # Verificar que existe
        existing = self.repo.get_by_id(id)
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Categoría {id} no encontrada"
            )
        
        # Si cambia el nombre, verificar que no exista
        if data.nombre and data.nombre != existing['nombre']:
            if self.repo.exists_by_name(data.nombre):
                raise HTTPException(
                    status_code=409,
                    detail=f"Categoría '{data.nombre}' ya existe"
                )
        
        # Actualizar
        try:
            return self.repo.update(id, data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error actualizando categoría: {str(e)}"
            )
    
    def delete(self, id: UUID) -> dict:
        """
        Eliminar categoría (soft delete)
        """
        categoria = self.repo.get_by_id(id)
        if not categoria:
            raise HTTPException(
                status_code=404,
                detail=f"Categoría {id} no encontrada"
            )
        
        # Verificar que no tenga transacciones
        if self.repo.has_transactions(id):
            raise HTTPException(
                status_code=409,
                detail="No se puede eliminar categoría con transacciones asociadas"
            )
        
        return self.repo.delete(id)
    
    def toggle_active(self, id: UUID) -> dict:
        """
        Activar/desactivar categoría
        """
        categoria = self.repo.get_by_id(id)
        if not categoria:
            raise HTTPException(
                status_code=404,
                detail=f"Categoría {id} no encontrada"
            )
        
        return self.repo.update(id, CategoriaUpdate(activa=not categoria['activa']))
```

---

### Repository Pattern

```python
# repositories/categoria_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.db_models import Categoria, Transaccion

class CategoriaRepository:
    """
    Repositorio de acceso a datos para categorías
    """
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self, tipo: Optional[str] = None, activa: Optional[bool] = None) -> List[dict]:
        """
        Obtener todas las categorías con filtros
        """
        query = self.db.query(Categoria)
        
        # Aplicar filtros
        if tipo:
            query = query.filter(Categoria.tipo == tipo)
        if activa is not None:
            query = query.filter(Categoria.activa == activa)
        
        # Ordenar
        query = query.order_by(Categoria.nombre)
        
        categorias = query.all()
        return [self._to_dict(c) for c in categorias]
    
    def get_by_id(self, id: UUID) -> Optional[dict]:
        """
        Obtener categoría por ID
        """
        categoria = self.db.query(Categoria).filter(Categoria.id == id).first()
        return self._to_dict(categoria) if categoria else None
    
    def exists_by_name(self, nombre: str) -> bool:
        """
        Verificar si existe categoría con ese nombre
        """
        return self.db.query(Categoria).filter(
            Categoria.nombre == nombre
        ).first() is not None
    
    def create(self, data: CategoriaCreate) -> dict:
        """
        Crear nueva categoría
        """
        categoria = Categoria(
            **data.dict(),
            fecha_creacion=datetime.utcnow(),
            fecha_actualizacion=datetime.utcnow()
        )
        self.db.add(categoria)
        self.db.commit()
        self.db.refresh(categoria)
        return self._to_dict(categoria)
    
    def update(self, id: UUID, data: CategoriaUpdate) -> dict:
        """
        Actualizar categoría
        """
        categoria = self.db.query(Categoria).filter(Categoria.id == id).first()
        if not categoria:
            return None
        
        # Actualizar solo campos provistos
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(categoria, field, value)
        
        categoria.fecha_actualizacion = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(categoria)
        return self._to_dict(categoria)
    
    def delete(self, id: UUID) -> dict:
        """
        Eliminar categoría (soft delete)
        """
        categoria = self.db.query(Categoria).filter(Categoria.id == id).first()
        if not categoria:
            return None
        
        categoria.activa = False
        categoria.fecha_actualizacion = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(categoria)
        return self._to_dict(categoria)
    
    def has_transactions(self, id: UUID) -> bool:
        """
        Verificar si la categoría tiene transacciones
        """
        count = self.db.query(Transaccion).filter(
            Transaccion.categoria_id == id
        ).count()
        return count > 0
    
    def _to_dict(self, categoria: Categoria) -> dict:
        """
        Convertir modelo SQLAlchemy a diccionario
        """
        return {
            "id": str(categoria.id),
            "nombre": categoria.nombre,
            "tipo": categoria.tipo,
            "color": categoria.color,
            "icono": categoria.icono,
            "activa": categoria.activa,
            "descripcion": categoria.descripcion,
            "fecha_creacion": categoria.fecha_creacion.isoformat() if categoria.fecha_creacion else None,
            "fecha_actualizacion": categoria.fecha_actualizacion.isoformat() if categoria.fecha_actualizacion else None,
        }
```

---

### Transacciones DB

```python
# ✅ CORRECTO - Manejo de transacciones
from sqlalchemy.exc import IntegrityError

class TransaccionService:
    def crear_con_objetivo(self, transaccion_data: TransaccionCreate, objetivo_id: UUID):
        """
        Crear transacción y automáticamente actualizar objetivo
        """
        try:
            # Iniciar transacción implícita
            transaccion = self.transaccion_repo.create(transaccion_data)
            
            # Actualizar objetivo
            aporte_data = AporteCreate(
                objetivo_id=objetivo_id,
                monto=transaccion['monto'],
                fecha=transaccion['fecha_transaccion'],
                descripcion=f"Aporte desde transacción {transaccion['id']}"
            )
            self.objetivo_repo.add_contribution(aporte_data)
            
            # Commit automático si no hay error
            return transaccion
        except IntegrityError as e:
            # Rollback automático
            raise HTTPException(
                status_code=409,
                detail="Error de integridad de datos"
            )
        except Exception as e:
            # Rollback automático
            raise HTTPException(
                status_code=500,
                detail=f"Error creando transacción: {str(e)}"
            )

# ❌ INCORRECTO - Sin manejo de transacciones
def crear_con_objetivo(self, transaccion_data, objetivo_id):
    transaccion = self.transaccion_repo.create(transaccion_data)
    # Si falla aquí, la transacción queda creada pero el objetivo no se actualiza
    self.objetivo_repo.add_contribution(...)
```

---

## ✅ Checklist

- [ ] Service tiene repository inyectado
- [ ] Validaciones con Pydantic schemas
- [ ] Errores con HTTPException
- [ ] No hay SQL directo en services
- [ ] Transacciones DB manejadas correctamente
- [ ] Métodos privados con `_` prefix
- [ ] Docstrings en métodos públicos
- [ ] Type hints en todos los parámetros

---

## ❌ Anti-Patrones

### 1. Lógica en el Router

```python
# ❌ MAL
@router.post("/")
async def create_category(data: dict, db: Session = Depends(get_db)):
    if data['monto'] <= 0:
        raise HTTPException(400, "Monto inválido")
    categoria = Categoria(**data)
    db.add(categoria)
    db.commit()
    return categoria

# ✅ BIEN
@router.post("/")
async def create_category(
    data: CategoriaCreate,
    service: CategoriaService = Depends()
):
    return service.create(data)
```

### 2. SQL Directo

```python
# ❌ MAL
def get_categories(self):
    result = self.db.execute("SELECT * FROM categorias")
    return result.fetchall()

# ✅ BIEN
def get_categories(self):
    return self.db.query(Categoria).all()
```

### 3. Sin Type Hints

```python
# ❌ MAL
def create(self, data):
    return self.repo.create(data)

# ✅ BIEN
def create(self, data: CategoriaCreate) -> dict:
    return self.repo.create(data)
```

---

**Skill Owner**: Backend Agent  
**Related Skills**: `repository-pattern`, `pydantic-schemas`, `sqlalchemy`  
**Version**: 1.0  
**Last Updated**: 2026-01-24

