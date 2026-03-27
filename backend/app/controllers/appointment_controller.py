from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.services.appointment_service import AppointmentService


class AppointmentController:
    def __init__(self, service: AppointmentService) -> None:
        self.service = service

    async def create_appointment(self, request: AppointmentCreate) -> dict:
        return await self.service.create_appointment(request)

    async def update_appointment(self, appointment_id: str, request: AppointmentUpdate) -> dict:
        return await self.service.update_appointment(appointment_id, request)

    async def delete_appointment(self, appointment_id: str) -> None:
        await self.service.delete_appointment(appointment_id)

