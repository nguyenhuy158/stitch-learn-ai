import { ValidationError } from "../../domain/errors.js";
import { listLessons } from "../../domain/usecases/listLessons.js";
import { startSsoLogin } from "../../domain/usecases/startSsoLogin.js";
import { getCurrentUser } from "../../domain/usecases/getCurrentUser.js";
import { updateProfile } from "../../domain/usecases/updateProfile.js";
import { sendChatMessage } from "../../domain/usecases/sendChatMessage.js";
import { getChatHistory } from "../../domain/usecases/getChatHistory.js";
import { clearChatHistory } from "../../domain/usecases/clearChatHistory.js";
import { getLessonDetail } from "../../domain/usecases/getLessonDetail.js";
import { reviewWriting } from "../../domain/usecases/reviewWriting.js";
import { getTranslationExercise } from "../../domain/usecases/getTranslationExercise.js";
import { reviewTranslation } from "../../domain/usecases/reviewTranslation.js";
import { submitFeedback } from "../../domain/usecases/submitFeedback.js";
import { getFlashcards } from "../../domain/usecases/getFlashcards.js";
import { reviewVocab } from "../../domain/usecases/reviewVocab.js";
import { getDailyChallenge } from "../../domain/usecases/getDailyChallenge.js";
import { completeDailyChallenge } from "../../domain/usecases/completeDailyChallenge.js";
import { toggleSavedVocab } from "../../domain/usecases/toggleSavedVocab.js";
import { getSavedVocab } from "../../domain/usecases/getSavedVocab.js";
import { getRankings, getWeeklyRankings } from "../../domain/usecases/getRankings.js";
import { getWordGameRound } from "../../domain/usecases/getWordGameRound.js";
import { getWordPool, DIFFICULTY_LEVELS } from "../../domain/usecases/getWordPool.js";
import { submitGameScore } from "../../domain/usecases/submitGameScore.js";
import { getGameLeaderboard } from "../../domain/usecases/getGameLeaderboard.js";
import { getPictureVocab } from "../../domain/usecases/getPictureVocab.js";
import { KNOWN_IMAGE_KEYS } from "../../data/pictureVocab.js";
import { parseCookie, buildAuthCookie, buildLogoutCookie } from "./cookies.js";
import { BUILD_INFO } from "../../shared/build-info.generated.js";

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) }
  });
}

/** Never let password_hash/salt leave this Worker, even indirectly via SELECT *. */
function sanitizeUser(user) {
  if (!user) return user;
  const { password_hash, salt, ...safe } = user;
  return safe;
}

/**
 * Goi chung pattern lap lai o gan het route can login: doc cookie auth_token,
 * verify session, roi bat loi chung. `handler` nhan (userId, request, url, deps)
 * va tra ve Response. Moi route van giu duoc status/message rieng qua opts.
 */
function requireAuth(handler, { label, fallbackMessage = "Request failed", validationStatus = 400, passthroughMessage = false } = {}) {
  return async (request, url, deps) => {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id: userId } = await deps.sessionPort.verify(authToken);
      return await handler(userId, request, url, deps);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: validationStatus });
      if (label) console.error(label, error);
      return json({ error: passthroughMessage ? error.message : fallbackMessage }, { status: 500 });
    }
  };
}

/** Returns a Response for known API routes, or null if the request should fall through to static assets. */
export async function handleRequest(request, url, deps) {
  const isSecure = url.protocol === "https:";

  if (url.pathname === "/api/version") {
    return json(BUILD_INFO);
  }

  if (url.pathname === "/api/picture-vocab") {
    const topic = url.searchParams.get("topic");
    const result = await getPictureVocab({ topic });
    if (!result) return json({ error: "Topic not found" }, { status: 404 });
    return json(result, { headers: { "Cache-Control": "public, max-age=3600" } });
  }

  const imageMatch = url.pathname.match(/^\/api\/vocab-image\/(.+)$/);
  if (imageMatch) {
    // Only keys that appear in our bundled vocab data — otherwise this route
    // would let anyone read arbitrary objects out of the bucket.
    const key = decodeURIComponent(imageMatch[1]);
    if (!KNOWN_IMAGE_KEYS.has(key)) return new Response("Not found", { status: 404 });
    const image = await deps.vocabImagePort.get(key);
    if (!image) return new Response("Not found", { status: 404 });
    return new Response(image.body, {
      headers: {
        "Content-Type": image.contentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: image.httpEtag
      }
    });
  }

  if (url.pathname === "/api/lessons") {
    try {
      return json(await listLessons(deps));
    } catch (error) {
      return json({ error: error.message }, { status: 500 });
    }
  }

  const lessonMatch = url.pathname.match(/^\/api\/lessons\/(\d+)$/);
  if (lessonMatch) {
    // Generating vocab costs a real Mochi call — require a session so this
    // can't be hit anonymously in a loop to run up the API bill.
    return requireAuth(async (userId) => {
      const detail = await getLessonDetail({ lessonId: Number(lessonMatch[1]), userId }, deps);
      return json(detail);
    }, { label: "Lesson detail error:", fallbackMessage: "Failed to load lesson", validationStatus: 404 })(request, url, deps);
  }

  if (url.pathname === "/api/vocab" && request.method === "GET") {
    return requireAuth(async (userId) => json(await getFlashcards({ userId }, deps)), {
      label: "Flashcards error:",
      fallbackMessage: "Failed to load flashcards"
    })(request, url, deps);
  }

  const reviewVocabMatch = url.pathname.match(/^\/api\/vocab\/(\d+)\/review$/);
  if (reviewVocabMatch && request.method === "POST") {
    return requireAuth(async (userId) => {
      const { quality } = await request.json();
      const result = await reviewVocab({ userId, vocabId: Number(reviewVocabMatch[1]), quality }, deps);
      return json(result);
    }, { label: "Review vocab error:", fallbackMessage: "Failed to record review" })(request, url, deps);
  }

  if (url.pathname === "/api/vocab/saved" && request.method === "GET") {
    return requireAuth(async (userId) => json(await getSavedVocab({ userId }, deps)), {
      label: "Saved vocab error:",
      fallbackMessage: "Failed to load saved vocab"
    })(request, url, deps);
  }

  const saveVocabMatch = url.pathname.match(/^\/api\/vocab\/(\d+)\/save$/);
  if (saveVocabMatch && request.method === "POST") {
    return requireAuth(async (userId) => {
      const body = await request.json().catch(() => ({}));
      await toggleSavedVocab({ userId, vocabId: Number(saveVocabMatch[1]), save: body.save !== false }, deps);
      return json({ success: true });
    }, { label: "Toggle saved vocab error:", fallbackMessage: "Failed to update saved vocab" })(request, url, deps);
  }

  if (url.pathname === "/api/challenge/today" && request.method === "GET") {
    return requireAuth(async (userId) => json(await getDailyChallenge({ userId }, deps)), {
      label: "Daily challenge error:",
      fallbackMessage: "Failed to load daily challenge"
    })(request, url, deps);
  }

  if (url.pathname === "/api/challenge/complete" && request.method === "POST") {
    return requireAuth(async (userId) => {
      const { score } = await request.json();
      const result = await completeDailyChallenge({ userId, score }, deps);
      return json(result);
    }, { label: "Complete daily challenge error:", fallbackMessage: "Failed to complete daily challenge" })(request, url, deps);
  }

  if (url.pathname === "/api/rankings" && request.method === "GET") {
    return requireAuth(async (userId) => json(await getRankings({ userId }, deps)), {
      label: "Rankings error:",
      fallbackMessage: "Failed to load rankings"
    })(request, url, deps);
  }

  if (url.pathname === "/api/rankings/weekly" && request.method === "GET") {
    return requireAuth(async (userId) => json(await getWeeklyRankings({ userId }, deps)), {
      label: "Weekly rankings error:",
      fallbackMessage: "Failed to load weekly rankings"
    })(request, url, deps);
  }

  if (url.pathname === "/api/game/round" && request.method === "GET") {
    return requireAuth(async () => {
      const difficulty = url.searchParams.get("difficulty") || "easy";
      return json(await getWordGameRound({ difficulty }, deps));
    }, { label: "Word game round error:", fallbackMessage: "Failed to load game round" })(request, url, deps);
  }

  if (url.pathname === "/api/game/words" && request.method === "GET") {
    return requireAuth(async () => {
      const count = url.searchParams.get("count");
      const levelsParam = url.searchParams.get("levels");
      const difficultyParam = url.searchParams.get("difficulty");
      const levels = levelsParam
        ? levelsParam.split(",").map((l) => l.trim()).filter(Boolean)
        : difficultyParam
          ? DIFFICULTY_LEVELS[difficultyParam]
          : undefined;
      return json(await getWordPool({ count, levels }, deps));
    }, { label: "Word pool error:", fallbackMessage: "Failed to load words" })(request, url, deps);
  }

  const gameScoreMatch = url.pathname.match(/^\/api\/games\/([\w-]+)\/score$/);
  if (gameScoreMatch && request.method === "POST") {
    return requireAuth(async (userId) => {
      const { score, correct } = await request.json();
      const result = await submitGameScore({ userId, game: gameScoreMatch[1], score, correct }, deps);
      return json(result);
    }, { label: "Submit game score error:", fallbackMessage: "Failed to submit score" })(request, url, deps);
  }

  const gameLeaderboardMatch = url.pathname.match(/^\/api\/games\/([\w-]+)\/leaderboard$/);
  if (gameLeaderboardMatch && request.method === "GET") {
    return requireAuth(async (userId) => {
      const result = await getGameLeaderboard({ userId, game: gameLeaderboardMatch[1] }, deps);
      return json(result);
    }, { label: "Game leaderboard error:", fallbackMessage: "Failed to load leaderboard" })(request, url, deps);
  }

  if (url.pathname === "/api/writing/review" && request.method === "POST") {
    // Same reasoning as lesson detail: a real Mochi call, so require a
    // session instead of letting it be hit anonymously in a loop.
    return requireAuth(async (userId) => {
      const { text } = await request.json();
      const result = await reviewWriting({ userId, text }, deps);
      return json(result);
    }, { label: "Writing review error:", fallbackMessage: "Failed to review writing" })(request, url, deps);
  }

  if (url.pathname === "/api/translation/today" && request.method === "GET") {
    return requireAuth(async (userId) => {
      const result = await getTranslationExercise({ userId }, deps);
      return json(result);
    }, { label: "Translation exercise error:", fallbackMessage: "Failed to load translation exercise" })(request, url, deps);
  }

  if (url.pathname === "/api/translation/review" && request.method === "POST") {
    return requireAuth(async (userId) => {
      const { vietnamese, translation } = await request.json();
      const result = await reviewTranslation({ userId, vietnamese, translation }, deps);
      return json(result);
    }, { label: "Translation review error:", fallbackMessage: "Failed to review translation" })(request, url, deps);
  }

  if (url.pathname === "/api/feedback" && request.method === "POST") {
    return requireAuth(async (userId) => {
      const { message } = await request.json();
      await submitFeedback({ userId, message }, deps);
      return json({ success: true });
    }, { label: "Feedback submit error:", fallbackMessage: "Failed to submit feedback" })(request, url, deps);
  }

  if (url.pathname === "/api/auth/google") {
    try {
      const target = startSsoLogin({ ssoIssuer: deps.env.SSO_ISSUER, returnUrl: `${url.origin}/` });
      return Response.redirect(target, 302);
    } catch (error) {
      return new Response(error.message, { status: 503 });
    }
  }

  if (url.pathname === "/api/auth/me") {
    const cookieHeader = request.headers.get("Cookie");
    const authToken = parseCookie(cookieHeader, "auth_token");
    const ssoToken = parseCookie(cookieHeader, "huyab_sso");
    const { user, mintedToken } = await getCurrentUser({ authToken, ssoToken }, deps);
    const headers = mintedToken ? { "Set-Cookie": buildAuthCookie(mintedToken, { secure: isSecure }) } : {};
    return json({ user: sanitizeUser(user) }, { headers });
  }

  if (url.pathname === "/api/user/update" && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const body = await request.json();
      await updateProfile({ userId: id, fields: body }, deps);
      return json({ success: true });
    } catch (error) {
      if (error instanceof ValidationError) return new Response(error.message, { status: 400 });
      return new Response(error.message, { status: 500 });
    }
  }

  if (url.pathname === "/api/auth/logout") {
    // Clearing only the local auth_token isn't enough for SSO sessions: the
    // domain-wide huyab_sso cookie would just re-authenticate the visitor on
    // the very next /api/auth/me call. Only the issuer can clear that cookie.
    const location = deps.env.SSO_ISSUER
      ? `${deps.env.SSO_ISSUER}/logout?redirect_uri=${encodeURIComponent(`${url.origin}/login`)}`
      : "/login";
    return new Response(null, {
      status: 302,
      headers: { Location: location, "Set-Cookie": buildLogoutCookie(isSecure) }
    });
  }

  if (url.pathname === "/api/user/password" && request.method === "POST") {
    // Feature retired: SSO is the only supported way in now. Kept as an
    // explicit response (rather than deleting the route outright) so the
    // still-visible "Thiết lập mật khẩu" menu item in the compiled bundle
    // fails cleanly instead of falling through to the SPA asset fallback.
    return json({ error: "Đổi mật khẩu không còn được hỗ trợ. Đăng nhập bằng Google." }, { status: 410 });
  }

  if (url.pathname === "/api/chat" && request.method === "POST") {
    return requireAuth(async (userId) => {
      const { message } = await request.json();
      const reply = await sendChatMessage({ userId, message }, deps);
      return json(reply);
    }, { label: "Chat API Error:", passthroughMessage: true })(request, url, deps);
  }

  if (url.pathname === "/api/chat/history") {
    return requireAuth(async (userId) => json(await getChatHistory({ userId }, deps)), {
      passthroughMessage: true
    })(request, url, deps);
  }

  if (url.pathname === "/api/chat/clear" && request.method === "POST") {
    return requireAuth(async (userId) => {
      await clearChatHistory({ userId }, deps);
      return json({ success: true });
    }, { label: "Clear chat history error:", fallbackMessage: "Failed to clear chat history" })(request, url, deps);
  }

  return null;
}
