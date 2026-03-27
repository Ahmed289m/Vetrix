from fastapi import APIRouter, Depends

from app.controllers.appointment_controller import AppointmentController
from app.core.permission_checker import TokenData, require_permission, require_clinic_id
from app.core.permissions import Permissions
from app.routes.dependencies import get_appointment_controller
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("")
async def create_appointment(
    request: AppointmentCreate,
    current_user: TokenData = Depends(require_permission(Permissions.APPOINTMENTS_CREATE)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: AppointmentController = Depends(get_appointment_controller),
) -> dict:
    """
    Create a new appointment (authorized users only).
    
    - STAFF/OWNER can create appointments in their clinic
    - CLIENT can create appointments (automatically linked to themselves)
    """
    created = await controller.create_appointment(request, current_user)
    return {"success": True, "message": "Appointment created successfully.", "data": created}


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    request: AppointmentUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.APPOINTMENTS_UPDATE)),
    controller: AppointmentController = Depends(get_appointment_controller),
) -> dict:
    """
    Update an appointment (authorized users only).
    
    - ADMIN can update any appointment
    - STAFF/OWNER can update appointments in their clinic
    - CLIENT can update only their appointments
    """
    updated = await controller.update_appointment(appointment_id, request, current_user)
    return {"success": True, "message": "Appointment confirmed successfully.", "data": updated}


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.APPOINTMENTS_DELETE)),
    controller: AppointmentController = Depends(get_appointment_controller),
) -> dict:
    """
    Delete an appointment (authorized users only).
    
    - ADMIN can delete any appointment
    - STAFF/OWNER can delete appointments in their clinic
    - CLIENT can delete only their appointments
    """
    await controller.delete_appointment(appointment_id, current_user)
    return {"success": True, "message": "Appointment deleted successfully.", "data": {"appointment_id": appointment_id}}

