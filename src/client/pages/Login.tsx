import { Button } from "../ui/Button";
import { api } from "../lib/api";
import { useLanguage } from "../i18n/LanguageProvider";

export default function Login() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-extrabold">AI English</h1>
      <p className="max-w-sm text-sm text-fg-muted">{t("login.subtitle")}</p>
      <Button size="lg" onClick={() => api.loginWithGoogle()}>
        {t("login.button")}
      </Button>
    </div>
  );
}
