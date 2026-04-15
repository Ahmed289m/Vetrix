from pydantic import BaseModel, ConfigDict


class PrescriptionCreate(BaseModel):
    client_id: str
    pet_id: str
    drug_id: str | None = None          # Auto-creates a PrescriptionItem from the drug's dosage
    prescriptionItem_id: str | None = None  # OR supply an existing item directly
    # clinic_id is set automatically from current_user


class PrescriptionUpdate(BaseModel):
    client_id: str | None = None
    pet_id: str | None = None
    prescriptionItem_id: str | None = None
    # clinic_id is immutable after creation


class PrescriptionResponse(BaseModel):
    prescription_id: str
    clinic_id: str
    client_id: str
    pet_id: str
    prescriptionItem_id: str

    model_config = ConfigDict(from_attributes=True)
