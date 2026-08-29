/**
 * Thin fetch helpers over the real Worker API (src/adapters/http/router.js).
 * Auth is cookie-based (httpOnly auth_token) -> every call needs credentials:'include'.
 */

const UNAUTHORIZED = Symbol("unauthorized");

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err[UNAUTHORIZED] = true;
    throw err;
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Lỗi ${res.status}`);
  }
  return data;
}

export function isUnauthorized(err) {
  return !!(err && err[UNAUTHORIZED]);
}

export const api = {
  me: () => request("/api/auth/me"),
  logout: () => {
    window.location.href = "/api/auth/logout";
  },
  loginWithGoogle: () => {
    window.location.href = "/api/auth/google";
  },
  updateProfile: (fields) => request("/api/user/update", { method: "POST", body: JSON.stringify(fields) }),

  lessons: () => request("/api/lessons"),
  lessonDetail: (id) => request(`/api/lessons/${id}`),

  vocab: () => request("/api/vocab"),
  savedVocab: () => request("/api/vocab/saved"),
  saveVocab: (id, save) => request(`/api/vocab/${id}/save`, { method: "POST", body: JSON.stringify({ save }) }),
  reviewVocab: (id, quality) => request(`/api/vocab/${id}/review`, { method: "POST", body: JSON.stringify({ quality }) }),

  lookupWord: (term, context) =>
    request(`/api/word/lookup?term=${encodeURIComponent(term)}${context ? `&context=${encodeURIComponent(context)}` : ""}`),
  saveLookedUpWord: (word) => request("/api/word/save", { method: "POST", body: JSON.stringify(word) }),
  isWordSaved: (term) => request(`/api/word/saved?term=${encodeURIComponent(term)}`),
  wordExamples: (term) => request(`/api/word/examples?term=${encodeURIComponent(term)}`),

  rankings: () => request("/api/rankings"),
  weeklyRankings: () => request("/api/rankings/weekly"),

  dailyChallenge: () => request("/api/challenge/today"),
  completeDailyChallenge: (score) => request("/api/challenge/complete", { method: "POST", body: JSON.stringify({ score }) }),

  wordGameRound: (difficulty) => request(`/api/game/round?difficulty=${difficulty}`),
  wordPool: (count, difficulty) =>
    request(`/api/game/words?count=${count}${difficulty ? `&difficulty=${difficulty}` : ""}`),
  submitGameScore: (game, score, correct = 0) =>
    request(`/api/games/${game}/score`, { method: "POST", body: JSON.stringify({ score, correct }) }),
  gameLeaderboard: (game) => request(`/api/games/${game}/leaderboard`),

  pictureVocab: (topic) => request(`/api/picture-vocab${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`),

  reviewWriting: (text) => request("/api/writing/review", { method: "POST", body: JSON.stringify({ text }) }),
  readingStories: () => request("/api/reading"),
  readingArticle: (guid) => request(`/api/reading/article?g=${encodeURIComponent(guid)}`),
  readingQuiz: (guid) => request(`/api/reading/quiz?g=${encodeURIComponent(guid)}`),
  flashcardsDueCount: () => request("/api/flashcards/due-count"),
  learningStats: () => request("/api/stats"),
  translationExercise: () => request("/api/translation/today"),
  translationHistory: () => request("/api/translation/history"),
  saveRecallAttempt: (attempt) => request("/api/translation/recall/attempt", { method: "POST", body: JSON.stringify(attempt) }),
  translationRecall: (count) => request(`/api/translation/recall?count=${count}`),
  reviewTranslation: (vietnamese, translation) =>
    request("/api/translation/review", { method: "POST", body: JSON.stringify({ vietnamese, translation }) }),

  sendFeedback: (message) => request("/api/feedback", { method: "POST", body: JSON.stringify({ message }) }),

  chatHistory: (conversationId) =>
    request(conversationId ? `/api/chat/history?c=${encodeURIComponent(conversationId)}` : "/api/chat/history"),
  chatConversations: () => request("/api/chat/conversations"),
  sendChat: (message, conversationId) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ message, conversationId }) }),
  clearChat: (conversationId) =>
    request("/api/chat/clear", { method: "POST", body: JSON.stringify({ conversationId }) }),
};
