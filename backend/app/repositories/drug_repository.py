from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class DrugRepository(BaseMongoRepository):
    """
    Repository for Drug documents. Supports clinic_id filtering for multi-tenancy.
    """
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="drugs", id_field="drug_id")

