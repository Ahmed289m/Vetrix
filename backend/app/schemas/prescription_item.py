from pydantic import BaseModel, ConfigDict


class PrescriptionItemCreate(BaseModel):
    drug_id: str
    drugDose: str
    # clinic_id is set automatically from current_user


class PrescriptionItemUpdate(BaseModel):
    drug_id: str | None = None
    drugDose: str | None = None
    # clinic_id is immutable after creation


class PrescriptionItemResponse(BaseModel):
    prescriptionItem_id: str
    drug_id: str
    drugDose: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True)
