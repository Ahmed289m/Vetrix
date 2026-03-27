from fastapi import APIRouter, Depends

from app.controllers.prescription_controller import PrescriptionController
from app.routes.dependencies import get_prescription_controller
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("")
async def create_prescription(
    request: PrescriptionCreate,
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    created = await controller.create_prescription(request)
    return {"success": True, "message": "Prescription created successfully.", "data": created}


@router.get("")
async def list_prescriptions(
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    prescriptions = await controller.list_prescriptions()
    return {"success": True, "message": "Prescriptions fetched successfully.", "data": prescriptions}


@router.get("/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    prescription = await controller.get_prescription(prescription_id)
    return {"success": True, "message": "Prescription fetched successfully.", "data": prescription}


@router.put("/{prescription_id}")
async def update_prescription(
    prescription_id: str,
    request: PrescriptionUpdate,
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    updated = await controller.update_prescription(prescription_id, request)
    return {"success": True, "message": "Prescription updated successfully.", "data": updated}


@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str,
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    await controller.delete_prescription(prescription_id)
    return {
        "success": True,
        "message": "Prescription deleted successfully.",
        "data": {"prescription_id": prescription_id},
    }

