from pydantic import BaseModel, ConfigDict, Field

from app.schemas.drug import Concentration, Dose, Toxicity


class Drug(BaseModel):
    drug_id: str | None = Field(default=None, alias="_id")
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
