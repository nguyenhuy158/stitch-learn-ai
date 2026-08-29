import { ValidationError } from "../errors.js";

/** Mot vong choi "Dich lai": cac cau nguoi hoc tung dich, cham offline nen khong goi AI. */
export async function getTranslationRecallRound({ userId, count }, { translationRepository }) {
  const size = Math.min(20, Math.max(1, Math.floor(Number(count) || 5)));
  const sentences = await translationRepository.pickAttemptsForReview(userId, size);
  if (sentences.length === 0) throw new ValidationError("Bạn chưa dịch câu nào, hãy vào Dịch câu trước đã");
  return { sentences };
}

/**
 * Luu lan on lai (cham offline) vao chung lich su dich, de trang Dich cau
 * gom nhom moi lan thu cua cung mot cau — ke ca lan thu o cho on lai.
 */
export async function saveRecallAttempt({ userId, vietnamese, translation, corrected, correctionCount }, { translationRepository }) {
  if (!vietnamese?.trim() || !translation?.trim() || !corrected?.trim()) throw new ValidationError("Missing attempt");
  if (vietnamese.length > 500 || translation.length > 500 || corrected.length > 500) throw new ValidationError("Too long");
  await translationRepository.saveAttempt({
    userId,
    vietnamese: vietnamese.trim(),
    translation: translation.trim(),
    corrected: corrected.trim(),
    feedback: "",
    correctionCount: Math.max(0, Math.floor(Number(correctionCount) || 0)),
    createdAt: new Date().toISOString()
  });
}
