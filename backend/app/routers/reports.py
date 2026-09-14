"""Doctor-portal report intake: paste-text parsing (real regex extraction)
and the image-scan path (a deliberate mock — see docstring below).
"""
import hashlib
import re

from fastapi import APIRouter, Depends, File, UploadFile

from app.ml.training import CORE_FEATURES
from app.security import get_current_doctor

router = APIRouter(prefix="/api/reports", tags=["reports"])

FIELD_PATTERNS = {
    "radius_mean": r"(?:radius|rad)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "texture_mean": r"(?:texture|tex)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "perimeter_mean": r"(?:perimeter|perim)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "area_mean": r"(?:area)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "smoothness_mean": r"(?:smoothness|smooth)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "compactness_mean": r"(?:compactness|compact)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "concavity_mean": r"(?:concavity|concav)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
    "concave points_mean": r"(?:concave\s*points|points)[\s_a-zA-Z:]*([0-9]+\.?[0-9]*)",
}


@router.post("/parse-text")
async def parse_text(payload: dict, current_doctor: dict = Depends(get_current_doctor)):
    """Real regex extraction of the eight core measurements from pasted
    report text. Doctor reviews/corrects the extracted values before any
    prediction runs — this endpoint only extracts, it doesn't predict."""
    text = payload.get("text", "")
    found = {}
    missing = []
    for key, pattern in FIELD_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                found[key] = float(match.group(1))
            except ValueError:
                missing.append(key)
        else:
            missing.append(key)
    return {"found": found, "missing": missing}


@router.post("/mock-image-scan")
async def mock_image_scan(file: UploadFile = File(...), current_doctor: dict = Depends(get_current_doctor)):
    """Deliberate mock, carried over from the original prototype: there is
    no image analysis here. It returns deterministic, plausible-looking
    measurements derived from the file's hash, purely so the rest of the
    pipeline (classification, saving, display) can be demoed end to end.

    `is_simulated: true` is always in the response — the frontend is
    required to show this on-screen, not just note it in a comment, so a
    doctor can never mistake this for a real reading of the uploaded image.
    """
    file_bytes = await file.read()
    digest = hashlib.sha256(file_bytes).digest()

    benign_profile = {
        "radius_mean": 12.30, "texture_mean": 15.80, "perimeter_mean": 78.50,
        "area_mean": 465.00, "smoothness_mean": 0.088, "compactness_mean": 0.065,
        "concavity_mean": 0.038, "concave points_mean": 0.021,
    }
    malignant_profile = {
        "radius_mean": 19.80, "texture_mean": 24.50, "perimeter_mean": 132.00,
        "area_mean": 1180.00, "smoothness_mean": 0.118, "compactness_mean": 0.210,
        "concavity_mean": 0.245, "concave points_mean": 0.135,
    }
    profile = malignant_profile if digest[0] % 2 else benign_profile

    values = {}
    for index, (key, value) in enumerate(profile.items()):
        jitter = 0.96 + (digest[index + 1] / 255.0) * 0.08
        values[key] = round(value * jitter, 4)

    return {
        "found": values,
        "missing": [],
        "is_simulated": True,
        "simulation_notice": (
            "No image analysis was performed. These measurements are a "
            "deterministic placeholder derived from the file itself, not "
            "from its visual content."
        ),
    }
