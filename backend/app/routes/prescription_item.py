from fastapi import APIRouter, Depends

from app.controllers.prescription_item_controller import PrescriptionItemController
from app.core.permission_checker import TokenData, require_permission, require_clinic_id
from app.core.permissions import Permissions
from app.routes.dependencies import get_prescription_item_controller
from app.schemas.prescription_item import PrescriptionItemCreate, PrescriptionItemUpdate

router = APIRouter(prefix="/prescription-items", tags=["prescription-items"])


@router.post("")
async def create_prescription_item(
    request: PrescriptionItemCreate,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTION_ITEMS_CREATE)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    """
    Create a new prescription item (DOCTOR only).
    
    - DOCTOR can create prescription items in their clinic
    """
    created = await controller.create_prescription_item(request, current_user)
    return {"success": True, "message": "Prescription item created successfully.", "data": created}


@router.get("")
async def list_prescription_items(
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTION_ITEMS_READ)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    """
    List prescription items (authorized users only).
    
    - ADMIN sees all items
    - DOCTOR/STAFF see items in their clinic
    - CLIENT sees only items related to their prescriptions
    """
    items = await controller.list_prescription_items(current_user)
    return {"success": True, "message": "Prescription items fetched successfully.", "data": items}


@router.get("/{prescriptionItem_id}")
async def get_prescription_item(
    prescriptionItem_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTION_ITEMS_READ)),
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    """
    Get a specific prescription item.
    
    - ADMIN can get any item
    - DOCTOR/STAFF can get items in their clinic
    - CLIENT can get items related to their prescriptions
    """
    item = await controller.get_prescription_item(prescriptionItem_id, current_user)
    return {"success": True, "message": "Prescription item fetched successfully.", "data": item}


@router.put("/{prescriptionItem_id}")
async def update_prescription_item(
    prescriptionItem_id: str,
    request: PrescriptionItemUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTION_ITEMS_UPDATE)),
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    """
    Update a prescription item (DOCTOR only).
    
    - ADMIN can update any item
    - DOCTOR can update items in their clinic
    """
    updated = await controller.update_prescription_item(prescriptionItem_id, request, current_user)
    return {"success": True, "message": "Prescription item updated successfully.", "data": updated}


@router.delete("/{prescriptionItem_id}")
async def delete_prescription_item(
    prescriptionItem_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTION_ITEMS_DELETE)),
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    """
    Delete a prescription item (DOCTOR only).
    
    - ADMIN can delete any item
    - DOCTOR can delete items in their clinic
    """
    await controller.delete_prescription_item(prescriptionItem_id, current_user)
    return {
        "success": True,
        "message": "Prescription item deleted successfully.",
        "data": {"prescriptionItem_id": prescriptionItem_id},
    }

