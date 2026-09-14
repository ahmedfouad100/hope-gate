import { useTranslation } from "react-i18next";

export default function Disclaimer() {
  const { t } = useTranslation();
  return <div className="disclaimer">{t("disclaimer.model")}</div>;
}
