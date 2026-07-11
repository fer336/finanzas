"""
Router para Balance Inicial / Balance Neto
"""
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import CurrentUser
from app.repositories.balance_inicial_repository import BalanceInicialRepository
from app.schemas.balance_inicial import (
    BalanceInicialCreate,
    BalanceInicialUpdate,
    BalanceInicialResponse,
    BalanceInicialCopyFromPreviousRequest,
    BalanceInicialBulkCreateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _mes_actual() -> str:
    return datetime.utcnow().strftime("%Y-%m")


@router.get("/neto")
async def get_balance_neto(
    current_user: CurrentUser,
    mes: str = Query(default=None, description="Mes en formato YYYY-MM (default: mes actual)"),
    moneda: str = Query(default="ARS", description="Código de moneda"),
    db: Session = Depends(get_db),
):
    """Balance neto real del mes: dinero que el usuario debería tener."""
    repo = BalanceInicialRepository(db)
    return repo.calcular_balance_neto(
        usuario_id=current_user.id,
        mes=mes or _mes_actual(),
        moneda=moneda.upper(),
    )


@router.get("/", response_model=list[BalanceInicialResponse])
async def get_balances_iniciales(
    current_user: CurrentUser,
    mes: Optional[str] = Query(default=None, description="Filtrar por mes (YYYY-MM)"),
    db: Session = Depends(get_db),
):
    repo = BalanceInicialRepository(db)
    return repo.get_all(usuario_id=current_user.id, mes=mes)


@router.get("/meses-disponibles")
async def get_meses_disponibles(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = BalanceInicialRepository(db)
    return {"meses": repo.get_meses_disponibles(usuario_id=current_user.id)}


@router.put("/", response_model=BalanceInicialResponse)
async def upsert_balance_inicial(
    current_user: CurrentUser,
    data: BalanceInicialCreate,
    db: Session = Depends(get_db),
):
    """Crea o actualiza el balance inicial de un mes/moneda (ancla del balance neto)."""
    repo = BalanceInicialRepository(db)
    return repo.upsert(usuario_id=current_user.id, data=data)


@router.patch("/{balance_id}", response_model=BalanceInicialResponse)
async def update_balance_inicial(
    current_user: CurrentUser,
    balance_id: str,
    data: BalanceInicialUpdate,
    db: Session = Depends(get_db),
):
    try:
        balance_uuid = UUID(balance_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    repo = BalanceInicialRepository(db)
    try:
        return repo.update(balance_id=balance_uuid, usuario_id=current_user.id, data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{balance_id}")
async def delete_balance_inicial(
    current_user: CurrentUser,
    balance_id: str,
    db: Session = Depends(get_db),
):
    try:
        balance_uuid = UUID(balance_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    repo = BalanceInicialRepository(db)
    deleted = repo.delete(balance_id=balance_uuid, usuario_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Balance inicial no encontrado")
    return {"message": "Balance inicial eliminado"}


@router.post("/copy-from-previous")
async def copy_from_previous_month(
    current_user: CurrentUser,
    data: BalanceInicialCopyFromPreviousRequest,
    db: Session = Depends(get_db),
):
    anio, mes_num = (int(p) for p in data.mes_destino.split("-"))
    mes_origen_num = mes_num - 1 or 12
    anio_origen = anio if mes_num > 1 else anio - 1
    mes_origen = f"{anio_origen}-{mes_origen_num:02d}"

    repo = BalanceInicialRepository(db)
    copiados = repo.copy_from_previous_month(
        usuario_id=current_user.id, mes_origen=mes_origen, mes_destino=data.mes_destino
    )
    return {"copiados": copiados}


@router.post("/bulk")
async def bulk_create_balances(
    current_user: CurrentUser,
    data: BalanceInicialBulkCreateRequest,
    db: Session = Depends(get_db),
):
    repo = BalanceInicialRepository(db)
    creados = repo.bulk_create(usuario_id=current_user.id, mes=data.mes, balances_data=data.balances)
    return {"creados": creados}
