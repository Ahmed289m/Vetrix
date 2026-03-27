from app.models.prescription_item import PrescriptionItem
from app.repositories.prescription_item_repository import PrescriptionItemRepository
from app.schemas.prescription_item import PrescriptionItemCreate, PrescriptionItemUpdate
from app.services.base_crud_service import BaseCrudService


class PrescriptionItemService:
    def __init__(self, repository: PrescriptionItemRepository) -> None:
        self.crud = BaseCrudService(
            repository,
            PrescriptionItem,
            id_field="prescriptionItem_id",
            id_prefix="prescriptionItem",
        )

    async def create_prescription_item(self, request: PrescriptionItemCreate) -> dict:
        return await self.crud.create(request)

    async def list_prescription_items(self) -> list[dict]:
        return await self.crud.list()

    async def get_prescription_item(self, prescriptionItem_id: str) -> dict:
        return await self.crud.get(prescriptionItem_id)

    async def update_prescription_item(self, prescriptionItem_id: str, request: PrescriptionItemUpdate) -> dict:
        return await self.crud.update(prescriptionItem_id, request)

    async def delete_prescription_item(self, prescriptionItem_id: str) -> None:
        await self.crud.delete(prescriptionItem_id)

