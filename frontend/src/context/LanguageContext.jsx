import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [lang, setLangState] = useState(i18n.language || "ar");

  const setLang = (next) => {
    setLangState(next);
    i18n.changeLanguage(next);
    localStorage.setItem("hope_gate_lang", next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
