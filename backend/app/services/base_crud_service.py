from __future__ import annotations

from fastapi import HTTPException, status
from pydantic import BaseModel

from app.repositories.base_repository import BaseMongoRepository
from app.utils.mongo_helpers import generate_prefixed_id, normalize_for_mongo, serialize_mongo_doc


class BaseCrudService:
    def __init__(
        self,
        repository: BaseMongoRepository,
        model_cls: type[BaseModel],
        *,
        id_field: str,
        id_prefix: str,
    ) -> None:
        self.repository = repository
        self.model_cls = model_cls
        self.id_field = id_field
        self.id_prefix = id_prefix

    async def create(self, request: BaseModel) -> dict:
        entity_id = generate_prefixed_id(self.id_prefix)
        data = request.model_dump()
        entity = self.model_cls(**data, **{self.id_field: entity_id})
        payload = normalize_for_mongo(entity.model_dump())
        created = await self.repository.create(payload)
        return serialize_mongo_doc(created, self.id_field)  # type: ignore[arg-type]

    async def list(self) -> list[dict]:
        docs = await self.repository.list()
        return [serialize_mongo_doc(doc, self.id_field) for doc in docs if doc]  # type: ignore[list-item]

    async def get(self, entity_id: str) -> dict:
        doc = await self.repository.get_by_id(entity_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
        return serialize_mongo_doc(doc, self.id_field)  # type: ignore[arg-type]

    async def update(self, entity_id: str, request: BaseModel) -> dict:
        payload = normalize_for_mongo(request.model_dump(exclude_none=True))
        if not payload:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update.")

        updated = await self.repository.update_by_id(entity_id, payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
        return serialize_mongo_doc(updated, self.id_field)  # type: ignore[arg-type]

    async def delete(self, entity_id: str) -> None:
        deleted = await self.repository.delete_by_id(entity_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

