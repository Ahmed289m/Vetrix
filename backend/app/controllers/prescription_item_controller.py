from app.core.permission_checker import TokenData
from app.schemas.prescription_item import PrescriptionItemCreate, PrescriptionItemUpdate
from app.services.prescription_item_service import PrescriptionItemService


class PrescriptionItemController:
    def __init__(self, service: PrescriptionItemService) -> None:
        self.service = service

    async def create_prescription_item(self, request: PrescriptionItemCreate, current_user: TokenData) -> dict:
        return await self.service.create_prescription_item(request, current_user)

    async def list_prescription_items(self, current_user: TokenData) -> list[dict]:
        return await self.service.list_prescription_items(current_user)

    async def get_prescription_item(self, prescriptionItem_id: str, current_user: TokenData) -> dict:
        return await self.service.get_prescription_item(prescriptionItem_id, current_user)

    async def update_prescription_item(self, prescriptionItem_id: str, request: PrescriptionItemUpdate, current_user: TokenData) -> dict:
        return await self.service.update_prescription_item(prescriptionItem_id, request, current_user)

    async def delete_prescription_item(self, prescriptionItem_id: str, current_user: TokenData) -> None:
        await self.service.delete_prescription_item(prescriptionItem_id, current_user)

