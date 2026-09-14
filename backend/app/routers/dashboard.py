from fastapi import APIRouter, Depends

from app.database import get_db
from app.ml.model import get_metadata
from app.security import get_current_doctor

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def metrics(current_doctor: dict = Depends(get_current_doctor)):
    db = get_db()
    metadata = get_metadata()
    return {
        "model_source": metadata.get("model_source"),
        "is_demo": metadata.get("is_demo", True),
        "metrics": metadata.get("metrics", {}),
        "disclaimer": metadata.get("disclaimer"),
        "counts": {
            "patient_inquiries": await db.patient_inquiries.count_documents({}),
            "doctor_records": await db.doctor_records.count_documents({}),
            "hospitals": await db.hospitals.count_documents({}),
        },
    }
