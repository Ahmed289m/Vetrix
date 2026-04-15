from pydantic import BaseModel, ConfigDict, Field




class Drug(BaseModel):
    drug_id: str | None = Field(default=None, alias="_id")
    name: str
    drugClass: str
    indications: list[str]
    dosage: dict
    sideEffects: list[str]
    contraindications: list[str]
    drugInteractions: list[str]
    toxicity: dict
    clinic_id: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
