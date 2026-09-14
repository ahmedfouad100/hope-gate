from fastapi import APIRouter

from app.database import get_db

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


@router.get("")
async def list_hospitals(governorate: str | None = None):
    db = get_db()
    query = {}
    if governorate:
        query = {"$or": [
            {"gov_en": {"$regex": governorate, "$options": "i"}},
            {"gov_ar": {"$regex": governorate, "$options": "i"}},
        ]}
    cursor = db.hospitals.find(query, {"_id": 0})
    return await cursor.to_list(length=200)


@router.get("/governorates")
async def list_governorates():
    db = get_db()
    gov_en = await db.hospitals.distinct("gov_en")
    return sorted(gov_en)
