import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.patient import DoctorPatientRecord, PatientInquiry
from app.routers.hospitals import list_hospitals
from app.security import get_current_doctor

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
async def submit_inquiry(payload: PatientInquiry):
    """Public intake form. No PII beyond phone/age/location is required,
    and nothing here is exposed without doctor authentication."""
    db = get_db()
    hospitals = await list_hospitals(governorate=payload.governorate)
    recommended = hospitals[0] if hospitals else None

    record = payload.model_dump()
    record["recommended_hospital_en"] = recommended["name_en"] if recommended else None
    record["recommended_hospital_ar"] = recommended["name_ar"] if recommended else None
    record["created_at"] = dt.datetime.now(dt.timezone.utc)

    result = await db.patient_inquiries.insert_one(record)
    return {
        "id": str(result.inserted_id),
        "recommended_hospital_en": record["recommended_hospital_en"],
        "recommended_hospital_ar": record["recommended_hospital_ar"],
    }


@router.get("/inquiries")
async def list_inquiries(current_doctor: dict = Depends(get_current_doctor)):
    """Doctor-only. Requires a verified JWT — replaces the original
    prototype where any non-empty string logged a 'doctor' in."""
    db = get_db()
    cursor = db.patient_inquiries.find({}, {"_id": 0}).sort("created_at", -1).limit(500)
    return await cursor.to_list(length=500)


@router.post("/records", status_code=status.HTTP_201_CREATED)
async def save_doctor_record(payload: DoctorPatientRecord, current_doctor: dict = Depends(get_current_doctor)):
    db = get_db()
    record = payload.model_dump()
    record["doctor_id"] = current_doctor["doctor_id"]
    record["created_at"] = dt.datetime.now(dt.timezone.utc)
    result = await db.doctor_records.insert_one(record)
    return {"id": str(result.inserted_id)}


@router.get("/records")
async def list_doctor_records(current_doctor: dict = Depends(get_current_doctor)):
    db = get_db()
    cursor = db.doctor_records.find(
        {"doctor_id": current_doctor["doctor_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(500)
    return await cursor.to_list(length=500)
