import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { StarIcon } from "../components/icons";
import { LoadingState } from "../ui/states";
import { useLanguage } from "../i18n/LanguageProvider";

type VocabItem = { id: number; term: string; meaning: string; example?: string; lesson_title: string; tags?: string | null };

/** Tag ma Mochi gan cho tu no tu chon them o trang Dich cau (khop AI_WORD_TAG ben server). */
const AI_WORD_TAG = "ai-translation";

export default function Saved() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VocabItem[] | null>(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const load = useCallback(async () => {
    try {
      const data = await api.savedVocab();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(t("saved.loadError") + err.message);
    }
  }, [navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function unsave(id: number) {
    await api.saveVocab(id, false);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/" title={t("saved.title")} />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && items === null && <LoadingState />}
        {!error && items && items.length === 0 && (
          <PageState>{t("saved.empty")}</PageState>
        )}
        {!error && items && items.length > 0 && (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Card key={item.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="text-base font-bold text-primary-hover">{item.term}</div>
                  <div className="mt-0.5 text-xs font-semibold text-fg">{item.meaning}</div>
                  {item.example && <div className="mt-1.5 text-xs italic text-fg-muted">"{item.example}"</div>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs uppercase text-fg-muted">
                    {item.tags?.split(",").includes(AI_WORD_TAG) && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold normal-case text-primary">
                        {t("saved.aiTag")}
                      </span>
                    )}
                    {item.lesson_title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unsave(item.id)}
                  title={t("saved.unsave")}
                  className="shrink-0 border-none bg-transparent text-xl text-fg-muted"
                >
                  <StarIcon fill="currentColor" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
