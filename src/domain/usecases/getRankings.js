import { localDate, shiftDate } from "../streak.js";

export async function getRankings({ userId }, { userRepository }) {
  const top = await userRepository.listRankings(20);
  const myRank = await userRepository.getRank(userId);
  return { top, myRank };
}

/** Monday-start week containing `now`, ranked by XP earned since then (xp_events, not the all-time total). */
export async function getWeeklyRankings({ userId }, { userRepository }, now = new Date()) {
  const today = localDate(now);
  const mondayOffset = (new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7;
  const monday = shiftDate(today, -mondayOffset);

  const top = await userRepository.listWeeklyRankings(monday, 20);
  const myRow = top.find((u) => u.id === userId);
  return { top, myRank: myRow ? top.indexOf(myRow) + 1 : null, since: monday };
}
