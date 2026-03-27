from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseMongoRepository


class AppointmentRepository(BaseMongoRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, collection_name="appointments", id_field="appointment_id")

