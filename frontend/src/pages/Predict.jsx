import { useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import Disclaimer from "../components/Disclaimer";

const FIELDS = [
  ["radius_mean", "Radius mean"],
  ["texture_mean", "Texture mean"],
  ["perimeter_mean", "Perimeter mean"],
  ["area_mean", "Area mean"],
  ["smoothness_mean", "Smoothness mean"],
  ["compactness_mean", "Compactness mean"],
  ["concavity_mean", "Concavity mean"],
  ["concave points_mean", "Concave points mean"],
];

export default function Predict() {
  const { t } = useTranslation();
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload = {};
      for (const [key] of FIELDS) {
        payload[key] = parseFloat(values[key]);
      }
      const { data } = await client.post("/predict", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{t("predict.title")}</h1>
      <p>{t("predict.intro")}</p>
      <Disclaimer />
      <form className="panel" onSubmit={submit}>
        <div className="field-row">
          {FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input
                id={key}
                type="number"
                step="any"
                required
                value={values[key] || ""}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("predict.submit")}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      {result && (
        <div className={`result-banner ${result.predicted_label}`}>
          <strong>
            {result.predicted_label === "malignant" ? t("predict.result_malignant") : t("predict.result_benign")}
          </strong>
          <p>
            {t("predict.probability")}: {result.malignant_probability_pct}%
          </p>
          <p style={{ fontSize: "0.85rem" }}>{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
