from app.schemas.clinic import ClinicCreate, ClinicUpdate
from app.services.clinic_service import ClinicService


class ClinicController:
    def __init__(self, clinic_service: ClinicService) -> None:
        self.clinic_service = clinic_service

    async def create_clinic(self, request: ClinicCreate) -> dict:
        return await self.clinic_service.create_clinic(request)

    async def list_clinics(self) -> list[dict]:
        return await self.clinic_service.list_clinics()

    async def get_clinic(self, clinic_id: str) -> dict:
        return await self.clinic_service.get_clinic(clinic_id)

    async def update_clinic(self, clinic_id: str, request: ClinicUpdate) -> dict:
        return await self.clinic_service.update_clinic(clinic_id, request)

    async def delete_clinic(self, clinic_id: str) -> None:
        await self.clinic_service.delete_clinic(clinic_id)
