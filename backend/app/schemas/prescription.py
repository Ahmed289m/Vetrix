from pydantic import BaseModel, ConfigDict, Field


class PrescriptionItemDraft(BaseModel):
    drug_ids: list[str] = Field(min_length=1)
    drugDose: str | None = None


class PrescriptionCreate(BaseModel):
    client_id: str
    pet_id: str
    item_drug_ids: list[list[str]] | None = None
    items: list[PrescriptionItemDraft] | None = None
    prescriptionItem_ids: list[str] | None = None
    # clinic_id is set automatically from current_user


class PrescriptionUpdate(BaseModel):
    client_id: str | None = None
    pet_id: str | None = None
    prescriptionItem_ids: list[str] | None = Field(default=None, min_length=1)
    # clinic_id is immutable after creation


class PrescriptionResponse(BaseModel):
    prescription_id: str
    clinic_id: str
    client_id: str
    pet_id: str
    prescriptionItem_ids: list[str]

    model_config = ConfigDict(from_attributes=True)
