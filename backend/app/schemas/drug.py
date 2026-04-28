from pydantic import BaseModel, ConfigDict




class DrugCreate(BaseModel):
    name: str
    drugClass: str
    indications: list[str]
    dosage: dict
    sideEffects: list[str]
    contraindications: list[str]
    drugInteractions: list[str]
    toxicity: dict
    clinic_id: str | None = None




class DrugUpdate(BaseModel):
    name: str | None = None
    drugClass: str | None = None
    indications: list[str] | None = None
    dosage: dict | None = None
    sideEffects: list[str] | None = None
    contraindications: list[str] | None = None
    drugInteractions: list[str] | None = None
    toxicity: dict | None = None
    clinic_id: str | None = None




class DrugResponse(BaseModel):
    drug_id: str
    name: str
    drugClass: str
    indications: list[str]
    dosage: dict
    sideEffects: list[str]
    contraindications: list[str]
    drugInteractions: list[str]
    toxicity: dict
    clinic_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DrugInteractionRequest(BaseModel):
    drug_ids: list[str]


class DrugInteractionWarning(BaseModel):
    drug_a: str
    drug_a_id: str
    drug_b: str
    drug_b_id: str
    reason: str
    severity: str


class DrugInteractionResponse(BaseModel):
    has_interactions: bool
    warnings: list[DrugInteractionWarning]
