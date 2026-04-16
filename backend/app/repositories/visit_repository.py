from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class VisitRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="visits", id_field="visit_id")

    async def list_by_clinic(self, clinic_id: str) -> list[dict]:
        """List all visits in a specific clinic."""
        return await self.collection.find({"clinic_id": clinic_id}).sort("date", -1).to_list(length=None)

    async def list_by_owner(self, owner_id: str, clinic_id: str) -> list[dict]:
        """List all visits for a specific client (owner) in a clinic."""
        return await self.collection.find({"client_id": owner_id, "clinic_id": clinic_id}).sort("date", -1).to_list(length=None)

