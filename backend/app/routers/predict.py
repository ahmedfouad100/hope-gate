from fastapi import APIRouter

from app.ml.model import predict_one
from app.models.prediction import CellMeasurements, PredictionResult

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.post("", response_model=PredictionResult)
async def predict(measurements: CellMeasurements):
    features = measurements.model_dump(by_alias=True)
    result = predict_one(features)
    return PredictionResult(**result)
