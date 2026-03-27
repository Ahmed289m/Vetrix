from app.core.permission_checker import TokenData
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate
from app.services.prescription_service import PrescriptionService


class PrescriptionController:
    def __init__(self, service: PrescriptionService) -> None:
        self.service = service

    async def create_prescription(self, request: PrescriptionCreate, current_user: TokenData) -> dict:
        return await self.service.create_prescription(request, current_user)

    async def list_prescriptions(self, current_user: TokenData) -> list[dict]:
        return await self.service.list_prescriptions(current_user)

    async def get_prescription(self, prescription_id: str, current_user: TokenData) -> dict:
        return await self.service.get_prescription(prescription_id, current_user)

    async def update_prescription(self, prescription_id: str, request: PrescriptionUpdate, current_user: TokenData) -> dict:
        return await self.service.update_prescription(prescription_id, request, current_user)

    async def delete_prescription(self, prescription_id: str, current_user: TokenData) -> None:
        await self.service.delete_prescription(prescription_id, current_user)

