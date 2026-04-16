from pydantic import BaseModel, ConfigDict, Field


class PrescriptionItem(BaseModel):
    prescriptionItem_id: str | None = Field(default=None, alias="_id")
    drug_ids: list[str]
    drugDose: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
