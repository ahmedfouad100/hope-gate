import uuid

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database import get_db
from app.models.doctor import DoctorLogin, DoctorOut, DoctorRegister, TokenResponse
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: DoctorRegister):
    db = get_db()
    doctor_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    doc = {
        "doctor_id": doctor_id,
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
    }
    try:
        await db.doctors.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    token = create_access_token(subject=doctor_id)
    return TokenResponse(
        access_token=token,
        doctor=DoctorOut(doctor_id=doctor_id, name=doc["name"], email=doc["email"]),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: DoctorLogin):
    db = get_db()
    doctor = await db.doctors.find_one({"email": payload.email.lower()})
    if doctor is None or not verify_password(payload.password, doctor["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_access_token(subject=doctor["doctor_id"])
    return TokenResponse(
        access_token=token,
        doctor=DoctorOut(doctor_id=doctor["doctor_id"], name=doctor["name"], email=doctor["email"]),
    )
