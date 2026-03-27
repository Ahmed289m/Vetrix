from app.core.permission_checker import TokenData
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.services.appointment_service import AppointmentService


class AppointmentController:
    def __init__(self, service: AppointmentService) -> None:
        self.service = service

    async def create_appointment(self, request: AppointmentCreate, current_user: TokenData) -> dict:
        return await self.service.create_appointment(request, current_user)

    async def update_appointment(self, appointment_id: str, request: AppointmentUpdate, current_user: TokenData) -> dict:
        return await self.service.update_appointment(appointment_id, request, current_user)

    async def delete_appointment(self, appointment_id: str, current_user: TokenData) -> None:
        await self.service.delete_appointment(appointment_id, current_user)

