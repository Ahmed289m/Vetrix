from pydantic import BaseModel, ConfigDict, Field


class DoseSpecies(BaseModel):
    value: float | None = None
    unit: str | None = None
    frequency: str | None = None

    model_config = ConfigDict(extra="ignore")


class Dose(BaseModel):
    dog: DoseSpecies | None = None
    cat: DoseSpecies | None = None
    route: str | None = None

    model_config = ConfigDict(extra="ignore")


class ToxicitySpecies(BaseModel):
    severity: str | None = None
    notes: str | None = None

    model_config = ConfigDict(extra="ignore")


class Toxicity(BaseModel):
    dog: ToxicitySpecies | None = None
    cat: ToxicitySpecies | None = None

    model_config = ConfigDict(extra="ignore")


class Concentration(BaseModel):
    value: float | None = None
    unit: str | None = None
    form: str | None = None

    model_config = ConfigDict(extra="ignore")


class DrugCreate(BaseModel):
    name: str
    class_: str = Field(alias="class")
    indications: list[str] = Field(default_factory=list)
    dose: Dose = Field(default_factory=Dose)
    concentration: list[Concentration] = Field(default_factory=list)
    side_effects: list[str] = Field(default_factory=list)
    contraindications: list[str] = Field(default_factory=list)
    interactions: list[str] = Field(default_factory=list)
    toxicity: Toxicity = Field(default_factory=Toxicity)
    clinic_id: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class DrugUpdate(BaseModel):
    name: str | None = None
    class_: str | None = Field(default=None, alias="class")
    indications: list[str] | None = None
    dose: Dose | None = None
    concentration: list[Concentration] | None = None
    side_effects: list[str] | None = None
    contraindications: list[str] | None = None
    interactions: list[str] | None = None
    toxicity: Toxicity | None = None
    clinic_id: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class DrugResponse(BaseModel):
    drug_id: str
    name: str
    class_: str = Field(alias="class")
    indications: list[str] = Field(default_factory=list)
    dose: Dose = Field(default_factory=Dose)
    concentration: list[Concentration] = Field(default_factory=list)
    side_effects: list[str] = Field(default_factory=list)
    contraindications: list[str] = Field(default_factory=list)
    interactions: list[str] = Field(default_factory=list)
    toxicity: Toxicity = Field(default_factory=Toxicity)
    clinic_id: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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
