from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class PrescriptionRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="prescriptions", id_field="prescription_id")

