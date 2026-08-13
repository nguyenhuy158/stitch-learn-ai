import { ValidationError, AuthError } from "../../domain/errors.js";
import { listLessons } from "../../domain/usecases/listLessons.js";
import { startSsoLogin } from "../../domain/usecases/startSsoLogin.js";
import { getCurrentUser } from "../../domain/usecases/getCurrentUser.js";
import { updateProfile } from "../../domain/usecases/updateProfile.js";
import { loginWithPassword } from "../../domain/usecases/loginWithPassword.js";
import { sendChatMessage } from "../../domain/usecases/sendChatMessage.js";
import { getChatHistory } from "../../domain/usecases/getChatHistory.js";
import { getLessonDetail } from "../../domain/usecases/getLessonDetail.js";
import { reviewWriting } from "../../domain/usecases/reviewWriting.js";
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
    // Generating vocab costs a real Gemini call — require a session so this
    // can't be hit anonymously in a loop to run up the API bill.
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const detail = await getLessonDetail({ lessonId: Number(lessonMatch[1]), userId: id }, deps);
      return json(detail);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 404 });
      console.error("Lesson detail error:", error);
      return json({ error: "Failed to load lesson" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/vocab" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      return json(await getFlashcards({ userId: id }, deps));
    } catch (error) {
      console.error("Flashcards error:", error);
      return json({ error: "Failed to load flashcards" }, { status: 500 });
    }
  }

  const reviewVocabMatch = url.pathname.match(/^\/api\/vocab\/(\d+)\/review$/);
  if (reviewVocabMatch && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { quality } = await request.json();
      const result = await reviewVocab({ userId: id, vocabId: Number(reviewVocabMatch[1]), quality }, deps);
      return json(result);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Review vocab error:", error);
      return json({ error: "Failed to record review" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/vocab/saved" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      return json(await getSavedVocab({ userId: id }, deps));
    } catch (error) {
      console.error("Saved vocab error:", error);
      return json({ error: "Failed to load saved vocab" }, { status: 500 });
    }
  }

  const saveVocabMatch = url.pathname.match(/^\/api\/vocab\/(\d+)\/save$/);
  if (saveVocabMatch && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const body = await request.json().catch(() => ({}));
      await toggleSavedVocab({ userId: id, vocabId: Number(saveVocabMatch[1]), save: body.save !== false }, deps);
      return json({ success: true });
    } catch (error) {
      console.error("Toggle saved vocab error:", error);
      return json({ error: "Failed to update saved vocab" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/challenge/today" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      return json(await getDailyChallenge({ userId: id }, deps));
    } catch (error) {
      console.error("Daily challenge error:", error);
      return json({ error: "Failed to load daily challenge" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/challenge/complete" && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { score } = await request.json();
      const result = await completeDailyChallenge({ userId: id, score }, deps);
      return json(result);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Complete daily challenge error:", error);
      return json({ error: "Failed to complete daily challenge" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/rankings" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      return json(await getRankings({ userId: id }, deps));
    } catch (error) {
      console.error("Rankings error:", error);
      return json({ error: "Failed to load rankings" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/rankings/weekly" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      return json(await getWeeklyRankings({ userId: id }, deps));
    } catch (error) {
      console.error("Weekly rankings error:", error);
      return json({ error: "Failed to load weekly rankings" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/game/round" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      await deps.sessionPort.verify(authToken);
      const difficulty = url.searchParams.get("difficulty") || "easy";
      return json(await getWordGameRound({ difficulty }, deps));
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Word game round error:", error);
      return json({ error: "Failed to load game round" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/game/words" && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      await deps.sessionPort.verify(authToken);
      const count = url.searchParams.get("count");
      const levelsParam = url.searchParams.get("levels");
      const difficultyParam = url.searchParams.get("difficulty");
      const levels = levelsParam
        ? levelsParam.split(",").map((l) => l.trim()).filter(Boolean)
        : difficultyParam
          ? DIFFICULTY_LEVELS[difficultyParam]
          : undefined;
      return json(await getWordPool({ count, levels }, deps));
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Word pool error:", error);
      return json({ error: "Failed to load words" }, { status: 500 });
    }
  }

  const gameScoreMatch = url.pathname.match(/^\/api\/games\/([\w-]+)\/score$/);
  if (gameScoreMatch && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { score, correct } = await request.json();
      const result = await submitGameScore({ userId: id, game: gameScoreMatch[1], score, correct }, deps);
      return json(result);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Submit game score error:", error);
      return json({ error: "Failed to submit score" }, { status: 500 });
    }
  }

  const gameLeaderboardMatch = url.pathname.match(/^\/api\/games\/([\w-]+)\/leaderboard$/);
  if (gameLeaderboardMatch && request.method === "GET") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const result = await getGameLeaderboard({ userId: id, game: gameLeaderboardMatch[1] }, deps);
      return json(result);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Game leaderboard error:", error);
      return json({ error: "Failed to load leaderboard" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/writing/review" && request.method === "POST") {
    // Same reasoning as lesson detail: a real Gemini call, so require a
    // session instead of letting it be hit anonymously in a loop.
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { text } = await request.json();
      const result = await reviewWriting({ userId: id, text }, deps);
      return json(result);
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Writing review error:", error);
      return json({ error: "Failed to review writing" }, { status: 500 });
    }
  }

  if (url.pathname === "/api/feedback" && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { message } = await request.json();
      await submitFeedback({ userId: id, message }, deps);
      return json({ success: true });
    } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 });
      console.error("Feedback submit error:", error);
      return json({ error: "Failed to submit feedback" }, { status: 500 });
    }
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

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const { email, password } = await request.json();
      const { token, user } = await loginWithPassword({ email, password }, deps);
      return json({ success: true, user: sanitizeUser(user) }, { headers: { "Set-Cookie": buildAuthCookie(token, { secure: isSecure }) } });
    } catch (error) {
      if (error instanceof ValidationError) return new Response(error.message, { status: 400 });
      if (error instanceof AuthError) return new Response(error.message, { status: 401 });
      return new Response(error.message, { status: 500 });
    }
  }

  if (url.pathname === "/api/user/password" && request.method === "POST") {
    // Feature retired: SSO is the only supported way in now. Kept as an
    // explicit response (rather than deleting the route outright) so the
    // still-visible "Thiết lập mật khẩu" menu item in the compiled bundle
    // fails cleanly instead of falling through to the SPA asset fallback.
    return json({ error: "Đổi mật khẩu không còn được hỗ trợ. Đăng nhập bằng Google." }, { status: 410 });
  }

  if (url.pathname === "/api/chat" && request.method === "POST") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { message } = await request.json();
      const reply = await sendChatMessage({ userId: id, message }, deps);
      return json(reply);
    } catch (error) {
      console.error("Chat API Error:", error);
      return json({ error: error.message }, { status: 500 });
    }
  }

  if (url.pathname === "/api/chat/history") {
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      return json(await getChatHistory({ userId: id }, deps));
    } catch (error) {
      return json({ error: error.message }, { status: 500 });
    }
  }

  return null;
}
