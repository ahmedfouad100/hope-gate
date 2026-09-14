from pydantic import BaseModel


class Hospital(BaseModel):
    name_ar: str
    name_en: str
    gov_ar: str
    gov_en: str
    lat: float
    lon: float
    accreditation_ar: str
    accreditation_en: str
    services_ar: str
    services_en: str
    # Note: no success_rate / annual_cases fields here. In the original
    # prototype those were unsourced, fabricated numbers that were never
    # actually rendered. They were dropped during migration rather than
    # carried forward — add them back only with a real, citable source.
