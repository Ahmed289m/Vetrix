from fastapi import HTTPException, status

from app.models.appointment import Appointment
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.clinic_repository import ClinicRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.user_repository import UserRepository
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.utils.mongo_helpers import generate_prefixed_id, normalize_for_mongo, serialize_mongo_doc


class AppointmentService:
    def __init__(
        self,
        appointment_repository: AppointmentRepository,
        clinic_repository: ClinicRepository,
        pet_repository: PetRepository,
        user_repository: UserRepository,
    ) -> None:
        self.appointment_repository = appointment_repository
        self.clinic_repository = clinic_repository
        self.pet_repository = pet_repository
        self.user_repository = user_repository

    async def create_appointment(self, request: AppointmentCreate) -> dict:
        clinic = await self.clinic_repository.get_by_clinic_id(request.clinic_id)
        if not clinic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")

        pet = await self.pet_repository.get_by_id(request.pet_id)
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")

        client = await self.user_repository.get_by_user_id(request.client_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

        appointment_id = generate_prefixed_id("appointment")
        appointment_model = Appointment(
            appointment_id=appointment_id,
            clinic_id=request.clinic_id,
            pet_id=request.pet_id,
            client_id=request.client_id,
            status="pending",
        )
        payload = normalize_for_mongo(appointment_model.model_dump())
        created = await self.appointment_repository.create(payload)
        return serialize_mongo_doc(created, "appointment_id")  # type: ignore[arg-type]

    async def update_appointment(self, appointment_id: str, request: AppointmentUpdate) -> dict:
        payload = normalize_for_mongo(request.model_dump(exclude_none=True))
        payload["status"] = "confirmed"

        if payload.get("clinic_id"):
            clinic = await self.clinic_repository.get_by_clinic_id(payload["clinic_id"])
            if not clinic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")

        if payload.get("pet_id"):
            pet = await self.pet_repository.get_by_id(payload["pet_id"])
            if not pet:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")

        if payload.get("client_id"):
            client = await self.user_repository.get_by_user_id(payload["client_id"])
            if not client:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

        updated = await self.appointment_repository.update_by_id(appointment_id, payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

        return serialize_mongo_doc(updated, "appointment_id")  # type: ignore[arg-type]

    async def delete_appointment(self, appointment_id: str) -> None:
        deleted = await self.appointment_repository.delete_by_id(appointment_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

