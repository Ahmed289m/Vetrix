from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class BaseMongoRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str, id_field: str) -> None:
        self.collection = db[collection_name]
        self.id_field = id_field

    async def create(self, payload: dict) -> dict:
        document = {"_id": payload[self.id_field], **payload}
        await self.collection.insert_one(document)
        return document

    async def get_by_id(self, entity_id: str) -> dict | None:
        return await self.collection.find_one(
            {"$or": [{"_id": entity_id}, {self.id_field: entity_id}]}
        )

    async def list(self) -> list[dict]:
        return await self.collection.find().to_list(length=None)

    async def update_by_id(self, entity_id: str, payload: dict) -> dict | None:
        return await self.collection.find_one_and_update(
            {"$or": [{"_id": entity_id}, {self.id_field: entity_id}]},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )

    async def delete_by_id(self, entity_id: str) -> bool:
        result = await self.collection.delete_one(
            {"$or": [{"_id": entity_id}, {self.id_field: entity_id}]}
        )
        return result.deleted_count > 0

