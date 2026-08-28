export const GAMES = [
  { key: "word-game", label: "Đoán nghĩa từ", to: "/word-game" },
  { key: "listening-game", label: "Nghe đoán từ", to: "/listening-game" },
  { key: "matching-game", label: "Ghép thẻ", to: "/matching-game" },
  { key: "spelling-game", label: "Gõ chữ theo nghĩa", to: "/spelling-game" },
  { key: "word-race", label: "Từ rơi", to: "/word-race" },
  { key: "scramble-game", label: "Xếp chữ", to: "/scramble-game" },
  { key: "translation-recall", label: "Dịch lại câu cũ", to: "/translation-recall" }
] as const;

export type GameKey = (typeof GAMES)[number]["key"];
