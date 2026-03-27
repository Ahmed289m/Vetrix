from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Visit(BaseModel):
    visit_id: str | None = Field(default=None, alias="_id")
    prescription_id: str
    clinic_id: str
    client_id: str
    notes: str | None = None
    pet_id: str
    doctor_id: str
    date: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
