from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class Appointment(BaseModel):
    appointment_id: str | None = Field(default=None, alias="_id")
    clinic_id: str
    pet_id: str
    client_id: str
    doctor_id: str | None = None
    appointment_date: datetime | None = None
    reason: str | None = None
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
