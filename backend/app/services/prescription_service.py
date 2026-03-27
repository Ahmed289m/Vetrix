from app.models.prescription import Prescription
from app.repositories.prescription_repository import PrescriptionRepository
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate
from app.services.base_crud_service import BaseCrudService


class PrescriptionService:
    def __init__(self, repository: PrescriptionRepository) -> None:
        self.crud = BaseCrudService(
            repository,
            Prescription,
            id_field="prescription_id",
            id_prefix="prescription",
        )

    async def create_prescription(self, request: PrescriptionCreate) -> dict:
        return await self.crud.create(request)

    async def list_prescriptions(self) -> list[dict]:
        return await self.crud.list()

    async def get_prescription(self, prescription_id: str) -> dict:
        return await self.crud.get(prescription_id)

    async def update_prescription(self, prescription_id: str, request: PrescriptionUpdate) -> dict:
        return await self.crud.update(prescription_id, request)

    async def delete_prescription(self, prescription_id: str) -> None:
        await self.crud.delete(prescription_id)

