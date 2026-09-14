import datetime as dt

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + dt.timedelta(minutes=settings.jwt_expires_minutes),
        **(extra_claims or {}),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")


async def get_current_doctor(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency that protects doctor-only routes. Replaces the old
    'type any non-empty string' prototype auth with real verified identity."""
    from app.database import get_db  # local import avoids circular import at module load

    payload = decode_access_token(token)
    doctor_id = payload.get("sub")
    db = get_db()
    doctor = await db.doctors.find_one({"doctor_id": doctor_id})
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor account not found.")
    doctor.pop("password_hash", None)
    return doctor
