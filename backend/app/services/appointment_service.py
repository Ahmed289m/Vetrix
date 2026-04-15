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
from app.utils.ws import broadcast


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

    async def get_appointments(self, current_user: TokenData) -> list:
        """
        Get all appointments accessible to the current user.

        - ADMIN can see all appointments
        - STAFF/OWNER/DOCTOR can see appointments in their clinic
        - CLIENT can see only their appointments
        """
        if current_user.is_superuser:
            # Admin can see all appointments
            appointments = await self.appointment_repository.list()
        elif current_user.role in [UserRole.STAFF, UserRole.OWNER, UserRole.DOCTOR]:
            # Staff/Owner/Doctor can see appointments in their clinic
            appointments = await self.appointment_repository.list(
                clinic_id=current_user.clinic_id,
                is_superuser=False
            )
        elif current_user.role == UserRole.CLIENT:
            # CLIENT can see only their appointments
            appointments = await self.appointment_repository.collection.find(
                {"client_id": current_user.user_id}
            ).to_list(length=None)
        else:
            appointments = []

        # Serialize all appointments
        return [serialize_mongo_doc(apt, "appointment_id") for apt in appointments]  # type: ignore[misc]

    async def create_appointment(self, request: AppointmentCreate, current_user: TokenData) -> dict:
        """
        Create an appointment with authorization.

        - STAFF/OWNER can create appointments in their clinic
        - CLIENT can create appointments (auto-set as client, clinic_id resolved from pet)
        - ADMIN can create in any clinic
        """
        # For CLIENT: resolve clinic_id from the pet they are booking for,
        # since CLIENT tokens do not carry clinic_id.
        if current_user.role == UserRole.CLIENT:
            pet = await self.pet_repository.get_by_id(request.pet_id)
            if not pet:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")

            clinic_id = pet.get("clinic_id")
            if not clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not determine clinic from pet record.",
                )

            # Verify the pet belongs to this client.
            # Check both owner_id and client_id for backward compatibility
            # (pets created before owner_id was introduced only have client_id).
            pet_owner = pet.get("owner_id") or pet.get("client_id")
            if pet_owner != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Pet does not belong to you.",
                )

            client_id = current_user.user_id
        else:
            requested_clinic_id = getattr(request, "clinic_id", None)
            clinic_id = requested_clinic_id or current_user.clinic_id
            if not clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="clinic_id is required",
                )

            # Enforce clinic isolation for non-admins
            if not current_user.is_superuser and current_user.clinic_id != clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot create appointments in other clinics",
                )

            pet = await self.pet_repository.get_by_id(request.pet_id)
            if not pet:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")
            if pet.get("clinic_id") != clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Pet belongs to a different clinic",
                )

            client_id = request.client_id

        clinic = await self.clinic_repository.get_by_clinic_id(clinic_id)
        if not clinic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")

        if not client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="client_id is required",
            )

        client = await self.user_repository.get_by_user_id(client_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

        # For non-CLIENT roles, validate the client belongs to the same clinic
        if current_user.role != UserRole.CLIENT and client.get("clinic_id") != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Client belongs to a different clinic",
            )

        appointment_id = generate_prefixed_id("appointment")
        appointment_model = Appointment(
            appointment_id=appointment_id,
            clinic_id=clinic_id,
            pet_id=request.pet_id,
            client_id=client_id,
            doctor_id=request.doctor_id,
            appointment_date=request.appointment_date,
            reason=request.reason,
            status="pending",
        )
        payload = normalize_for_mongo(appointment_model.model_dump())
        created = await self.appointment_repository.create(payload)
        await broadcast("appointments:created", {"id": appointment_id})
        return serialize_mongo_doc(created, "appointment_id")  # type: ignore[arg-type]

    async def update_appointment(self, appointment_id: str, request: AppointmentUpdate, current_user: TokenData) -> dict:
        """
        Update an appointment with authorization.

        - ADMIN can update any appointment
        - STAFF/OWNER can update appointments in their clinic
        - CLIENT can update only their own appointments (ownership check only, no clinic_id required)
        """
        appointment = await self.appointment_repository.get_by_id(appointment_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

        if not current_user.is_superuser:
            if current_user.role == UserRole.CLIENT:
                # CLIENT: only ownership check — clinic_id is not in their token
                if appointment.get("client_id") != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Can only update your own appointments",
                    )
            else:
                # STAFF/OWNER/DOCTOR: clinic isolation check
                if appointment.get("clinic_id") != current_user.clinic_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )

        payload = normalize_for_mongo(request.model_dump(exclude_none=True))

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

        await broadcast("appointments:updated", {"id": appointment_id})
        return serialize_mongo_doc(updated, "appointment_id")  # type: ignore[arg-type]

    async def delete_appointment(self, appointment_id: str, current_user: TokenData) -> None:
        """
        Delete an appointment with authorization.

        - ADMIN can delete any appointment
        - STAFF/OWNER can delete appointments in their clinic
        - CLIENT can delete only their own appointments (ownership check only, no clinic_id required)
        """
        appointment = await self.appointment_repository.get_by_id(appointment_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

        if not current_user.is_superuser:
            if current_user.role == UserRole.CLIENT:
                # CLIENT: only ownership check — clinic_id is not in their token
                if appointment.get("client_id") != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Can only delete your own appointments",
                    )
            else:
                # STAFF/OWNER/DOCTOR: clinic isolation check
                if appointment.get("clinic_id") != current_user.clinic_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )

        deleted = await self.appointment_repository.delete_by_id(appointment_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
        await broadcast("appointments:deleted", {"id": appointment_id})
