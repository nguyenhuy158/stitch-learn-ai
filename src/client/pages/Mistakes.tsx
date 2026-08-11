import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { useLanguage } from "../i18n/LanguageProvider";

type Correction = { original?: string; suggestion?: string; explanation?: string } | string;

export default function Mistakes() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<Correction[] | null>(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    (async () => {
      try {
        const messages = await api.chatHistory();
        const list: Correction[] = [];
        const seen = new Set<string>();
        for (const m of Array.isArray(messages) ? messages : []) {
          if (m.role !== "model" || !m.metadata) continue;
          let meta: any;
          try {
            meta = JSON.parse(m.metadata);
          } catch {
            continue;
          }
          for (const c of meta.corrections || []) {
            const text = typeof c === "string" ? c : `${c.original || ""} -> ${c.suggestion || ""}`;
            if (seen.has(text)) continue;
            seen.add(text);
            list.push(c);
          }
        }
        setMistakes(list);
      } catch (err: any) {
        if (isUnauthorized(err)) return navigate("/login");
        setError(t("mistakes.loadError") + err.message);
      }
    })();
  }, [navigate, t]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/" title={t("mistakes.title")} subtitle={t("mistakes.subtitle")} />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && mistakes === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && mistakes && mistakes.length === 0 && (
          <PageState>{t("mistakes.empty")}</PageState>
        )}
        {!error && mistakes && mistakes.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {mistakes.slice(0, 30).map((c, i) =>
              typeof c === "string" ? (
                <Card key={i} className="p-4">
                  <div className="text-[15px]">{c}</div>
                </Card>
              ) : (
                <Card key={i} className="p-4">
                  <div className="flex flex-wrap items-baseline gap-2 text-[15px]">
                    {c.original && <span className="text-danger line-through">{c.original}</span>}
                    {c.original && c.suggestion && <span>→</span>}
                    {c.suggestion && <span className="font-bold text-primary">{c.suggestion}</span>}
                  </div>
                  {c.explanation && <div className="text-[13px] text-fg-muted">{c.explanation}</div>}
                </Card>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
