"""Load app/data/hospitals_seed.json into the hospitals collection.

Usage:
    cd backend
    python -m scripts.seed_hospitals
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import get_db, close_client

SEED_PATH = Path(__file__).resolve().parent.parent / "app" / "data" / "hospitals_seed.json"


async def main():
    db = get_db()
    hospitals = json.loads(SEED_PATH.read_text(encoding="utf-8"))

    await db.hospitals.delete_many({})
    if hospitals:
        await db.hospitals.insert_many(hospitals)

    print(f"Seeded {len(hospitals)} hospitals.")
    await close_client()


if __name__ == "__main__":
    asyncio.run(main())
