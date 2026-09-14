"""Loads the trained model at startup and exposes prediction helpers.

If no trained artifacts exist yet (fresh checkout, no `scripts/train_model.py`
run), this falls back to training in-process once, using the exact same
`app.ml.training` module the script uses — so there is only ever one
training implementation, not two that can disagree.
"""
from __future__ import annotations

import json
import logging

import joblib
import pandas as pd

from app.config import settings
from app.ml.training import CORE_FEATURES, train

logger = logging.getLogger(__name__)

_model = None
_metadata: dict = {}


def _artifact_paths():
    settings.model_dir.mkdir(parents=True, exist_ok=True)
    return (
        settings.model_dir / "cancer_model_core.pkl",
        settings.model_dir / "model_metadata.json",
    )


def load_or_train() -> None:
    global _model, _metadata
    model_path, metadata_path = _artifact_paths()

    if model_path.exists() and metadata_path.exists():
        _model = joblib.load(model_path)
        _metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        logger.info("Loaded model artifacts from %s", model_path)
        return

    logger.warning("No model artifacts found — training a fresh demo model in-process.")
    result = train()
    _model = result.model
    _metadata = result.metadata
    joblib.dump(_model, model_path)
    metadata_path.write_text(json.dumps(_metadata, ensure_ascii=False, indent=2), encoding="utf-8")


def get_metadata() -> dict:
    return _metadata


def predict_one(features: dict) -> dict:
    if _model is None:
        raise RuntimeError("Model not loaded — call load_or_train() at startup.")

    row = {key: features[key] for key in CORE_FEATURES}
    frame = pd.DataFrame([row])
    probabilities = _model.predict_proba(frame)[0]
    classes = list(_model.classes_)
    malignant_index = classes.index(1) if 1 in classes else int(max(range(len(classes)), key=lambda i: probabilities[i]))
    malignant_pct = float(probabilities[malignant_index]) * 100.0

    return {
        "malignant_probability_pct": round(malignant_pct, 2),
        "predicted_label": "malignant" if malignant_pct >= 50 else "benign",
        "is_demo": bool(_metadata.get("is_demo", True)),
        "model_source": _metadata.get("model_source", "unknown"),
        "disclaimer": _metadata.get(
            "disclaimer",
            "Demo model — not a clinical device.",
        ),
    }


def predict_batch(rows: list[dict]) -> list[dict]:
    return [predict_one(row) for row in rows]
