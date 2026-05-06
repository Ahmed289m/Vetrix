from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CalculatedDose(BaseModel):
    drugId: str
    drugName: str
    drugClass: str
    totalMg: float
    dose: float | None = None
    doseUnit: str | None = None
    concLabel: str
    frequency: str | None = None
    route: str | None = None


class VisitCreate(BaseModel):
    prescription_id: str | None = None
    prescription_ids: list[str] | None = None
    calculated_doses: list[CalculatedDose] | None = None
    weight_at_visit: float | None = None
    client_id: str
    notes: str | None = None
    pet_id: str
    doctor_id: str
    date: datetime
    # clinic_id is set automatically from current_user


class VisitUpdate(BaseModel):
    prescription_id: str | None = None
    prescription_ids: list[str] | None = None
    calculated_doses: list[CalculatedDose] | None = None
    weight_at_visit: float | None = None
    client_id: str | None = None
    notes: str | None = None
    pet_id: str | None = None
    doctor_id: str | None = None
    date: datetime | None = None
    # clinic_id is immutable after creation


class VisitResponse(BaseModel):
    visit_id: str
    prescription_id: str | None = None
    prescription_ids: list[str] | None = None
    calculated_doses: list[CalculatedDose] | None = None
    weight_at_visit: float | None = None
    clinic_id: str
    client_id: str
    notes: str | None = None
    pet_id: str
    doctor_id: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)
