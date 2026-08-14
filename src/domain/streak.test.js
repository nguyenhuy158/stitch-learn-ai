import { test } from "node:test";
import assert from "node:assert/strict";
import { shiftDate, previousDate, computeStreak, weekProgress } from "./streak.js";

test("shiftDate steps calendar days, crossing month/year boundaries", () => {
  assert.equal(shiftDate("2026-08-14", -1), "2026-08-13");
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(previousDate("2026-08-14"), "2026-08-13");
});

test("computeStreak: 0 when neither today nor yesterday is active", () => {
  assert.equal(computeStreak(["2026-08-10"], "2026-08-14"), 0);
  assert.equal(computeStreak([], "2026-08-14"), 0);
});

test("computeStreak: counts consecutive days ending today", () => {
  const days = ["2026-08-12", "2026-08-13", "2026-08-14"];
  assert.equal(computeStreak(days, "2026-08-14"), 3);
});

test("computeStreak: stays alive on today if only studied through yesterday", () => {
  const days = ["2026-08-12", "2026-08-13"];
  assert.equal(computeStreak(days, "2026-08-14"), 2);
});

test("computeStreak: a gap breaks the streak", () => {
  const days = ["2026-08-10", "2026-08-13", "2026-08-14"];
  assert.equal(computeStreak(days, "2026-08-14"), 2);
});

test("weekProgress: Monday-first row with done/isToday/future flags", () => {
  // 2026-08-14 is a Friday.
  const week = weekProgress(["2026-08-10", "2026-08-14"], "2026-08-14");
  assert.equal(week.length, 7);
  assert.equal(week[0].day, "2026-08-10");
  assert.equal(week[0].done, true);
  assert.equal(week[4].day, "2026-08-14");
  assert.equal(week[4].isToday, true);
  assert.equal(week[4].future, false);
  assert.equal(week[5].future, true);
  assert.equal(week[5].done, false);
});
