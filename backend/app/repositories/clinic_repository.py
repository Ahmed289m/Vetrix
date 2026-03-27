from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class ClinicRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["clinics"]

    async def create_clinic(self, payload: dict) -> dict:
        document = {"_id": payload["clinic_id"], **payload}
        await self.collection.insert_one(document)
        return document

    async def get_by_clinic_id(self, clinic_id: str) -> dict | None:
        return await self.collection.find_one({"$or": [{"_id": clinic_id}, {"clinic_id": clinic_id}]})

    async def get_by_name(self, clinic_name: str) -> dict | None:
        return await self.collection.find_one({"clinicName": clinic_name})

    async def list_clinics(self) -> list[dict]:
        return await self.collection.find().to_list(length=None)

    async def update_clinic(self, clinic_id: str, payload: dict) -> dict | None:
        return await self.collection.find_one_and_update(
            {"$or": [{"_id": clinic_id}, {"clinic_id": clinic_id}]},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )

    async def delete_clinic(self, clinic_id: str) -> bool:
        result = await self.collection.delete_one({"$or": [{"_id": clinic_id}, {"clinic_id": clinic_id}]})
        return result.deleted_count > 0
