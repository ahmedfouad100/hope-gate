import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator

PHONE_RE = re.compile(r"^\+?[0-9]{10,15}$")


class PatientInquiry(BaseModel):
    phone: str
    age: int = Field(gt=0, lt=120)
    governorate: str
    district: Optional[str] = None
    symptoms: list[str] = Field(default_factory=list)
    chronic_conditions: list[str] = Field(default_factory=list)
    first_degree_family_history: bool = False
    previous_breast_biopsy: bool = False
    consent: bool

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned = value.strip()
        if not PHONE_RE.match(cleaned):
            raise ValueError("Phone number must be 10-15 digits, optionally starting with +.")
        return cleaned

    @field_validator("consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Consent is required before an inquiry can be saved.")
        return value


class DoctorPatientRecord(BaseModel):
    patient_reference: str = Field(min_length=1, description="De-identified reference the doctor uses locally, not a national ID.")
    age: int = Field(gt=0, lt=120)
    notes: Optional[str] = None
    measurements: dict
    result: dict
