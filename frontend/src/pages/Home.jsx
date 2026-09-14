import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="hero">
      <p className="kicker">{t("home.kicker")}</p>
      <h1>{t("home.title")}</h1>
      <p>{t("home.body")}</p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <Link to="/predict"><button className="primary">{t("home.cta_predict")}</button></Link>
        <Link to="/hospitals"><button className="secondary">{t("home.cta_hospitals")}</button></Link>
      </div>
    </div>
  );
}
