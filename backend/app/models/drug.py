from pydantic import BaseModel, ConfigDict, Field


class Drug(BaseModel):
    drug_id: str | None = Field(default=None, alias="_id")
    drugName: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
