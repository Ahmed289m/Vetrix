from pydantic import BaseModel, ConfigDict


class AppointmentCreate(BaseModel):
    clinic_id: str
    pet_id: str
    client_id: str


class AppointmentUpdate(BaseModel):
    clinic_id: str | None = None
    pet_id: str | None = None
    client_id: str | None = None


class AppointmentResponse(BaseModel):
    appointment_id: str
    clinic_id: str
    pet_id: str
    client_id: str
    status: str

    model_config = ConfigDict(from_attributes=True)
