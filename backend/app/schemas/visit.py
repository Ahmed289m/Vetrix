from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VisitCreate(BaseModel):
    prescription_id: str
    client_id: str
    notes: str | None = None
    pet_id: str
    doctor_id: str
    date: datetime
    # clinic_id is set automatically from current_user


class VisitUpdate(BaseModel):
    prescription_id: str | None = None
    client_id: str | None = None
    notes: str | None = None
    pet_id: str | None = None
    doctor_id: str | None = None
    date: datetime | None = None
    # clinic_id is immutable after creation


class VisitResponse(BaseModel):
    visit_id: str
    prescription_id: str
    clinic_id: str
    client_id: str
    notes: str | None = None
    pet_id: str
    doctor_id: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)
