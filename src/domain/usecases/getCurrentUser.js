const DEFAULT_GEMINI_CONFIG = { voice: "neutral", speed: 1, personality: "friendly" };

/**
 * The streak counts calendar days as the learner experiences them, not as UTC
 * sees them. Workers run in UTC, so `new Date().toISOString()` rolls over at
 * 07:00 Vietnam time: someone studying at 06:00 one morning and 08:00 the next
 * lands on the same UTC date (no increment), then trips the "missed a day"
 * branch the morning after and gets reset to 1 despite never missing a day.
 */
const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

export async function getCurrentUser({ authToken, ssoToken }, { sessionPort, ssoPort, userRepository, avatarGeneratorPort }) {
  let token = authToken;
  let mintedToken = null;

  if (!token && ssoToken && ssoPort) {
    try {
      const ssoPayload = await ssoPort.verify(ssoToken);
      const picture = ssoPayload.picture || avatarGeneratorPort?.generate(ssoPayload.email);
      const userId = await userRepository.resolveIdFromSso({
        email: ssoPayload.email,
        name: ssoPayload.name,
        picture
      });
      token = await sessionPort.sign({ id: userId, email: ssoPayload.email });
      mintedToken = token;
    } catch {
      console.error("SSO session verification failed");
    }
  }

  if (!token) return { user: null, mintedToken: null };

  try {
    const payload = await sessionPort.verify(token);
    const user = await userRepository.findById(payload.id);
    if (user) {
      applyStreak(user);
      if (user.streakUpdated) {
        await userRepository.updateStreak(payload.id, { streak: user.streak, last_active_date: user.last_active_date });
      }
      normalizeGeminiConfig(user);
    }
    return { user, mintedToken };
  } catch {
    return { user: null, mintedToken: null };
  }
}

/** Local calendar date as YYYY-MM-DD. `en-CA` formats exactly that way. */
export function localDate(now = new Date(), timeZone = APP_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

/**
 * Steps back one calendar day from a YYYY-MM-DD string. Derived from the
 * string rather than from `Date.now() - 24h` so both ends of the comparison
 * come from the same timezone.
 */
export function previousDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const previous = new Date(Date.UTC(y, m - 1, d));
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().split("T")[0];
}

export function applyStreak(user, now = new Date()) {
  const today = localDate(now);
  if (user.last_active_date === today) {
    user.streakUpdated = false;
    return;
  }
  user.streak = user.last_active_date === previousDate(today) ? (user.streak || 0) + 1 : 1;
  user.last_active_date = today;
  user.streakUpdated = true;
}

function normalizeGeminiConfig(user) {
  delete user.streakUpdated;
  try {
    user.gemini_config = JSON.parse(user.gemini_config) || DEFAULT_GEMINI_CONFIG;
  } catch {
    user.gemini_config = DEFAULT_GEMINI_CONFIG;
  }
}
