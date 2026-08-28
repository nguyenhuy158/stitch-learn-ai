import { ValidationError } from "../errors.js";
import { normalizeAiConfig } from "../aiConfig.js";

const ALLOWED_FIELDS = ["name", "language", "tts_provider", "gemini_config", "flashcard_audio", "flashcard_session_size"];

export async function updateProfile({ userId, fields }, { userRepository }) {
  const updates = {};
  for (const key of ALLOWED_FIELDS) {
    if (fields[key] !== undefined) {
      // gemini_config den thang tu client nen phai loc qua allowlist truoc khi luu.
      updates[key] = key === "gemini_config" ? JSON.stringify(normalizeAiConfig(fields[key])) : fields[key];
    }
  }
  if (Object.keys(updates).length === 0) throw new ValidationError("No fields to update");
  await userRepository.updateProfile(userId, updates);
}
