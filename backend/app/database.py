from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.mongodb_uri)
    return client


def get_db():
    return get_client()[settings.mongodb_db]


async def close_client():
    global client
    if client is not None:
        client.close()
        client = None


async def ensure_indexes():
    """Create indexes needed for correctness and query performance.
    Safe to call on every startup — createIndex is idempotent."""
    db = get_db()
    await db.doctors.create_index("email", unique=True)
    await db.doctors.create_index("doctor_id", unique=True)
    await db.patient_inquiries.create_index("phone")
    await db.patient_inquiries.create_index("created_at")
    await db.doctor_records.create_index("created_at")
    await db.hospitals.create_index("gov_en")
