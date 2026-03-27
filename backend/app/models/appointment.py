from pydantic import BaseModel, ConfigDict, Field


class Appointment(BaseModel):
    appointment_id: str | None = Field(default=None, alias="_id")
    clinic_id: str
    pet_id: str
    client_id: str
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
