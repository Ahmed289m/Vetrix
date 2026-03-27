from pydantic import BaseModel, ConfigDict


class ClinicCreate(BaseModel):
    clinicName: str
    address: str
    phone: str
    subscriptionStatus: str


class ClinicUpdate(BaseModel):
    clinicName: str | None = None
    address: str | None = None
    phone: str | None = None
    subscriptionStatus: str | None = None


class ClinicResponse(BaseModel):
    clinic_id: str
    clinicName: str
    address: str
    phone: str
    subscriptionStatus: str

    model_config = ConfigDict(from_attributes=True)
