from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class PrescriptionItemRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="prescription_items", id_field="prescriptionItem_id")

    async def list_by_clinic(self, clinic_id: str) -> list[dict]:
        """List all prescription items in a specific clinic."""
        return await self.collection.find({"clinic_id": clinic_id}).to_list(length=None)

    async def list_by_ids(self, item_ids: list[str]) -> list[dict]:
        """List prescription items by their business ids."""
        if not item_ids:
            return []
        return await self.collection.find({"$or": [{"_id": {"$in": item_ids}}, {"prescriptionItem_id": {"$in": item_ids}}]}).to_list(length=None)

