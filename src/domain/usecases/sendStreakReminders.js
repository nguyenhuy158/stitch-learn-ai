import { localDate } from "../streak.js";

function reminderHtml(user, dueCount, latestStory) {
  const streakLine =
    user.streak > 0
      ? `Bạn đang giữ chuỗi <b>${user.streak} ngày</b> — đừng để đứt hôm nay nhé!`
      : `Hôm nay chưa học gì cả, ghé qua 5 phút cũng được.`;
  const dueLine =
    dueCount > 0
      ? `<p>Bạn có <b>${dueCount} từ vựng</b> đến hạn ôn — <a href="https://en.huyab.click/flashcards">ôn ngay với thẻ ghi nhớ →</a></p>`
      : "";
  const storyLine = latestStory
    ? `<p>Bài đọc mới nhất: <a href="https://en.huyab.click/reading?g=${encodeURIComponent(latestStory.guid)}"><b>${latestStory.story}</b></a></p>`
    : "";
  return `<p>Chào ${user.name || "bạn"},</p><p>${streakLine}</p>${dueLine}${storyLine}<p><a href="https://en.huyab.click/challenge">Làm thử thách hôm nay →</a></p>`;
}

/**
 * Cron entry point: emails everyone with no activity_days row for today yet.
 * Best-effort per user — one failed send (bad address, mailer hiccup) must
 * not stop the rest of the batch.
 */
export async function sendStreakReminders(
  _input,
  { userRepository, mailerPort, vocabReviewRepository, readingRepository },
  now = new Date()
) {
  const day = localDate(now);
  const inactive = await userRepository.listInactiveToday(day);

  // Bai doc moi nhat dung chung cho ca batch — hong cung khong sao, email van gui.
  const latestStory = await readingRepository
    .listArticles(1)
    .then((a) => a[0] ?? null)
    .catch(() => null);

  let sent = 0;
  for (const user of inactive) {
    try {
      const dueCount = await vocabReviewRepository.countDue(user.id, day).catch(() => 0);
      await mailerPort.send({
        to: user.email,
        subject: user.streak > 0 ? `Giữ chuỗi ${user.streak} ngày của bạn!` : "Học tiếng Anh 5 phút hôm nay?",
        html: reminderHtml(user, dueCount, latestStory)
      });
      sent++;
    } catch (error) {
      console.error(`Failed to send streak reminder to ${user.email}:`, error);
    }
  }

  return { checked: inactive.length, sent };
}
