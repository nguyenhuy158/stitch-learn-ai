import { ValidationError } from "../errors.js";
import { recordLearningActivity } from "./recordLearningActivity.js";
import { localDate } from "../streak.js";

export async function reviewWriting({ userId, text }, { writingReviewerPort, userRepository }, now = new Date()) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new ValidationError("Vui lòng nhập đoạn văn cần sửa");
  if (trimmed.length > 2000) throw new ValidationError("Đoạn văn quá dài (tối đa 2000 ký tự)");
  const user = await userRepository.findById(userId);
  const result = await writingReviewerPort.review({ text: trimmed, config: user?.gemini_config });
  await userRepository.incrementXp(userId, 5, localDate(now));
  await recordLearningActivity({ userId }, { userRepository }, now);
  return result;
}
