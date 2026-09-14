import { useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Sharqia", "Qalyubia", "Gharbia",
  "Menoufia", "Beheira", "Kafr El-Sheikh", "Damietta", "Port Said", "Ismailia",
  "Suez", "Fayoum", "Beni Suef", "Minya", "Asyut", "Sohag", "Qena", "Luxor",
  "Aswan", "Red Sea", "North Sinai",
];

const SYMPTOM_OPTIONS = ["Lump or thickening", "Skin changes", "Nipple discharge", "Persistent pain", "None"];
const CHRONIC_OPTIONS = ["Diabetes", "Hypertension", "Thyroid disorder", "None"];

export default function PatientIntake() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    phone: "", age: "", governorate: GOVERNORATES[0], district: "",
    symptoms: [], chronic_conditions: [], first_degree_family_history: false,
    previous_breast_biopsy: false, consent: false,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleListValue = (key, value) => {
    setForm((prev) => {
      const list = prev[key];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload = { ...form, age: parseInt(form.age, 10) };
      const { data } = await client.post("/patients/inquiries", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{t("intake.title")}</h1>
      <p>{t("intake.intro")}</p>
      <form className="panel" onSubmit={submit}>
        <div className="field-row">
          <div className="field">
            <label>{t("intake.phone")}</label>
            <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+201234567890" />
          </div>
          <div className="field">
            <label>{t("intake.age")}</label>
            <input required type="number" min="1" max="119" value={form.age} onChange={(e) => update("age", e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t("intake.governorate")}</label>
            <select value={form.governorate} onChange={(e) => update("governorate", e.target.value)}>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t("intake.district")}</label>
            <input value={form.district} onChange={(e) => update("district", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>{t("intake.symptoms")}</label>
          {SYMPTOM_OPTIONS.map((opt) => (
            <label key={opt} className="field checkbox-field" style={{ display: "flex" }}>
              <input type="checkbox" checked={form.symptoms.includes(opt)} onChange={() => toggleListValue("symptoms", opt)} />
              {opt}
            </label>
          ))}
        </div>

        <div className="field">
          <label>{t("intake.chronic")}</label>
          {CHRONIC_OPTIONS.map((opt) => (
            <label key={opt} className="field checkbox-field" style={{ display: "flex" }}>
              <input type="checkbox" checked={form.chronic_conditions.includes(opt)} onChange={() => toggleListValue("chronic_conditions", opt)} />
              {opt}
            </label>
          ))}
        </div>

        <label className="field checkbox-field" style={{ display: "flex" }}>
          <input type="checkbox" checked={form.first_degree_family_history} onChange={(e) => update("first_degree_family_history", e.target.checked)} />
          {t("intake.family_history")}
        </label>
        <label className="field checkbox-field" style={{ display: "flex" }}>
          <input type="checkbox" checked={form.previous_breast_biopsy} onChange={(e) => update("previous_breast_biopsy", e.target.checked)} />
          {t("intake.prior_biopsy")}
        </label>
        <label className="field checkbox-field" style={{ display: "flex" }}>
          <input required type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} />
          {t("intake.consent")}
        </label>

        <button className="primary" type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("intake.submit")}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      {result && (
        <div className="result-banner benign">
          {t("intake.success")} <strong>{result.recommended_hospital_en}</strong>
        </div>
      )}
    </div>
  );
}
