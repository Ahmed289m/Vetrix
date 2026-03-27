from pydantic import BaseModel, ConfigDict, Field


class PrescriptionItem(BaseModel):
    prescriptionItem_id: str | None = Field(default=None, alias="_id")
    drug_id: str
    drugDose: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
