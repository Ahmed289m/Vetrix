from pydantic import BaseModel, ConfigDict


class DrugCreate(BaseModel):
    drugName: str
    # clinic_id is set automatically from current_user


class DrugUpdate(BaseModel):
    drugName: str | None = None
    # clinic_id is immutable after creation


class DrugResponse(BaseModel):
    drug_id: str
    drugName: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True)
