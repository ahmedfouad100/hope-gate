from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_client, ensure_indexes
from app.ml.model import load_or_train
from app.routers import auth, batch, dashboard, hospitals, patients, predict, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_or_train()          # loads trained model, or trains once if artifacts are missing
    await ensure_indexes()   # idempotent — safe to run on every startup
    yield
    await close_client()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(batch.router)
app.include_router(hospitals.router)
app.include_router(patients.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
