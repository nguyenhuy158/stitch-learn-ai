import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Spinner } from "../ui/Spinner";
import { Tabs } from "../ui/Tabs";
import { cn } from "../ui/cn";
import { GAMES, type GameKey } from "../lib/games";
import { useLanguage } from "../i18n/LanguageProvider";

type Row = { user_id: string; name?: string; best: number };
type Board = { top: Row[]; myBest: number; myRank: number | null };

export default function GamesLeaderboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [game, setGame] = useState<GameKey>(GAMES[0].key);
  const [myId, setMyId] = useState<string | null>(null);
  const [data, setData] = useState<Partial<Record<GameKey, Board>>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    api.me().then((me) => setMyId(me.user?.id ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (data[game]) return;
    api
      .gameLeaderboard(game)
      .then((res: Board) => setData((prev) => ({ ...prev, [game]: res })))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [game, data, navigate]);

  const current = data[game];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backTo="/" title={t("gamesLeaderboard.title")} />
      <main className="p-5 sm:p-9">
        <Tabs
          className="mb-5"
          variant="pill"
          items={GAMES.map((g) => ({ id: g.key, label: t(`game.${g.key}.label`) }))}
          active={game}
          onChange={(id) => setGame(id as GameKey)}
        />

        {error && <PageState tone="error">{error}</PageState>}
        {!error && current === undefined && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && current && (
          <>
            <div className="mb-5 rounded-ui bg-primary-hover p-3.5 text-center font-bold text-white">
              {t("gamesLeaderboard.yourBest")}: {current.myBest}
              {current.myRank ? ` — ${t("gamesLeaderboard.rank")} #${current.myRank}` : ""}
            </div>
            {current.top.length === 0 && (
              <PageState>{t("gamesLeaderboard.empty")}</PageState>
            )}
            <div className="flex flex-col gap-2">
              {current.top.map((row, i) => (
                <div
                  key={row.user_id}
                  className={cn(
                    "flex items-center gap-3 rounded-ui bg-surface p-3 shadow-sm",
                    row.user_id === myId && "border-2 border-primary"
                  )}
                >
                  <div className="w-7 text-center font-extrabold text-primary-hover">#{i + 1}</div>
                  <div className="flex-1 font-semibold">
                    {row.name || t("common.anonymous")}
                    {row.user_id === myId ? ` (${t("common.you")})` : ""}
                  </div>
                  <div className="font-bold text-accent">{row.best}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
