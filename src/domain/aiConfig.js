/**
 * Cau hinh AI cua tung nguoi dung (chon model + ngon ngu giai thich).
 *
 * Luu trong cot JSON `gemini_config` co san nen khong can migration. Danh sach
 * model la allowlist: client gui len gi cung phai nam trong day, khong thi
 * rot ve mac dinh — khong de nguoi dung goi model tuy y bang binding cua minh.
 *
 * Chi lay tu cac model Workers AI co ho tro JSON mode (response_format
 * json_schema), vi toan bo Mochi client phu thuoc vao no.
 */
export const AI_MODELS = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.1-70b-instruct",
  "@cf/meta/llama-3.1-8b-instruct-fast"
];

export const EXPLAIN_LANGS = ["vi", "en"];

export const DEFAULT_AI_CONFIG = { model: AI_MODELS[0], explainLang: "vi" };

/** Ten ngon ngu de nhet thang vao prompt. */
export function explainLanguageName(explainLang) {
  return explainLang === "en" ? "English" : "Vietnamese";
}

/**
 * Nhan object hoac chuoi JSON (nhu doc tu D1) va tra ve cau hinh hop le.
 * @returns {{model: string, explainLang: string}}
 */
export function normalizeAiConfig(raw) {
  let cfg = raw;
  if (typeof cfg === "string") {
    try {
      cfg = JSON.parse(cfg);
    } catch {
      cfg = null;
    }
  }
  if (!cfg || typeof cfg !== "object") cfg = {};
  return {
    model: AI_MODELS.includes(cfg.model) ? cfg.model : DEFAULT_AI_CONFIG.model,
    explainLang: EXPLAIN_LANGS.includes(cfg.explainLang) ? cfg.explainLang : DEFAULT_AI_CONFIG.explainLang
  };
}
