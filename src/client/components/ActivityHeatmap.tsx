import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../ui/Card";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

const WEEKS = 20;

/* YYYY-MM-DD theo gio may nguoi dung — khop voi localDate() phia server (VN),
   khong dung toISOString vi buoi toi VN da sang ngay UTC hom sau. */
function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Heatmap hoat dong kieu GitHub: 20 tuan x 7 ngay + vai so tong.
 * Du lieu tu /api/stats (activity_days).
 */
export function ActivityHeatmap() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<{ days: string[]; daysLearned: number; savedWords: number; dueWords: number } | null>(null);

  useEffect(() => {
    api.learningStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  const active = new Set(stats.days);
  const today = new Date();
  // Bat dau tu Chu nhat cua (WEEKS-1) tuan truoc de cot cuoi la tuan hien tai
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      return date;
    })
  );

  return (
    <>
      <div className="mb-2 text-sm font-bold text-fg-muted">{t("stats.title")}</div>
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {(
            [
              [stats.daysLearned, t("stats.daysLearned")],
              [stats.savedWords, t("stats.savedWords")],
              [stats.dueWords, t("stats.dueWords")]
            ] as const
          ).map(([n, label]) => (
            <div key={label}>
              <div className="text-lg font-extrabold text-primary">{n}</div>
              <div className="text-xs text-fg-muted">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex justify-center gap-[3px]" role="img" aria-label={t("stats.heatmapHint")}>
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((date) => {
                  const key = isoDay(date);
                  const future = date > today;
                  return (
                    <div
                      key={key}
                      title={`${date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}`}
                      className={cn(
                        "h-3 w-3 rounded-[3px]",
                        future ? "opacity-0" : active.has(key) ? "bg-primary" : "bg-surface-muted"
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] text-fg-muted">{t("stats.heatmapHint")}</div>
      </Card>
    </>
  );
}
