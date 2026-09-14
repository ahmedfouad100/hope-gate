import { useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

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

export default function DoctorNewRecord() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("manual"); // manual | paste | image
  const [values, setValues] = useState({});
  const [reference, setReference] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [reportText, setReportText] = useState("");
  const [missing, setMissing] = useState([]);
  const [simulated, setSimulated] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const resetExtraction = () => {
    setSimulated(false);
    setSimulationNotice("");
    setMissing([]);
    setResult(null);
    setSaved(false);
    setError("");
  };

  const parseText = async () => {
    resetExtraction();
    setLoading(true);
    try {
      const { data } = await client.post("/reports/parse-text", { text: reportText });
      setValues((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data.found).map(([k, v]) => [k, String(v)])) }));
      setMissing(data.missing);
    } catch (err) {
      setError(err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const scanImage = async (file) => {
    resetExtraction();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await client.post("/reports/mock-image-scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setValues((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data.found).map(([k, v]) => [k, String(v)])) }));
      setSimulated(true);
      setSimulationNotice(data.simulation_notice);
    } catch (err) {
      setError(err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {};
      for (const [key] of FIELDS) payload[key] = parseFloat(values[key]);
      const { data } = await client.post("/predict", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const saveRecord = async () => {
    setError("");
    setLoading(true);
    try {
      const measurements = {};
      for (const [key] of FIELDS) measurements[key] = parseFloat(values[key]);
      await client.post("/patients/records", {
        patient_reference: reference,
        age: parseInt(age, 10),
        notes,
        measurements,
        result,
      });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>New patient record</h1>

      <div className="tab-strip">
        <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Manual entry</button>
        <button className={mode === "paste" ? "active" : ""} onClick={() => setMode("paste")}>Paste report text</button>
        <button className={mode === "image" ? "active" : ""} onClick={() => setMode("image")}>Scan image</button>
      </div>

      {mode === "paste" && (
        <div className="panel">
          <div className="field">
            <label>Paste the pathology report text</label>
            <textarea rows={6} value={reportText} onChange={(e) => setReportText(e.target.value)} />
          </div>
          <button className="secondary" onClick={parseText} disabled={loading || !reportText.trim()}>
            Extract measurements
          </button>
          {missing.length > 0 && (
            <p className="error-text">Could not find in text: {missing.join(", ")} — enter these manually below.</p>
          )}
        </div>
      )}

      {mode === "image" && (
        <div className="panel">
          <div className="disclaimer">
            <strong>Simulated, not a real scan.</strong> This demo does not analyze the image you upload.
            The measurements below come from a deterministic placeholder, not from anything in the file's
            visual content. Never use this to inform an actual diagnosis.
          </div>
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && scanImage(e.target.files[0])} />
        </div>
      )}

      {simulated && (
        <div className="disclaimer">
          <strong>SIMULATED RESULT</strong> — {simulationNotice}
        </div>
      )}

      <div className="panel">
        <div className="field-row">
          <div className="field">
            <label>Patient reference (de-identified, not a national ID)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="field">
            <label>Age</label>
            <input type="number" min="1" max="119" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          {FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input
                id={key}
                type="number"
                step="any"
                value={values[key] || ""}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="primary" onClick={runPrediction} disabled={loading}>
          Run prediction
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>

      {result && (
        <div className={`result-banner ${result.predicted_label}`}>
          {simulated && <p><strong>Based on simulated measurements — not a real result.</strong></p>}
          <strong>{result.predicted_label === "malignant" ? "Model leans malignant" : "Model leans benign"}</strong>
          <p>Estimated malignant probability: {result.malignant_probability_pct}%</p>
          <p style={{ fontSize: "0.85rem" }}>{result.disclaimer}</p>
          <button className="secondary" onClick={saveRecord} disabled={loading || !reference || saved} style={{ marginTop: "0.75rem" }}>
            {saved ? "Saved" : "Save to records"}
          </button>
        </div>
      )}
    </div>
  );
}
