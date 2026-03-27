from pydantic import BaseModel, ConfigDict


class AppointmentCreate(BaseModel):
    pet_id: str
    client_id: str
    # clinic_id is set automatically from current_user


class AppointmentUpdate(BaseModel):
    pet_id: str | None = None
    client_id: str | None = None
    # clinic_id is immutable after creation


class AppointmentResponse(BaseModel):
    appointment_id: str
    clinic_id: str
    pet_id: str
    client_id: str
    status: str

    model_config = ConfigDict(from_attributes=True)
