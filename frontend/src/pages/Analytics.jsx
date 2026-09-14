import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Analytics() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    client.get("/dashboard/metrics").then((res) => setData(res.data)).catch(() => setError(t("common.error")));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div>
        <h1>{t("dashboard.title")}</h1>
        <p>
          {t("doctor.login_title")} — <Link to="/doctor">{t("nav.doctor")}</Link>
        </p>
      </div>
    );
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p>{t("common.loading")}</p>;

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.model_source")}: {data.model_source}</p>
      <div className="disclaimer">{data.disclaimer}</div>

      <div className="panel metric-strip">
        <div className="metric-cell"><span className="value">{pct(data.metrics.accuracy)}</span><span className="label">{t("dashboard.accuracy")}</span></div>
        <div className="metric-cell"><span className="value">{pct(data.metrics.precision)}</span><span className="label">{t("dashboard.precision")}</span></div>
        <div className="metric-cell"><span className="value">{pct(data.metrics.recall)}</span><span className="label">{t("dashboard.recall")}</span></div>
        <div className="metric-cell"><span className="value">{data.metrics.roc_auc.toFixed(3)}</span><span className="label">{t("dashboard.roc_auc")}</span></div>
      </div>

      <h2>{t("dashboard.counts_title")}</h2>
      <div className="panel metric-strip">
        <div className="metric-cell"><span className="value">{data.counts.patient_inquiries}</span><span className="label">{t("nav.intake")}</span></div>
        <div className="metric-cell"><span className="value">{data.counts.doctor_records}</span><span className="label">{t("doctor.records_title")}</span></div>
        <div className="metric-cell"><span className="value">{data.counts.hospitals}</span><span className="label">{t("nav.hospitals")}</span></div>
      </div>
    </div>
  );
}
