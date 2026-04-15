from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class PetRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="pets", id_field="pet_id")

    async def list_by_clinic(self, clinic_id: str) -> list[dict]:
        """List all pets in a specific clinic."""
        return await self.collection.find({"clinic_id": clinic_id}).to_list(length=None)

    async def list_by_owner(self, owner_id: str, clinic_id: str | None = None) -> list[dict]:
        """List all pets owned by a specific user.

        Uses $or over owner_id and client_id for backward compatibility:
        - Pets created after the fix have owner_id set.
        - Older pets may only have client_id set.
        Optionally scoped to a clinic.
        """
        query: dict = {
            "$or": [
                {"owner_id": owner_id},
                {"client_id": owner_id},
            ]
        }
        if clinic_id:
            query["clinic_id"] = clinic_id
        return await self.collection.find(query).to_list(length=None)

