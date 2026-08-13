import { ValidationError } from "../errors.js";
import { recordLearningActivity } from "./recordLearningActivity.js";
import { localDate } from "../streak.js";

export async function reviewTranslation(
  { userId, vietnamese, translation },
  { translationExercisePort, userRepository },
  now = new Date()
) {
  const trimmedSentence = (vietnamese || "").trim();
  const trimmedTranslation = (translation || "").trim();
  if (!trimmedSentence) throw new ValidationError("Thiếu câu tiếng Việt cần dịch");
  if (!trimmedTranslation) throw new ValidationError("Vui lòng nhập bản dịch");
  if (trimmedTranslation.length > 500) throw new ValidationError("Bản dịch quá dài (tối đa 500 ký tự)");
  const result = await translationExercisePort.review({ vietnamese: trimmedSentence, translation: trimmedTranslation });
  await userRepository.incrementXp(userId, 5, localDate(now));
  await recordLearningActivity({ userId }, { userRepository }, now);
  return result;
}
