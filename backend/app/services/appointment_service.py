from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.appointment import Appointment
from app.models.enums.user_role import UserRole
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

    async def create_appointment(self, request: AppointmentCreate, current_user: TokenData) -> dict:
        """
        Create an appointment with authorization.
        
        - STAFF/OWNER can create appointments in their clinic
        - CLIENT can create appointments (auto-set as client)
        - ADMIN can create in any clinic
        """
        clinic_id = request.clinic_id or current_user.clinic_id
        if not clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clinic_id is required",
            )
        
        # Enforce clinic isolation
        if not current_user.is_superuser and current_user.clinic_id != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create appointments in other clinics",
            )
        
        clinic = await self.clinic_repository.get_by_clinic_id(clinic_id)
        if not clinic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")

        pet = await self.pet_repository.get_by_id(request.pet_id)
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")

        # For CLIENT, auto-set client_id; otherwise validate
        client_id = current_user.user_id if current_user.role == UserRole.CLIENT else request.client_id
        client = await self.user_repository.get_by_user_id(client_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

        appointment_id = generate_prefixed_id("appointment")
        appointment_model = Appointment(
            appointment_id=appointment_id,
            clinic_id=clinic_id,
            pet_id=request.pet_id,
            client_id=client_id,
            status="pending",
        )
        payload = normalize_for_mongo(appointment_model.model_dump())
        created = await self.appointment_repository.create(payload)
        return serialize_mongo_doc(created, "appointment_id")  # type: ignore[arg-type]

    async def update_appointment(self, appointment_id: str, request: AppointmentUpdate, current_user: TokenData) -> dict:
        """
        Update an appointment with authorization.
        
        - ADMIN can update any appointment
        - STAFF/OWNER can update appointments in their clinic
        - CLIENT can update only their appointments
        """
        appointment = await self.appointment_repository.get_by_id(appointment_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if appointment.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only update their appointments
            if current_user.role == UserRole.CLIENT and appointment.get("client_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only update your own appointments",
                )
        
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

    async def delete_appointment(self, appointment_id: str, current_user: TokenData) -> None:
        """
        Delete an appointment with authorization.
        
        - ADMIN can delete any appointment
        - STAFF/OWNER can delete appointments in their clinic
        - CLIENT can delete only their appointments
        """
        appointment = await self.appointment_repository.get_by_id(appointment_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if appointment.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only delete their appointments
            if current_user.role == UserRole.CLIENT and appointment.get("client_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only delete your own appointments",
                )
        
        deleted = await self.appointment_repository.delete_by_id(appointment_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

