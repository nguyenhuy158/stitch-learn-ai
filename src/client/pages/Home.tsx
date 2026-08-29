import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Card } from "../ui/Card";
import { LoadingState } from "../ui/states";
import { Tabs } from "../ui/Tabs";
import { AlphabetIcon, BookIcon } from "../components/icons";
import { useLanguage } from "../i18n/LanguageProvider";
import { TOOL_TABS, TOOL_KEYS } from "../lib/navItems";

type Lesson = { id: number; title: string; sub_title?: string; status?: string };



export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [toolTab, setToolTab] = useState<(typeof TOOL_TABS)[number]>("core");
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    api.me().then((data) => {
      if (!data.user) return navigate("/login");
      setUser(data.user);
    });
    api.lessons().then((data) => setLessons(Array.isArray(data) ? data.slice(0, 3) : []));
    api.flashcardsDueCount().then((res: { count: number }) => setDueCount(res.count)).catch(() => {});
  }, [navigate]);

  const continueLesson = lessons?.find((l) => l.status === "active") || lessons?.[0];

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-9">
      <header className="mb-5">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight">{t("home.greeting")}{user?.name ? `, ${user.name}` : ""} <span aria-hidden="true">👋</span></h1>
        <p className="mt-1 text-sm text-fg-muted">{t("home.subtitle")}</p>
      </header>

      <Card tone="primary" className="relative mb-5 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between text-sm font-medium text-white/90">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-base">🔥</span> {t("home.streakDays", { n: user?.streak ?? 0 })}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-base text-yellow-300">⭐</span> {user?.xp ?? 0} XP
          </span>
        </div>
        {continueLesson ? (
          <div className="relative z-10 mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{t("home.continueLearning")}</div>
            <div className="mt-0.5 text-xl font-black">{continueLesson.title}</div>
            <Link
              to={`/lesson?id=${continueLesson.id}`}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-primary transition-transform hover:scale-105 no-underline active:scale-95"
            >
              {t("home.continueButton")}
              <AlphabetIcon size={16} />
            </Link>
          </div>
        ) : (
          !lessons && (
            <div className="mt-3">
              <LoadingState />
            </div>
          )
        )}
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-base font-bold tracking-tight">{t("home.lessonsTitle")}</h2>
        <Link to="/lessons" className="text-sm font-bold text-primary transition-opacity hover:opacity-80 no-underline">
          {t("home.viewAll")}
        </Link>
      </div>

      <div className="mb-7 flex items-center gap-3 overflow-x-auto pb-3">
        {(lessons || []).map((l) => (
          <Link
            key={l.id}
            to={`/lesson?id=${l.id}`}
            className="group w-44 shrink-0 rounded-ui border border-border bg-surface p-4 transition-all hover:border-primary/50 hover:shadow-md no-underline"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-ui bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <BookIcon size={20} />
            </div>
            <div className="mt-3 truncate text-sm font-bold text-fg">{l.title}</div>
            <div className="mt-1 text-[10px] font-medium text-fg-muted uppercase tracking-wider">Lesson {l.id}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-base font-bold tracking-tight">{t("home.toolsTitle")}</h2>
      <Tabs
        className="mb-4"
        items={TOOL_TABS.map((id) => ({ id, label: t(`home.toolTab.${id}`) }))}
        active={toolTab}
        onChange={(id) => setToolTab(id as (typeof TOOL_TABS)[number])}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TOOL_KEYS.filter((tool) => tool.tab === toolTab).map((tool) => {
          const Icon = tool.icon;
          return (
            <Link 
              key={tool.key} 
              to={tool.to} 
              className="group flex flex-col items-center rounded-ui border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-sm no-underline"
            >
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-ui ${tool.color} group-hover:scale-110 transition-transform`}>
                {tool.key === "flashcards" && dueCount > 0 && (
                  <span
                    title={t("flashcards.dueBadge", { n: dueCount })}
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
                  >
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </div>
              <div className="mt-3 text-center text-sm font-bold text-fg leading-tight">{t(`home.tool.${tool.key}`)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
