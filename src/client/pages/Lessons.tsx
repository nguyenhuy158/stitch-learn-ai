import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { Tabs } from "../ui/Tabs";
import { EmptyState, LoadingState } from "../ui/states";
import { LockIcon, CheckIcon, BookIcon } from "../components/icons";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

type Lesson = { id: number; title: string; sub_title?: string; status?: "locked" | "active" | "completed"; type?: string };

function matchesTab(lesson: Lesson, tab: string) {
  if (tab === "all") return true;
  if (tab === "vocab") return (lesson.type || "vocab") === "vocab";
  if (tab === "grammar") return lesson.type === "grammar";
  return false; // "ai" tab has no lesson data yet
}

export default function Lessons() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const TABS = [
    { id: "all", label: t("lessons.tab.all") },
    { id: "grammar", label: t("lessons.tab.grammar") },
    { id: "vocab", label: t("lessons.tab.vocab") },
    { id: "ai", label: t("lessons.tab.ai") },
  ];
  const [tab, setTab] = useState("all");
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .lessons()
      .then((data) => setLessons(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  const showLessons = lessons ? lessons.filter((lesson) => matchesTab(lesson, tab)) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="px-5 pb-5 pt-6 sm:px-9">
        <h1 className="m-0 text-2xl font-extrabold">{t("lessons.title")}</h1>
      </header>
      <div className="px-5 sm:px-9">
        <Tabs items={TABS} active={tab} onChange={setTab} />
      </div>
      <main className="p-5 sm:p-9">
        {error && <div className="py-10 text-center text-sm text-danger">{error}</div>}
        {!error && lessons === null && (
          <LoadingState />
        )}
        {!error && lessons && showLessons && showLessons.length === 0 && (
          <EmptyState title={t("lessons.emptyTitle")} description={t("lessons.emptyDesc")} icon={<BookIcon size={28} />} />
        )}
        {!error && showLessons && showLessons.length > 0 && (
          <ol className="flex flex-col gap-3">
            {showLessons.map((lesson, i) => {
              const locked = lesson.status === "locked";
              const completed = lesson.status === "completed";
              const row = (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm transition",
                    locked ? "opacity-60" : "hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold",
                      completed ? "bg-primary text-primary-fg" : locked ? "bg-surface-muted text-fg-muted" : "bg-primary-soft text-primary"
                    )}
                  >
                    {completed ? <CheckIcon size={18} /> : locked ? <LockIcon size={16} /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{lesson.title}</div>
                    {lesson.sub_title && <div className="truncate text-sm text-fg-muted">{lesson.sub_title}</div>}
                  </div>
                </div>
              );
              return (
                <li key={lesson.id}>
                  {locked ? row : <Link to={`/lesson?id=${lesson.id}`} className="no-underline">{row}</Link>}
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
