import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.ml.model import predict_batch
from app.ml.training import CORE_FEATURES

router = APIRouter(prefix="/api/batch", tags=["batch"])


@router.get("/sample-csv")
async def sample_csv():
    """Returns a small example CSV so users know the expected column shape."""
    sample = pd.DataFrame(
        [
            {
                "radius_mean": 12.3, "texture_mean": 15.8, "perimeter_mean": 78.5, "area_mean": 465.0,
                "smoothness_mean": 0.088, "compactness_mean": 0.065, "concavity_mean": 0.038,
                "concave points_mean": 0.021,
            }
        ]
    )
    return {"csv": sample.to_csv(index=False)}


@router.post("/predict")
async def batch_predict(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a .csv file.")

    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not parse CSV: {exc}")

    missing = [col for col in CORE_FEATURES if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV is missing required columns: {', '.join(missing)}",
        )

    rows = df[CORE_FEATURES].to_dict(orient="records")
    try:
        results = predict_batch(rows)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Prediction failed: {exc}")

    return {
        "row_count": len(results),
        "results": [{"row_index": i, **result} for i, result in enumerate(results)],
    }
