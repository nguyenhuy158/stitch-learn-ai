import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-sm text-fg-muted">{t("notFound.message")}</p>
      <Link to="/" className="text-sm font-semibold text-primary no-underline">
        {t("common.backHome")}
      </Link>
    </div>
  );
}
