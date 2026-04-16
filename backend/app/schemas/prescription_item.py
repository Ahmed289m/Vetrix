from pydantic import BaseModel, ConfigDict, Field


class PrescriptionItemCreate(BaseModel):
    drug_ids: list[str] = Field(min_length=1)
    drugDose: str
    # clinic_id is set automatically from current_user


class PrescriptionItemUpdate(BaseModel):
    drug_ids: list[str] | None = None
    drugDose: str | None = None
    # clinic_id is immutable after creation


class PrescriptionItemResponse(BaseModel):
    prescriptionItem_id: str
    drug_ids: list[str]
    drugDose: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True)
