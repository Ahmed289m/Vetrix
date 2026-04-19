from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class DrugRepository(BaseMongoRepository):
    """
    Repository for Drug documents. Supports clinic_id filtering for multi-tenancy.
    """
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="drugs", id_field="drug_id")

    async def list_by_drug_ids(self, drug_ids: list[str]) -> list[dict]:
        """List drugs by drug_id values."""
        if not drug_ids:
            return []
        return await self.collection.find({"$or": [{"_id": {"$in": drug_ids}}, {"drug_id": {"$in": drug_ids}}]}).to_list(length=None)

