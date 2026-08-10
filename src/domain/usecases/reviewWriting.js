import { ValidationError } from "../errors.js";

export async function reviewWriting({ text }, { writingReviewerPort }) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new ValidationError("Vui lòng nhập đoạn văn cần sửa");
  if (trimmed.length > 2000) throw new ValidationError("Đoạn văn quá dài (tối đa 2000 ký tự)");
  return writingReviewerPort.review({ text: trimmed });
}
