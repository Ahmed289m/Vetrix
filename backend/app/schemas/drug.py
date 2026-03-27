from pydantic import BaseModel, ConfigDict


class DrugCreate(BaseModel):
    drugName: str


class DrugUpdate(BaseModel):
    drugName: str | None = None


class DrugResponse(BaseModel):
    drug_id: str
    drugName: str

    model_config = ConfigDict(from_attributes=True)
