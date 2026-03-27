from pydantic import BaseModel, ConfigDict


class PrescriptionItemCreate(BaseModel):
    drug_id: str
    drugDose: str


class PrescriptionItemUpdate(BaseModel):
    drug_id: str | None = None
    drugDose: str | None = None


class PrescriptionItemResponse(BaseModel):
    prescriptionItem_id: str
    drug_id: str
    drugDose: str

    model_config = ConfigDict(from_attributes=True)
