import { ValidationError } from "../errors.js";

/** Mot vong choi "Dich lai": cac cau nguoi hoc tung dich, cham offline nen khong goi AI. */
export async function getTranslationRecallRound({ userId, count }, { translationRepository }) {
  const size = Math.min(20, Math.max(1, Math.floor(Number(count) || 5)));
  const sentences = await translationRepository.pickAttemptsForReview(userId, size);
  if (sentences.length === 0) throw new ValidationError("Bạn chưa dịch câu nào, hãy vào Dịch câu trước đã");
  return { sentences };
}
