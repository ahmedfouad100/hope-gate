import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function DoctorAuth() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate("/doctor/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tab-strip">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          {t("doctor.login_title")}
        </button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          {t("doctor.register_title")}
        </button>
      </div>
      <form className="panel" style={{ maxWidth: 420 }} onSubmit={submit}>
        {mode === "register" && (
          <div className="field">
            <label>{t("doctor.name")}</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
        )}
        <div className="field">
          <label>{t("doctor.email")}</label>
          <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="field">
          <label>{t("doctor.password")}</label>
          <input required type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? t("common.loading") : mode === "login" ? t("doctor.login") : t("doctor.register")}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
