import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Spinner } from "../ui/Spinner";
import { Card } from "../ui/Card";
import { Tabs } from "../ui/Tabs";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

type RankUser = { id: number; name?: string; streak?: number; xp?: number; weekly_xp?: number };
type Board = "all" | "weekly";

export default function Rankings() {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>("all");
  const [myId, setMyId] = useState<number | null>(null);
  const [data, setData] = useState<Record<Board, { top: RankUser[]; myRank: number | null } | null>>({
    all: null,
    weekly: null
  });
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    api.me().then((me) => setMyId(me.user?.id ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (data[board]) return;
    const load = board === "all" ? api.rankings() : api.weeklyRankings();
    load
      .then((rank) => setData((prev) => ({ ...prev, [board]: { top: rank.top || [], myRank: rank.myRank ?? null } })))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(t("rankings.loadError") + err.message);
      });
  }, [board, data, navigate, t]);

  const current = data[board];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backTo="/" title={t("rankings.title")} />
      <main className="p-5 sm:p-9">
        <Tabs
          className="mb-5"
          variant="pill"
          items={[
            { id: "all", label: t("rankings.allTime") },
            { id: "weekly", label: t("rankings.weekly") }
          ]}
          active={board}
          onChange={(id) => setBoard(id as Board)}
        />

        {error && <PageState tone="error">{error}</PageState>}
        {!error && current === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && current && (
          <>
            {current.myRank && !current.top.some((u) => u.id === myId) && (
              <Card tone="primary" className="mb-5 text-center font-bold">
                {t("rankings.yourRank")}: #{current.myRank}
              </Card>
            )}
            {current.top.length === 0 && (
              <PageState>{board === "weekly" ? t("rankings.emptyWeekly") : t("rankings.emptyAll")}</PageState>
            )}
            <div className="flex flex-col gap-2">
              {current.top.map((u, i) => (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-center gap-3 rounded-ui bg-surface p-3 shadow-sm",
                    u.id === myId && "border-2 border-primary"
                  )}
                >
                  <div className="w-7 text-center font-extrabold text-primary-hover">#{i + 1}</div>
                  <div className="flex-1 font-semibold">
                    {u.name || t("common.anonymous")}
                    {u.id === myId ? ` (${t("common.you")})` : ""}
                    <div className="text-xs text-fg-muted">{t("rankings.streak", { n: u.streak || 0 })}</div>
                  </div>
                  <div className="font-bold text-accent">{board === "weekly" ? u.weekly_xp || 0 : u.xp || 0} XP</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
