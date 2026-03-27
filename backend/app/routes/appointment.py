from fastapi import APIRouter, Depends

from app.controllers.appointment_controller import AppointmentController
from app.routes.dependencies import get_appointment_controller
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("")
async def create_appointment(
    request: AppointmentCreate,
    controller: AppointmentController = Depends(get_appointment_controller),
) -> dict:
    created = await controller.create_appointment(request)
    return {"success": True, "message": "Appointment created successfully.", "data": created}


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    request: AppointmentUpdate,
    controller: AppointmentController = Depends(get_appointment_controller),
) -> dict:
    updated = await controller.update_appointment(appointment_id, request)
    return {"success": True, "message": "Appointment confirmed successfully.", "data": updated}


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    controller: AppointmentController = Depends(get_appointment_controller),
) -> dict:
    await controller.delete_appointment(appointment_id)
    return {"success": True, "message": "Appointment deleted successfully.", "data": {"appointment_id": appointment_id}}

