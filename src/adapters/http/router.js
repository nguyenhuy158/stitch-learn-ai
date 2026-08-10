import { ValidationError, AuthError } from "../../domain/errors.js";
import { listLessons } from "../../domain/usecases/listLessons.js";
import { startSsoLogin } from "../../domain/usecases/startSsoLogin.js";
import { getCurrentUser } from "../../domain/usecases/getCurrentUser.js";
import { updateProfile } from "../../domain/usecases/updateProfile.js";
import { loginWithPassword } from "../../domain/usecases/loginWithPassword.js";
import { changePassword } from "../../domain/usecases/changePassword.js";
import { sendChatMessage } from "../../domain/usecases/sendChatMessage.js";
import { getChatHistory } from "../../domain/usecases/getChatHistory.js";
import { parseCookie, buildAuthCookie, buildLogoutCookie } from "./cookies.js";

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

  if (url.pathname === "/api/lessons") {
    try {
      return json(await listLessons(deps));
    } catch (error) {
      return json({ error: error.message }, { status: 500 });
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
    return new Response(null, {
      status: 302,
      headers: { Location: "/login", "Set-Cookie": buildLogoutCookie(isSecure) }
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
    const authToken = parseCookie(request.headers.get("Cookie"), "auth_token");
    if (!authToken) return new Response("Unauthorized", { status: 401 });
    try {
      const { id } = await deps.sessionPort.verify(authToken);
      const { password } = await request.json();
      await changePassword({ userId: id, password }, deps);
      return json({ success: true });
    } catch (error) {
      if (error instanceof ValidationError) return new Response(error.message, { status: 400 });
      return new Response(error.message, { status: 500 });
    }
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
