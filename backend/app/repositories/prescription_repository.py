from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class PrescriptionRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="prescriptions", id_field="prescription_id")

    async def list_by_clinic(self, clinic_id: str) -> list[dict]:
        """List all prescriptions in a specific clinic."""
        return await self.collection.find({"clinic_id": clinic_id}).to_list(length=None)

    async def list_by_client(self, client_id: str, clinic_id: str) -> list[dict]:
        """List all prescriptions for a specific client in a clinic."""
        return await self.collection.find({"client_id": client_id, "clinic_id": clinic_id}).to_list(length=None)

    async def list_by_client_only(self, client_id: str) -> list[dict]:
        """List all prescriptions for a client (no clinic scope — used for CLIENT role)."""
        return await self.collection.find({"client_id": client_id}).to_list(length=None)

