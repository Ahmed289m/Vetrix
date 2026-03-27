from fastapi import APIRouter, Depends

from app.controllers.drug_controller import DrugController
from app.routes.dependencies import get_drug_controller
from app.schemas.drug import DrugCreate, DrugUpdate

router = APIRouter(prefix="/drugs", tags=["drugs"])


@router.post("")
async def create_drug(
    request: DrugCreate,
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    created = await controller.create_drug(request)
    return {"success": True, "message": "Drug created successfully.", "data": created}


@router.get("")
async def list_drugs(
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    drugs = await controller.list_drugs()
    return {"success": True, "message": "Drugs fetched successfully.", "data": drugs}


@router.get("/{drug_id}")
async def get_drug(
    drug_id: str,
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    drug = await controller.get_drug(drug_id)
    return {"success": True, "message": "Drug fetched successfully.", "data": drug}


@router.put("/{drug_id}")
async def update_drug(
    drug_id: str,
    request: DrugUpdate,
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    updated = await controller.update_drug(drug_id, request)
    return {"success": True, "message": "Drug updated successfully.", "data": updated}


@router.delete("/{drug_id}")
async def delete_drug(
    drug_id: str,
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    await controller.delete_drug(drug_id)
    return {"success": True, "message": "Drug deleted successfully.", "data": {"drug_id": drug_id}}

