from fastapi import APIRouter, Depends

from app.controllers.clinic_controller import ClinicController
from app.core.permission_checker import TokenData, require_admin, require_permission, require_clinic_isolation
from app.core.permissions import Permissions
from app.routes.dependencies import get_clinic_controller
from app.schemas.clinic import ClinicCreate, ClinicUpdate

router = APIRouter(prefix="/clinics", tags=["clinics"])


@router.post("")
async def create_clinic(
    request: ClinicCreate,
    current_user: TokenData = Depends(require_admin()),
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    """
    Create a new clinic (ADMIN only).
    
    Only global admins can create clinics. A clinic is linked to an owner.
    """
    created = await controller.create_clinic(request)
    return {
        "success": True,
        "message": "Clinic created successfully.",
        "data": created,
    }


@router.get("")
async def list_clinics(
    current_user: TokenData = Depends(require_permission(Permissions.CLINICS_READ)),
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    """
    List clinics (authorized users only).
    
    - ADMIN sees all clinics
    - OWNER sees only their clinic
    - Others cannot list clinics
    """
    clinics = await controller.list_clinics(current_user)
    return {
        "success": True,
        "message": "Clinics fetched successfully.",
        "data": clinics,
    }


@router.get("/{clinic_id}")
async def get_clinic(
    clinic_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.CLINICS_READ)),
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    """
    Get a specific clinic.
    
    - ADMIN can access any clinic
    - OWNER can only access their own clinic
    """
    clinic = await controller.get_clinic(clinic_id)
    # Verify clinic_id matches current user's clinic (if not admin)
    await require_clinic_isolation(clinic["clinic_id"]).__call__(current_user)
    return {
        "success": True,
        "message": "Clinic fetched successfully.",
        "data": clinic,
    }


@router.put("/{clinic_id}")
async def update_clinic(
    clinic_id: str,
    request: ClinicUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.CLINICS_UPDATE)),
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    """
    Update a clinic (OWNER or ADMIN only).
    
    - ADMIN can update any clinic
    - OWNER can only update their own clinic
    """
    # Get clinic to verify ownership
    clinic = await controller.get_clinic(clinic_id)
    await require_clinic_isolation(clinic["clinic_id"]).__call__(current_user)
    
    clinic = await controller.update_clinic(clinic_id, request)
    return {
        "success": True,
        "message": "Clinic updated successfully.",
        "data": clinic,
    }


@router.delete("/{clinic_id}")
async def delete_clinic(
    clinic_id: str,
    current_user: TokenData = Depends(require_admin()),
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    """
    Delete a clinic (ADMIN only).
    
    Only global admins can delete clinics.
    """
    await controller.delete_clinic(clinic_id)
    return {
        "success": True,
        "message": "Clinic deleted successfully.",
        "data": {"clinic_id": clinic_id},
    }
