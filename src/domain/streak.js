/**
 * Streak days are calendar days as the learner experiences them, not as UTC
 * sees them. Workers run in UTC, so a plain `new Date().toISOString()` rolls
 * over at 07:00 Vietnam time: studying at 06:00 one morning and 08:00 the next
 * lands on the same UTC date.
 */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Local calendar date as YYYY-MM-DD. `en-CA` formats exactly that way. */
export function localDate(now = new Date(), timeZone = APP_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

/** Steps `count` calendar days back from a YYYY-MM-DD string. */
export function shiftDate(dateStr, count) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d));
  shifted.setUTCDate(shifted.getUTCDate() + count);
  return shifted.toISOString().split("T")[0];
}

export const previousDate = (dateStr) => shiftDate(dateStr, -1);

/**
 * Consecutive learning days ending today (or yesterday — a streak stays alive
 * until the day after the last one is missed, otherwise it would read 0 all
 * morning until the first lesson of the day).
 */
export function computeStreak(activeDays, today) {
  const days = new Set(activeDays);
  let cursor = days.has(today) ? today : previousDate(today);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDate(cursor);
  }
  return streak;
}

/**
 * The home screen's seven dots, Monday-first, for the week containing `today`.
 * `done` is a day already studied, `today` marks the current dot, and days
 * after today are still upcoming.
 */
export function weekProgress(activeDays, today) {
  const days = new Set(activeDays);
  const [y, m, d] = today.split("-").map(Number);
  // getUTCDay: 0 = Sunday. Shift so Monday = 0, matching the M T W T F S S row.
  const mondayOffset = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const monday = shiftDate(today, -mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = shiftDate(monday, index);
    return {
      day,
      done: days.has(day),
      isToday: day === today,
      future: index > mondayOffset
    };
  });
}
