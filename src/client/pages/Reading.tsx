import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../ui/cn";
import { ClickableSentence } from "../components/ClickableSentence";
import { ReadingQuiz } from "../components/ReadingQuiz";
import { useLanguage } from "../i18n/LanguageProvider";

type StoryLevel = { guid: string; level: number };
type Story = { story: string; category: string; publishedAt: string; imageUrl: string; levels: StoryLevel[] };
type Article = {
  guid: string;
  story: string;
  level: number;
  category: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl: string;
  audioUrl: string;
  paragraphs: string[];
  translations: string[];
};

export default function Reading() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const guid = params.get("g");
  const [stories, setStories] = useState<Story[] | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  const [showVi, setShowVi] = useState(false);
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
                <Card key={s.story} className="flex gap-4 p-4">
                  {s.imageUrl && (
                    <img
                      src={s.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
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
              <div className="mb-4 flex flex-wrap gap-2">
                {article.translations.length > 0 && (
                  <Button
                    variant={showVi ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setShowVi((v) => !v)}
                  >
                    {t("reading.bilingual")}
                  </Button>
                )}
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
              {article.imageUrl && (
                <img src={article.imageUrl} alt="" className="mb-4 max-h-72 w-full rounded-xl object-cover" />
              )}
              {article.audioUrl && (
                <iframe
                  title="audio"
                  src={article.audioUrl}
                  width="100%"
                  height="166"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  className="mb-4 rounded-xl"
                />
              )}
              <div className="flex flex-col gap-3">
                {article.paragraphs.map((p, i) => (
                  <div key={i}>
                    <ClickableSentence text={p} />
                    {showVi && article.translations[i] && (
                      <p className="mt-1 text-sm italic leading-relaxed text-fg-muted">{article.translations[i]}</p>
                    )}
                  </div>
                ))}
              </div>
              <ReadingQuiz guid={article.guid} />
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
