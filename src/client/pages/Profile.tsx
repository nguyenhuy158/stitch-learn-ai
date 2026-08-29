import { useEffect, useState } from "react";
import { CheckIcon, ChevronDownIcon, LogOutIcon } from "../components/icons";
import { Menu } from "../ui/Menu";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { LoadingState } from "../ui/states";
import { Switch } from "../ui/Switch";
import { ConfirmDialog } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { useTheme } from "../theme/ThemeProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { ActivityHeatmap } from "../components/ActivityHeatmap";

// Phai trung allowlist trong src/domain/aiConfig.js — server tu loc lai neu lech.
const AI_MODELS = [
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", label: "Llama 3.3 70B" },
  { id: "@cf/meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
  { id: "@cf/meta/llama-3.1-8b-instruct-fast", label: "Llama 3.1 8B (nhanh)" }
];

export default function Profile() {
  const navigate = useNavigate();
  const { theme, mode, themes } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const toast = useToast();
  const currentThemeLabel = t(`appearance.accent.${themes.find((th) => th.id === theme)?.id ?? theme}`);
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((data) => {
        if (!data.user) return navigate("/login");
        setUser(data.user);
      })
      .finally(() => setLoaded(true));
  }, [navigate]);

  if (!loaded) {
    return <LoadingState />;
  }
  if (!user) return null;

  const aiConfig = { model: AI_MODELS[0].id, explainLang: "vi", ...(user.gemini_config || {}) };
  // updateProfile ghi de ca cot JSON nen phai gui du object, khong gui rieng 1 field.
  const saveAiConfig = (patch: Record<string, string>) => {
    const next = { ...aiConfig, ...patch };
    setUser((u: any) => ({ ...u, gemini_config: next }));
    api.updateProfile({ gemini_config: next }).catch(() => toast.error(t("common.error")));
  };

  return (
    <div className="mx-auto max-w-2xl p-5 sm:p-9">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user.name || user.email || "?"} src={user.avatar_url} size="lg" />
        <div>
          <div className="text-xl font-bold">{user.name || t("profile.unnamed")}</div>
          <div className="text-sm text-fg-muted">{user.email}</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <Card className="p-3">
          <div className="text-lg font-extrabold text-primary">{user.streak || 0}</div>
          <div className="text-xs text-fg-muted">{t("profile.streak")}</div>
        </Card>
        <Card className="p-3">
          <div className="text-lg font-extrabold text-primary">{user.xp || 0}</div>
          <div className="text-xs text-fg-muted">XP</div>
        </Card>
        <Card className="p-3">
          <div className="text-lg font-extrabold text-primary">{user.level || "B1"}</div>
          <div className="text-xs text-fg-muted">{t("profile.level")}</div>
        </Card>
      </div>

      <ActivityHeatmap />

      <div className="mb-2 text-sm font-bold text-fg-muted">{t("profile.settingsTitle")}</div>
      <Card padded={false} className="mb-6 divide-y divide-border overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4">
          <span className="text-sm">{t("profile.language")}</span>
          <div className="inline-flex shrink-0 overflow-hidden rounded-full border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang("vi")}
              aria-pressed={lang === "vi"}
              className={
                "px-3 py-1.5 transition " +
                (lang === "vi" ? "bg-primary text-primary-fg" : "bg-surface text-fg-muted")
              }
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={
                "px-3 py-1.5 transition " +
                (lang === "en" ? "bg-primary text-primary-fg" : "bg-surface text-fg-muted")
              }
            >
              English
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm">{t("profile.voice")}</span>
          <span className="text-sm text-fg-muted">{t("profile.voiceDefault")}</span>
        </div>
        <Link
          to="/theme"
          className="flex items-center justify-between p-4 text-sm no-underline"
        >
          <span>{t("profile.appearance")}</span>
          <span className="flex items-center gap-1.5 text-fg-muted">
            {currentThemeLabel} · {mode === "dark" ? t("appearance.dark") : t("appearance.light")}
            <span aria-hidden>›</span>
          </span>
        </Link>
        <div className="p-4">
          <Switch
            checked={user.flashcard_audio !== 0}
            label={t("profile.flashcardAudioLabel")}
            description={t("profile.flashcardAudioDesc")}
            onChange={(checked) => {
              const value = checked ? 1 : 0;
              setUser((u: any) => ({ ...u, flashcard_audio: value }));
              api.updateProfile({ flashcard_audio: value }).catch(() => toast.error(t("common.error")));
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="text-sm">{t("profile.flashcardSessionLabel")}</div>
            <div className="mt-0.5 text-xs text-fg-muted">{t("profile.flashcardSessionDesc")}</div>
          </div>
          <div className="inline-flex shrink-0 overflow-hidden rounded-full border border-border text-xs font-semibold">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setUser((u: any) => ({ ...u, flashcard_session_size: n }));
                  api.updateProfile({ flashcard_session_size: n }).catch(() => toast.error(t("common.error")));
                }}
                aria-pressed={(user.flashcard_session_size || 10) === n}
                className={
                  "px-3 py-1.5 transition " +
                  ((user.flashcard_session_size || 10) === n ? "bg-primary text-primary-fg" : "bg-surface text-fg-muted")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="text-sm">{t("profile.aiModelLabel")}</div>
            <div className="mt-0.5 text-xs text-fg-muted">{t("profile.aiModelDesc")}</div>
          </div>
          <Menu
            className="shrink-0"
            items={AI_MODELS.map((m) => ({
              label: m.label,
              icon: <CheckIcon size={16} className={aiConfig.model === m.id ? "" : "invisible"} />,
              onSelect: () => saveAiConfig({ model: m.id })
            }))}
            trigger={(props) => (
              <button
                type="button"
                {...props}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold"
              >
                {AI_MODELS.find((m) => m.id === aiConfig.model)?.label ?? AI_MODELS[0].label}
                <ChevronDownIcon size={14} className="text-fg-muted" />
              </button>
            )}
          />
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="text-sm">{t("profile.explainLangLabel")}</div>
            <div className="mt-0.5 text-xs text-fg-muted">{t("profile.explainLangDesc")}</div>
          </div>
          <div className="inline-flex shrink-0 overflow-hidden rounded-full border border-border text-xs font-semibold">
            {(["vi", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => saveAiConfig({ explainLang: code })}
                aria-pressed={aiConfig.explainLang === code}
                className={
                  "px-3 py-1.5 transition " +
                  (aiConfig.explainLang === code ? "bg-primary text-primary-fg" : "bg-surface text-fg-muted")
                }
              >
                {code === "vi" ? "Tiếng Việt" : "English"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="mb-2 text-sm font-bold text-fg-muted">{t("profile.helpTitle")}</div>
      <Card padded={false} className="mb-6 overflow-hidden">
        <Link to="/help" className="block p-4 text-sm no-underline">
          {t("profile.helpLink")}
        </Link>
      </Card>

      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="flex w-full items-center justify-center gap-2 rounded-ui border border-danger py-3 text-sm font-semibold text-danger"
      >
        <LogOutIcon size={16} />
        {t("profile.logout")}
      </button>

      <p className="mt-6 text-center text-xs text-fg-muted">{t("profile.version")}</p>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => api.logout()}
        title={t("profile.logoutConfirmTitle")}
        description={t("profile.logoutConfirmDesc")}
        confirmLabel={t("profile.logout")}
        cancelLabel={t("common.cancel")}
        destructive
      />
    </div>
  );
}
