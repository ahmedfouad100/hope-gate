import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { doctor, logout } = useAuth();
  const [tab, setTab] = useState("records");
  const [records, setRecords] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const request = tab === "records" ? client.get("/patients/records") : client.get("/patients/inquiries");
    request
      .then((res) => (tab === "records" ? setRecords(res.data) : setInquiries(res.data)))
      .finally(() => setLoading(false));
  }, [tab]);

  const rows = tab === "records" ? records : inquiries;
  const columns = tab === "records"
    ? ["patient_reference", "age", "created_at"]
    : ["phone", "age", "governorate", "recommended_hospital_en", "created_at"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p>{t("doctor.logged_in_as")} <strong>{doctor?.name}</strong> ({doctor?.doctor_id})</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/doctor/new"><button className="primary">New record</button></Link>
          <button className="secondary" onClick={logout}>{t("doctor.logout")}</button>
        </div>
      </div>

      <div className="tab-strip">
        <button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}>
          {t("doctor.records_title")}
        </button>
        <button className={tab === "inquiries" ? "active" : ""} onClick={() => setTab("inquiries")}>
          {t("doctor.inquiries_title")}
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <p>{t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p>—</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => <td key={c}>{String(row[c] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
