import { ValidationError } from "../errors.js";

const ALLOWED_FIELDS = ["name", "language", "tts_provider", "gemini_config", "flashcard_audio"];

export async function updateProfile({ userId, fields }, { userRepository }) {
  const updates = {};
  for (const key of ALLOWED_FIELDS) {
    if (fields[key] !== undefined) {
      updates[key] = key === "gemini_config" ? JSON.stringify(fields[key]) : fields[key];
    }
  }
  if (Object.keys(updates).length === 0) throw new ValidationError("No fields to update");
  await userRepository.updateProfile(userId, updates);
}
