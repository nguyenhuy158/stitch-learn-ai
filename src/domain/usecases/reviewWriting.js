import { ValidationError } from "../errors.js";
import { recordLearningActivity } from "./recordLearningActivity.js";

export async function reviewWriting({ userId, text }, { writingReviewerPort, userRepository }) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new ValidationError("Vui lòng nhập đoạn văn cần sửa");
  if (trimmed.length > 2000) throw new ValidationError("Đoạn văn quá dài (tối đa 2000 ký tự)");
  const result = await writingReviewerPort.review({ text: trimmed });
  await userRepository.incrementXp(userId, 5);
  await recordLearningActivity({ userId }, { userRepository });
  return result;
}
