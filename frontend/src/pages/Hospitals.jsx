import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import HospitalRow from "../components/HospitalRow";

export default function Hospitals() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [hospitals, setHospitals] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/hospitals/governorates").then((res) => setGovernorates(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    client
      .get("/hospitals", { params: filter ? { governorate: filter } : {} })
      .then((res) => setHospitals(res.data))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1>{t("hospitals.title")}</h1>
      <p>{t("hospitals.intro")}</p>
      <div className="field" style={{ maxWidth: 320 }}>
        <label>{t("hospitals.filter_label")}</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">{t("hospitals.all")}</option>
          {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="panel">
        {loading ? (
          <p>{t("common.loading")}</p>
        ) : (
          hospitals.map((h, i) => <HospitalRow key={i} hospital={h} lang={lang} />)
        )}
      </div>
    </div>
  );
}
