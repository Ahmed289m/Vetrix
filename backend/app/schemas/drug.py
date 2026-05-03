from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class DoseSpecies(BaseModel):
    value: float | str | None = None
    unit: str | None = None
    frequency: str | None = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("value", mode="before")
    @classmethod
    def coerce_value(cls, v: Any) -> float | str | None:
        """Accept numeric values AND range strings like '11-22'."""
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
            # Try to parse as a plain float first
            try:
                return float(v)
            except ValueError:
                # Keep range strings like "11-22" as-is
                return v
        return None


class Dose(BaseModel):
    dog: DoseSpecies | None = None
    cat: DoseSpecies | None = None
    route: str | None = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("route", mode="before")
    @classmethod
    def coerce_route(cls, v: Any) -> str | None:
        """Accept a route array like ['PO','IV','SC'] and join it into 'PO/IV/SC'."""
        if v is None:
            return None
        if isinstance(v, list):
            joined = "/".join(str(x).strip() for x in v if x)
            return joined or None
        if isinstance(v, str):
            return v.strip() or None
        return None


class ToxicitySpecies(BaseModel):
    severity: str | None = None
    notes: str | None = None

    model_config = ConfigDict(extra="ignore")


class Toxicity(BaseModel):
    dog: ToxicitySpecies | None = None
    cat: ToxicitySpecies | None = None

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def normalize_flat_toxicity(cls, data: Any) -> Any:
        """
        Accept flat toxicity format: { "notes": "...", "severity": "Low" }
        and promote it to both dog and cat entries automatically.
        """
        if not isinstance(data, dict):
            return data
        has_dog_cat = "dog" in data or "cat" in data
        if has_dog_cat:
            return data
        # Flat format detected — extract notes/severity and apply to both species
        flat: dict[str, Any] = {}
        if isinstance(data.get("notes"), str) and data["notes"].strip():
            flat["notes"] = data["notes"].strip()
        if isinstance(data.get("severity"), str) and data["severity"].strip():
            flat["severity"] = data["severity"].strip()
        if flat:
            return {"dog": flat, "cat": flat}
        return data


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
