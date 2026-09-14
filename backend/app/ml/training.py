"""Single source of truth for training the demo classifier.

This module is imported by both `scripts/train_model.py` (run manually /
in CI) and `app.ml.model` (as a cold-start fallback if artifacts are
missing). Keeping the logic in one place is the fix for the original
project, where the notebook and app.py each carried their own copy of
this training code and could silently drift apart.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

CORE_FEATURES = [
    "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
    "smoothness_mean", "compactness_mean", "concavity_mean", "concave points_mean",
]

RENAME_MAP = {
    "mean radius": "radius_mean",
    "mean texture": "texture_mean",
    "mean perimeter": "perimeter_mean",
    "mean area": "area_mean",
    "mean smoothness": "smoothness_mean",
    "mean compactness": "compactness_mean",
    "mean concavity": "concavity_mean",
    "mean concave points": "concave points_mean",
}


@dataclass
class TrainingResult:
    model: RandomForestClassifier
    metadata: dict = field(default_factory=dict)


def load_dataset() -> tuple[pd.DataFrame, pd.Series]:
    dataset = load_breast_cancer(as_frame=True)
    X = dataset.frame[list(RENAME_MAP)].rename(columns=RENAME_MAP)
    y = (dataset.target == 0).astype(int)  # 1 = malignant, 0 = benign
    return X, y


def train() -> TrainingResult:
    X, y = load_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.22, random_state=42, stratify=y
    )
    model = RandomForestClassifier(
        n_estimators=220, random_state=42, class_weight="balanced", min_samples_leaf=2
    )
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    prob = model.predict_proba(X_test)[:, list(model.classes_).index(1)]

    metadata = {
        "model_source": "Wisconsin Diagnostic Breast Cancer (scikit-learn bundled demo)",
        "is_demo": True,
        "features": CORE_FEATURES,
        "metrics": {
            "accuracy": float(accuracy_score(y_test, pred)),
            "precision": float(precision_score(y_test, pred, zero_division=0)),
            "recall": float(recall_score(y_test, pred, zero_division=0)),
            "f1": float(f1_score(y_test, pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_test, prob)),
        },
        "feature_stats": {
            col: {"benign_median": float(X.loc[y == 0, col].median())}
            for col in CORE_FEATURES
        },
        "disclaimer": (
            "Demo model trained on diagnostic cell-measurement features "
            "(post-biopsy/imaging), not pre-diagnosis risk factors. Not a "
            "clinical device and not validated on any Egyptian patient "
            "population."
        ),
    }
    return TrainingResult(model=model, metadata=metadata)
