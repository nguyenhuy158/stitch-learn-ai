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

  rankings: () => request("/api/rankings"),
  weeklyRankings: () => request("/api/rankings/weekly"),

  dailyChallenge: () => request("/api/challenge/today"),
  completeDailyChallenge: (score) => request("/api/challenge/complete", { method: "POST", body: JSON.stringify({ score }) }),

  wordGameRound: (difficulty) => request(`/api/game/round?difficulty=${difficulty}`),
  wordPool: (count) => request(`/api/game/words?count=${count}`),
  submitGameScore: (game, score) => request(`/api/games/${game}/score`, { method: "POST", body: JSON.stringify({ score }) }),
  gameLeaderboard: (game) => request(`/api/games/${game}/leaderboard`),

  reviewWriting: (text) => request("/api/writing/review", { method: "POST", body: JSON.stringify({ text }) }),

  sendFeedback: (message) => request("/api/feedback", { method: "POST", body: JSON.stringify({ message }) }),

  chatHistory: () => request("/api/chat/history"),
  sendChat: (message) => request("/api/chat", { method: "POST", body: JSON.stringify({ message }) }),
};
