from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["users"]

    async def create_user(self, payload: dict) -> dict:
        document = {"_id": payload["user_id"], **payload}
        await self.collection.insert_one(document)
        return document

    async def get_by_email(self, email: str) -> dict | None:
        return await self.collection.find_one({"email": email})

    async def get_by_user_id(self, user_id: str) -> dict | None:
        return await self.collection.find_one({"$or": [{"_id": user_id}, {"user_id": user_id}]})

    async def list_users(self) -> list[dict]:
        return await self.collection.find().to_list(length=None)

    async def update_user(self, user_id: str, payload: dict) -> dict | None:
        return await self.collection.find_one_and_update(
            {"$or": [{"_id": user_id}, {"user_id": user_id}]},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )

    async def delete_user(self, user_id: str) -> bool:
        result = await self.collection.delete_one({"$or": [{"_id": user_id}, {"user_id": user_id}]})
        return result.deleted_count > 0
