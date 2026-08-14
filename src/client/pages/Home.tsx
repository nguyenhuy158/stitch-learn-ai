import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../ui/Spinner";
import { Card } from "../ui/Card";
import { Tabs } from "../ui/Tabs";
import { BookIcon, TutorIcon, CardsIcon, TargetIcon, MistakeIcon, GameIcon, SpeakerIcon, PuzzleIcon, KeyboardIcon, RainIcon, MedalIcon, TrophyIcon, ImageIcon, AlphabetIcon, SearchIcon, StarIcon, TranslateIcon } from "../components/icons";
import { useLanguage } from "../i18n/LanguageProvider";

type Lesson = { id: number; title: string; sub_title?: string; status?: string };

const TOOL_TABS = ["core", "games", "vocab"] as const;

const TOOL_KEYS = [
  { key: "tutor", to: "/chat", icon: TutorIcon, tab: "core", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
  { key: "flashcards", to: "/flashcards", icon: CardsIcon, tab: "core", color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
  { key: "challenge", to: "/challenge", icon: TargetIcon, tab: "core", color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
  { key: "mistakes", to: "/mistakes", icon: MistakeIcon, tab: "core", color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20" },
  { key: "translation", to: "/translation", icon: TranslateIcon, tab: "core", color: "text-sky-500 bg-sky-50 dark:bg-sky-900/20" },
  { key: "wordGame", to: "/word-game", icon: GameIcon, tab: "games", color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
  { key: "listeningGame", to: "/listening-game", icon: SpeakerIcon, tab: "games", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" },
  { key: "matchingGame", to: "/matching-game", icon: PuzzleIcon, tab: "games", color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20" },
  { key: "spellingGame", to: "/spelling-game", icon: KeyboardIcon, tab: "games", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20" },
  { key: "wordRace", to: "/word-race", icon: RainIcon, tab: "games", color: "text-sky-500 bg-sky-50 dark:bg-sky-900/20" },
  { key: "gamesLeaderboard", to: "/games-leaderboard", icon: MedalIcon, tab: "games", color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" },
  { key: "rankings", to: "/rankings", icon: TrophyIcon, tab: "games", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  { key: "pictureVocab", to: "/picture-vocab", icon: ImageIcon, tab: "vocab", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
  { key: "ipaChart", to: "/ipa-chart", icon: AlphabetIcon, tab: "vocab", color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20" },
  { key: "ipaTranscribe", to: "/ipa-transcribe", icon: SearchIcon, tab: "vocab", color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20" },
  { key: "saved", to: "/saved", icon: StarIcon, tab: "vocab", color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
] as const;

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [toolTab, setToolTab] = useState<(typeof TOOL_TABS)[number]>("core");

  useEffect(() => {
    api.me().then((data) => {
      if (!data.user) return navigate("/login");
      setUser(data.user);
    });
    api.lessons().then((data) => setLessons(Array.isArray(data) ? data.slice(0, 3) : []));
  }, [navigate]);

  const continueLesson = lessons?.find((l) => l.status === "active") || lessons?.[0];

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-9">
      <header className="mb-5">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight">{t("home.greeting")}{user?.name ? `, ${user.name}` : ""} 👋</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("home.subtitle")}</p>
      </header>

      <Card tone="primary" className="relative mb-5 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between text-sm font-medium text-white/90">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🔥</span> {t("home.streakDays", { n: user?.streak ?? 0 })}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base text-yellow-300">⭐</span> {user?.xp ?? 0} XP
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
              <Spinner size={16} />
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
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tool.color} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <div className="mt-3 text-center text-sm font-bold text-fg leading-tight">{t(`home.tool.${tool.key}`)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
