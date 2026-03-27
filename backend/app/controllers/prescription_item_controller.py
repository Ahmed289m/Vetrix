from app.schemas.prescription_item import PrescriptionItemCreate, PrescriptionItemUpdate
from app.services.prescription_item_service import PrescriptionItemService


class PrescriptionItemController:
    def __init__(self, service: PrescriptionItemService) -> None:
        self.service = service

    async def create_prescription_item(self, request: PrescriptionItemCreate) -> dict:
        return await self.service.create_prescription_item(request)

    async def list_prescription_items(self) -> list[dict]:
        return await self.service.list_prescription_items()

    async def get_prescription_item(self, prescriptionItem_id: str) -> dict:
        return await self.service.get_prescription_item(prescriptionItem_id)

    async def update_prescription_item(self, prescriptionItem_id: str, request: PrescriptionItemUpdate) -> dict:
        return await self.service.update_prescription_item(prescriptionItem_id, request)

    async def delete_prescription_item(self, prescriptionItem_id: str) -> None:
        await self.service.delete_prescription_item(prescriptionItem_id)

