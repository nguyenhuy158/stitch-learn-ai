import { localDate } from "../streak.js";

function reminderHtml(user) {
  const streakLine =
    user.streak > 0
      ? `Bạn đang giữ chuỗi <b>${user.streak} ngày</b> — đừng để đứt hôm nay nhé!`
      : `Hôm nay chưa học gì cả, ghé qua 5 phút cũng được.`;
  return `<p>Chào ${user.name || "bạn"},</p><p>${streakLine}</p><p><a href="https://en.huyab.click/challenge">Làm thử thách hôm nay →</a></p>`;
}

/**
 * Cron entry point: emails everyone with no activity_days row for today yet.
 * Best-effort per user — one failed send (bad address, mailer hiccup) must
 * not stop the rest of the batch.
 */
export async function sendStreakReminders(_input, { userRepository, mailerPort }, now = new Date()) {
  const day = localDate(now);
  const inactive = await userRepository.listInactiveToday(day);

  let sent = 0;
  for (const user of inactive) {
    try {
      await mailerPort.send({
        to: user.email,
        subject: user.streak > 0 ? `Giữ chuỗi ${user.streak} ngày của bạn!` : "Học tiếng Anh 5 phút hôm nay?",
        html: reminderHtml(user)
      });
      sent++;
    } catch (error) {
      console.error(`Failed to send streak reminder to ${user.email}:`, error);
    }
  }

  return { checked: inactive.length, sent };
}
