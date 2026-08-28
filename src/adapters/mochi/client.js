/**
 * Goi Workers AI (binding env.AI) cho moi tinh nang cua Mochi.
 *
 * Truoc day dung Gemini API truc tiep, nhung tren prod bi 2 loi khong sua duoc
 * bang code: 429 free tier chi 5 request/phut, va 400 "User location is not
 * supported" khi Worker chay o colo Google chan. Workers AI chay trong mang
 * Cloudflare nen khong dinh ca hai.
 *
 * Neu co `gateway` (ten AI Gateway da tao san trong cung account) thi request
 * di qua gateway de co log/cache/rate-limit; khong co thi van chay binh thuong.
 */
export function createMochiClient({ ai, model, gateway }) {
  /**
   * Goi model voi ca doan hoi thoai, ep tra ve JSON dung `schema`.
   * @returns {Promise<any>}
   */
  async function askMessages(messages, schema, { label = "Mochi AI error:" } = {}) {
    let result;
    try {
      result = await ai.run(
        model,
        // max_tokens mac dinh cua Workers AI qua nho: JSON bi cat giua chung roi
        // parse loi (bai chua nhieu correction + giai thich tieng Viet la dinh).
        { messages, max_tokens: 2048, response_format: { type: "json_schema", json_schema: schema } },
        gateway ? { gateway: { id: gateway } } : undefined
      );
    } catch (err) {
      console.error(label, err?.message || String(err));
      throw new Error("Failed to call AI");
    }
    const raw = result?.response;
    if (raw == null || raw === "") throw new Error("Empty response from AI");
    // JSON mode thuong tra object san, nhung mot so model van tra ve string.
    if (typeof raw !== "string") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      console.error(label, "khong parse duoc JSON:", raw.slice(0, 500));
      throw new Error("Malformed AI response");
    }
  }

  /** Truong hop pho bien: chi 1 prompt, khong co lich su. */
  function askJson(prompt, schema, opts) {
    return askMessages([{ role: "user", content: prompt }], schema, opts);
  }

  return { askMessages, askJson };
}
