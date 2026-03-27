from fastapi import APIRouter, Depends

from app.controllers.prescription_item_controller import PrescriptionItemController
from app.routes.dependencies import get_prescription_item_controller
from app.schemas.prescription_item import PrescriptionItemCreate, PrescriptionItemUpdate

router = APIRouter(prefix="/prescription-items", tags=["prescription-items"])


@router.post("")
async def create_prescription_item(
    request: PrescriptionItemCreate,
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    created = await controller.create_prescription_item(request)
    return {"success": True, "message": "Prescription item created successfully.", "data": created}


@router.get("")
async def list_prescription_items(
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    items = await controller.list_prescription_items()
    return {"success": True, "message": "Prescription items fetched successfully.", "data": items}


@router.get("/{prescriptionItem_id}")
async def get_prescription_item(
    prescriptionItem_id: str,
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    item = await controller.get_prescription_item(prescriptionItem_id)
    return {"success": True, "message": "Prescription item fetched successfully.", "data": item}


@router.put("/{prescriptionItem_id}")
async def update_prescription_item(
    prescriptionItem_id: str,
    request: PrescriptionItemUpdate,
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    updated = await controller.update_prescription_item(prescriptionItem_id, request)
    return {"success": True, "message": "Prescription item updated successfully.", "data": updated}


@router.delete("/{prescriptionItem_id}")
async def delete_prescription_item(
    prescriptionItem_id: str,
    controller: PrescriptionItemController = Depends(get_prescription_item_controller),
) -> dict:
    await controller.delete_prescription_item(prescriptionItem_id)
    return {
        "success": True,
        "message": "Prescription item deleted successfully.",
        "data": {"prescriptionItem_id": prescriptionItem_id},
    }

