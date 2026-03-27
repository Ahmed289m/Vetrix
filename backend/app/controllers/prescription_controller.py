from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate
from app.services.prescription_service import PrescriptionService


class PrescriptionController:
    def __init__(self, service: PrescriptionService) -> None:
        self.service = service

    async def create_prescription(self, request: PrescriptionCreate) -> dict:
        return await self.service.create_prescription(request)

    async def list_prescriptions(self) -> list[dict]:
        return await self.service.list_prescriptions()

    async def get_prescription(self, prescription_id: str) -> dict:
        return await self.service.get_prescription(prescription_id)

    async def update_prescription(self, prescription_id: str, request: PrescriptionUpdate) -> dict:
        return await self.service.update_prescription(prescription_id, request)

    async def delete_prescription(self, prescription_id: str) -> None:
        await self.service.delete_prescription(prescription_id)

