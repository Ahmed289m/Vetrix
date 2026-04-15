from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AppointmentCreate(BaseModel):
    pet_id: str
    client_id: str | None = None  # Auto-set from token for CLIENT role
    doctor_id: str | None = None
    appointment_date: datetime | None = None
    reason: str | None = None
    # clinic_id is resolved from pet record for CLIENT, from token for STAFF/OWNER


class AppointmentUpdate(BaseModel):
    pet_id: str | None = None
    client_id: str | None = None
    status: str | None = None
    doctor_id: str | None = None
    appointment_date: datetime | None = None
    reason: str | None = None
    # clinic_id is immutable after creation


class AppointmentResponse(BaseModel):
    appointment_id: str
    clinic_id: str
    pet_id: str
    client_id: str
    doctor_id: str | None = None
    appointment_date: datetime | None = None
    reason: str | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)
