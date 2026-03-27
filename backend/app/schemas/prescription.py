from pydantic import BaseModel, ConfigDict


class PrescriptionCreate(BaseModel):
    clinic_id: str
    client_id: str
    pet_id: str
    prescriptionItem_id: str


class PrescriptionUpdate(BaseModel):
    clinic_id: str | None = None
    client_id: str | None = None
    pet_id: str | None = None
    prescriptionItem_id: str | None = None


class PrescriptionResponse(BaseModel):
    prescription_id: str
    clinic_id: str
    client_id: str
    pet_id: str
    prescriptionItem_id: str

    model_config = ConfigDict(from_attributes=True)
