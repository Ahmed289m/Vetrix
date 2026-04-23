from fastapi import APIRouter, Depends

from app.controllers.drug_controller import DrugController
from app.core.permission_checker import TokenData, require_permission
from app.core.permissions import Permissions
from app.routes.dependencies import get_drug_controller
from app.schemas.drug import DrugCreate, DrugUpdate

router = APIRouter(prefix="/drugs", tags=["drugs"])


@router.post("")
async def create_drug(
    request: DrugCreate,
    current_user: TokenData = Depends(require_permission(Permissions.DRUGS_CREATE)),
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    """
    Create a new drug (ADMIN/OWNER/DOCTOR only).
    
    - ADMIN/OWNER/DOCTOR can create drugs
    """
    created = await controller.create_drug(request, current_user)
    return {"success": True, "message": "Drug created successfully.", "data": created}


@router.get("")
async def list_drugs(
    current_user: TokenData = Depends(require_permission(Permissions.DRUGS_READ)),
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    """
    List drugs (authorized users only).
    
    - ADMIN/OWNER/DOCTOR/STAFF/CLIENT can list drugs
    """
    drugs = await controller.list_drugs(current_user)
    return {"success": True, "message": "Drugs fetched successfully.", "data": drugs}


@router.get("/{drug_id}")
async def get_drug(
    drug_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.DRUGS_READ)),
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    """
    Get a specific drug.
    
    - ADMIN/OWNER/DOCTOR/STAFF/CLIENT can get drugs they are authorized to view
    """
    drug = await controller.get_drug(drug_id, current_user)
    return {"success": True, "message": "Drug fetched successfully.", "data": drug}


@router.put("/{drug_id}")
async def update_drug(
    drug_id: str,
    request: DrugUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.DRUGS_UPDATE)),
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    """
    Update a drug (ADMIN/OWNER/DOCTOR only).
    
    - ADMIN/OWNER/DOCTOR can update drugs
    """
    updated = await controller.update_drug(drug_id, request, current_user)
    return {"success": True, "message": "Drug updated successfully.", "data": updated}


@router.delete("/{drug_id}")
async def delete_drug(
    drug_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.DRUGS_DELETE)),
    controller: DrugController = Depends(get_drug_controller),
) -> dict:
    """
    Delete a drug (ADMIN/OWNER/DOCTOR only).
    
    - ADMIN/OWNER/DOCTOR can delete drugs
    """
    await controller.delete_drug(drug_id, current_user)
    return {"success": True, "message": "Drug deleted successfully.", "data": {"drug_id": drug_id}}

