from pydantic import BaseModel, Field


class CellMeasurements(BaseModel):
    """The eight core cell-measurement features the model was trained on.
    These are diagnostic-workup measurements (post-imaging/biopsy), not
    pre-diagnosis risk factors — see the disclaimer surfaced in every result."""

    radius_mean: float = Field(gt=0)
    texture_mean: float = Field(gt=0)
    perimeter_mean: float = Field(gt=0)
    area_mean: float = Field(gt=0)
    smoothness_mean: float = Field(gt=0)
    compactness_mean: float = Field(gt=0)
    concavity_mean: float = Field(ge=0)
    concave_points_mean: float = Field(ge=0, alias="concave points_mean")

    model_config = {"populate_by_name": True}


class PredictionResult(BaseModel):
    malignant_probability_pct: float
    predicted_label: str
    is_demo: bool
    model_source: str
    disclaimer: str


class BatchPredictionRow(PredictionResult):
    row_index: int
