import { ValidationError } from "./errors.js";

/**
 * conversation_id do client tu sinh (uuid) nen phai chan lai: chi cho chu, so,
 * gach ngang, gach duoi va toi da 64 ky tu.
 */
export function assertConversationId(id) {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    throw new ValidationError("Cuộc trò chuyện không hợp lệ");
  }
  return id;
}
