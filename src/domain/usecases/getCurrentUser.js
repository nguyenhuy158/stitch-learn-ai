import { computeStreak, localDate, weekProgress } from "../streak.js";
import { normalizeAiConfig } from "../aiConfig.js";

/** Enough history to cover both the current streak and this week's seven dots. */
const HISTORY_DAYS = 400;

export async function getCurrentUser(
  { authToken, ssoToken },
  { sessionPort, ssoPort, userRepository, avatarGeneratorPort },
  now = new Date()
) {
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
      // Read-only on purpose. This used to bump the streak on every call, so
      // merely opening the app counted as a day of learning; only the actions
      // in recordLearningActivity() do that now.
      const today = localDate(now);
      const days = await userRepository.listActivityDays(payload.id, HISTORY_DAYS);
      user.streak = computeStreak(days, today);
      user.week = weekProgress(days, today);
      user.last_active_date = days[0] || null;
      user.gemini_config = normalizeAiConfig(user.gemini_config);
    }
    return { user, mintedToken };
  } catch {
    return { user: null, mintedToken: null };
  }
}
