import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../ui/cn";
import { ClickableSentence } from "../components/ClickableSentence";
import { useLanguage } from "../i18n/LanguageProvider";

type StoryLevel = { guid: string; level: number };
type Story = { story: string; category: string; publishedAt: string; levels: StoryLevel[] };
type Article = {
  guid: string;
  story: string;
  level: number;
  category: string;
  publishedAt: string;
  sourceUrl: string;
  paragraphs: string[];
};

export default function Reading() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const guid = params.get("g");
  const [stories, setStories] = useState<Story[] | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  const { t, lang } = useLanguage();

  useEffect(() => {
    api
      .readingStories()
      .then((res: { stories: Story[] }) => setStories(res.stories))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  useEffect(() => {
    if (!guid) return setArticle(null);
    setArticle(null);
    setError("");
    api
      .readingArticle(guid)
      .then(setArticle)
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [guid, navigate]);

  const openLevel = (g: string) => setParams({ g });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        backTo={guid ? "/reading" : "/"}
        backLabel={guid ? t("reading.backToList") : undefined}
        title={t("reading.title")}
        subtitle={t("reading.subtitle")}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {!guid && !error && (
          stories === null ? (
            <PageState>{t("common.loading")}</PageState>
          ) : stories.length === 0 ? (
            <PageState>{t("reading.empty")}</PageState>
          ) : (
            <div className="flex flex-col gap-3">
              {stories.map((s) => (
                <Card key={s.story} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-base font-bold text-primary-hover">{s.story}</span>
                    <span className="text-xs text-fg-muted">
                      {s.category && `${s.category} · `}
                      {new Date(s.publishedAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {s.levels.map((l) => (
                      <Button key={l.guid} variant="outline" size="sm" onClick={() => openLevel(l.guid)}>
                        Level {l.level}
                      </Button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {guid && !error && (
          !article ? (
            <PageState>{t("common.loading")}</PageState>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 text-xl font-bold text-primary-hover">{article.story}</h2>
                <span className="text-xs text-fg-muted">
                  {article.category && `${article.category} · `}
                  {new Date(article.publishedAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}
                </span>
              </div>
              {/* Doi level ngay trong bai */}
              <div className="mb-4 flex gap-2">
                {(stories?.find((s) => s.story === article.story)?.levels ?? []).map((l) => (
                  <Button
                    key={l.guid}
                    variant={l.guid === article.guid ? "primary" : "outline"}
                    size="sm"
                    onClick={() => openLevel(l.guid)}
                    className={cn(l.guid === article.guid && "pointer-events-none")}
                  >
                    Level {l.level}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {article.paragraphs.map((p, i) => (
                  <ClickableSentence key={i} text={p} />
                ))}
              </div>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs text-fg-muted underline"
              >
                {t("reading.source")}
              </a>
            </>
          )
        )}
      </main>
    </div>
  );
}
