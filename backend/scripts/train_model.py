"""Train the demo model and write artifacts to app/ml/artifacts/.

Usage:
    cd backend
    python -m scripts.train_model
"""
import json
import sys
from pathlib import Path

import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.ml.training import train


def main():
    settings.model_dir.mkdir(parents=True, exist_ok=True)
    result = train()

    model_path = settings.model_dir / "cancer_model_core.pkl"
    metadata_path = settings.model_dir / "model_metadata.json"

    joblib.dump(result.model, model_path)
    metadata_path.write_text(json.dumps(result.metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote model to {model_path}")
    print(f"Wrote metadata to {metadata_path}")
    print(json.dumps(result.metadata["metrics"], indent=2))


if __name__ == "__main__":
    main()
