import { ValidationError } from "../errors.js";

export async function submitFeedback({ userId, message }, { feedbackRepository }) {
  const trimmed = (message || "").trim();
  if (!trimmed) throw new ValidationError("Vui lòng nhập nội dung phản hồi");
  if (trimmed.length > 1000) throw new ValidationError("Phản hồi quá dài (tối đa 1000 ký tự)");
  await feedbackRepository.create(userId, trimmed);
}
