import { localDate } from "../streak.js";

/**
 * Thong ke hoc tap cho trang Profile: danh sach ngay co hoat dong (ve heatmap
 * 20 tuan) + vai con so tong.
 */
export async function getLearningStats({ userId }, { userRepository, savedVocabRepository, vocabReviewRepository }, now = new Date()) {
  const [days, savedWords, dueWords] = await Promise.all([
    userRepository.listActivityDays(userId, 400),
    savedVocabRepository.countForUser(userId),
    vocabReviewRepository.countDue(userId, localDate(now))
  ]);
  return { days, daysLearned: days.length, savedWords, dueWords };
}
