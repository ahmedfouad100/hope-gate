import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const { isAuthenticated } = useAuth();

  const links = [
    ["/", t("nav.home")],
    ["/predict", t("nav.predict")],
    ["/intake", t("nav.intake")],
    ["/hospitals", t("nav.hospitals")],
    ["/batch", t("nav.batch")],
    [isAuthenticated ? "/doctor/dashboard" : "/doctor", t("nav.doctor")],
    ["/analytics", t("nav.dashboard")],
  ];

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        <NavLink to="/" className="brand">
          {t("brand.name")} <span className="tagline">{t("brand.tagline")}</span>
        </NavLink>
        <ul className="nav-links">
          {links.map(([to, label]) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => (isActive ? "active" : "")}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button className="lang-toggle" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>
    </nav>
  );
}
