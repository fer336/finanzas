# Backend Agent - Ruleset

> **Dominio**: Lógica de Negocio, Servicios, Repositorios, Validaciones

---

## ⚠️ CONTEXTO CRÍTICO

Este agente **SOLO** debe trabajar en:
- ✅ Servicios (`backend/app/services/`)
- ✅ Repositorios (`backend/app/repositories/`)
- ✅ Utilidades del servidor (`backend/app/utils/`)
- ✅ Lógica de negocio
- ✅ Validaciones con Pydantic

Este agente **NUNCA** debe:
- ❌ Crear componentes React
- ❌ Modificar estilos CSS/Tailwind
- ❌ Definir endpoints (eso es del API Agent)
- ❌ Crear migraciones SQL (eso es del Database Agent)

---

## 📋 Skills Requeridos

**SIEMPRE lee estos skills ANTES de trabajar:**

| Skill | Cuándo Usarlo |
|-------|---------------|
| [`backend-fastapi`](../../skills/backend-fastapi.md) | Cualquier tarea del backend |
| [`repository-pattern`](../../skills/repository-pattern.md) | Crear/modificar repositorios |
| [`pydantic-schemas`](../../skills/pydantic-schemas.md) | Validar datos |
| [`error-handling`](../../skills/error-handling.md) | Manejar errores |

---

## 🚨 REGLAS NO NEGOCIABLES

### 1. Repository Pattern Obligatorio

```python
# ✅ CORRECTO - Separación de capas
# services/transaccion_service.py
class TransaccionService:
    def __init__(self, repo: TransaccionRepository):
        self.repo = repo
    
    def crear_transaccion(self, data: TransaccionCreate):
        # Lógica de negocio aquí
        if data.monto < 0:
            raise ValueError("Monto debe ser positivo")
        return self.repo.create(data)

# ❌ INCORRECTO - Lógica en el router
@router.post("/")
async def create_transaction(data: dict, db: Session = Depends(get_db)):
    # NO mezclar lógica de negocio en el router
    transaccion = Transaccion(**data)
    db.add(transaccion)
    db.commit()
```

### 2. Validación con Pydantic

```python
# ✅ CORRECTO
from pydantic import BaseModel, validator

class TransaccionCreate(BaseModel):
    monto: Decimal
    tipo: str
    
    @validator('tipo')
    def validate_tipo(cls, v):
        if v not in ['ingreso', 'gasto']:
            raise ValueError('Tipo inválido')
        return v

# ❌ INCORRECTO - Validación manual
def create_transaction(data: dict):
    if 'monto' not in data:  # NO hacer esto
        raise Error("Monto requerido")
```

### 3. Manejo de Errores Consistente

```python
# ✅ CORRECTO
from fastapi import HTTPException

def get_transaction(id: UUID):
    transaction = self.repo.get_by_id(id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return transaction

# ❌ INCORRECTO
def get_transaction(id: UUID):
    transaction = self.repo.get_by_id(id)
    return transaction or {}  # NO retornar dict vacío
```

---

## 📐 PATRONES OBLIGATORIOS

### Servicio con Repository

```python
# services/categoria_service.py
from app.repositories.categoria_repository import CategoriaRepository
from app.models.schemas import CategoriaCreate, CategoriaUpdate

class CategoriaService:
    def __init__(self, repo: CategoriaRepository):
        self.repo = repo
    
    def crear_categoria(self, data: CategoriaCreate) -> dict:
        """
        Lógica de negocio para crear categoría
        """
        # Validación de negocio
        if self.repo.exists_by_name(data.nombre):
            raise ValueError("Categoría ya existe")
        
        # Crear
        return self.repo.create(data)
    
    def actualizar_categoria(self, id: UUID, data: CategoriaUpdate) -> dict:
        """
        Lógica de negocio para actualizar
        """
        categoria = self.repo.get_by_id(id)
        if not categoria:
            raise HTTPException(status_code=404, detail="No encontrada")
        
        return self.repo.update(id, data)
```

### Repository Pattern

```python
# repositories/categoria_repository.py
from sqlalchemy.orm import Session
from app.models.db_models import Categoria

class CategoriaRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, data: CategoriaCreate) -> dict:
        categoria = Categoria(**data.dict())
        self.db.add(categoria)
        self.db.commit()
        self.db.refresh(categoria)
        return self._to_dict(categoria)
    
    def get_by_id(self, id: UUID) -> dict:
        categoria = self.db.query(Categoria).filter(Categoria.id == id).first()
        return self._to_dict(categoria) if categoria else None
    
    def exists_by_name(self, nombre: str) -> bool:
        return self.db.query(Categoria).filter(Categoria.nombre == nombre).first() is not None
    
    def _to_dict(self, categoria: Categoria) -> dict:
        return {
            "id": str(categoria.id),
            "nombre": categoria.nombre,
            # ...
        }
```

---

## ✅ Checklist Pre-Commit

- [ ] Servicio tiene repositorio inyectado
- [ ] Validaciones con Pydantic
- [ ] Errores con HTTPException
- [ ] No hay SQL directo en servicios
- [ ] No hay lógica en routers
- [ ] Transacciones DB correctamente manejadas
- [ ] Tests unitarios para servicios

---

## 📁 Scope del Backend Agent

```
backend/
├── app/
│   ├── services/           # ✅ TU DOMINIO
│   ├── repositories/       # ✅ TU DOMINIO
│   ├── utils/              # ✅ TU DOMINIO
│   ├── models/schemas.py   # ✅ Pydantic schemas
│   ├── routers/            # ❌ API Agent domain
│   └── models/db_models.py # ❌ Database Agent domain
```

---

## 🔗 Comunicación con Otros Agentes

### Con Database Agent

```python
# ✅ Backend Agent usa el modelo
from app.models.db_models import Transaccion

# ❌ Backend Agent NO crea la tabla
# CREATE TABLE transacciones... # ESO ES DEL DATABASE AGENT
```

### Con API Agent

```python
# ✅ Backend Agent provee el servicio
# services/transaccion_service.py
class TransaccionService:
    def get_balance(self): ...

# ✅ API Agent lo usa en el router
# routers/transacciones.py
@router.get("/balance")
def get_balance(service: TransaccionService = Depends()):
    return service.get_balance()
```

---

**Última Actualización**: 2026-01-24  
**Agente**: Backend Agent  
**Skills**: backend-fastapi, repository-pattern, pydantic-schemas, error-handling

