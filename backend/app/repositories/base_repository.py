from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class BaseMongoRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str, id_field: str) -> None:
        self.collection = db[collection_name]
        self.id_field = id_field

    def _apply_clinic_filter(self, query: dict, clinic_id: str | None = None, is_superuser: bool = False) -> dict:
        """
        Apply clinic_id filter to query for multi-tenancy.
        
        Args:
            query: Base query dict
            clinic_id: Clinic ID to filter by (None for global admin)
            is_superuser: If True, don't apply clinic filter
            
        Returns:
            Modified query with clinic filter applied
        """
        # Global admin doesn't need clinic filtering
        if is_superuser:
            return query
        
        # Apply clinic_id filter if provided
        if clinic_id:
            query["clinic_id"] = clinic_id
        
        return query

    async def create(self, payload: dict) -> dict:
        document = {"_id": payload[self.id_field], **payload}
        await self.collection.insert_one(document)
        return document

    async def get_by_id(
        self, entity_id: str, clinic_id: str | None = None, is_superuser: bool = False
    ) -> dict | None:
        query = {"$or": [{"_id": entity_id}, {self.id_field: entity_id}]}
        query = self._apply_clinic_filter(query, clinic_id, is_superuser)
        return await self.collection.find_one(query)

    async def list(self, clinic_id: str | None = None, is_superuser: bool = False) -> list[dict]:
        query = {}
        query = self._apply_clinic_filter(query, clinic_id, is_superuser)
        return await self.collection.find(query).to_list(length=None)

    async def update_by_id(
        self, entity_id: str, payload: dict, clinic_id: str | None = None, is_superuser: bool = False
    ) -> dict | None:
        query = {"$or": [{"_id": entity_id}, {self.id_field: entity_id}]}
        query = self._apply_clinic_filter(query, clinic_id, is_superuser)
        return await self.collection.find_one_and_update(
            query,
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )

    async def delete_by_id(
        self, entity_id: str, clinic_id: str | None = None, is_superuser: bool = False
    ) -> bool:
        query = {"$or": [{"_id": entity_id}, {self.id_field: entity_id}]}
        query = self._apply_clinic_filter(query, clinic_id, is_superuser)
        result = await self.collection.delete_one(query)
        return result.deleted_count > 0

