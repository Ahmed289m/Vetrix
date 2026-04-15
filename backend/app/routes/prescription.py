from fastapi import APIRouter, Depends

from app.controllers.prescription_controller import PrescriptionController
from app.core.permission_checker import TokenData, require_permission, require_clinic_id
from app.core.permissions import Permissions
from app.routes.dependencies import get_prescription_controller
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("")
async def create_prescription(
    request: PrescriptionCreate,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTIONS_CREATE)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    """
    Create a new prescription (DOCTOR only).
    
    - DOCTOR can create prescriptions in their clinic
    """
    created = await controller.create_prescription(request, current_user)
    return {"success": True, "message": "Prescription created successfully.", "data": created}


@router.get("")
async def list_prescriptions(
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTIONS_READ)),
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    """
    List prescriptions (authorized users only).

    - ADMIN sees all prescriptions
    - DOCTOR/STAFF see prescriptions in their clinic
    - CLIENT sees only their prescriptions
    """
    prescriptions = await controller.list_prescriptions(current_user)
    return {"success": True, "message": "Prescriptions fetched successfully.", "data": prescriptions}


@router.get("/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTIONS_READ)),
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    """
    Get a specific prescription.
    
    - ADMIN can read any prescription
    - DOCTOR/STAFF can read prescriptions in their clinic
    - CLIENT can read only their prescriptions
    """
    prescription = await controller.get_prescription(prescription_id, current_user)
    return {"success": True, "message": "Prescription fetched successfully.", "data": prescription}


@router.put("/{prescription_id}")
async def update_prescription(
    prescription_id: str,
    request: PrescriptionUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTIONS_UPDATE)),
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    """
    Update a prescription (DOCTOR only).
    
    - ADMIN can update any prescription
    - DOCTOR can update prescriptions in their clinic
    """
    updated = await controller.update_prescription(prescription_id, request, current_user)
    return {"success": True, "message": "Prescription updated successfully.", "data": updated}


@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.PRESCRIPTIONS_DELETE)),
    controller: PrescriptionController = Depends(get_prescription_controller),
) -> dict:
    """
    Delete a prescription (DOCTOR only).
    
    - ADMIN can delete any prescription
    - DOCTOR can delete prescriptions in their clinic
    """
    await controller.delete_prescription(prescription_id, current_user)
    return {
        "success": True,
        "message": "Prescription deleted successfully.",
        "data": {"prescription_id": prescription_id},
    }

