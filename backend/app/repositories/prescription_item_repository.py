from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class PrescriptionItemRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="prescription_items", id_field="prescriptionItem_id")

    async def list_by_clinic(self, clinic_id: str) -> list[dict]:
        """List all prescription items in a specific clinic."""
        return await self.collection.find({"clinic_id": clinic_id}).to_list(length=None)

