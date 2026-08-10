const DEFAULT_GEMINI_CONFIG = { voice: "neutral", speed: 1, personality: "friendly" };

export async function getCurrentUser({ authToken, ssoToken }, { sessionPort, ssoPort, userRepository }) {
  let token = authToken;
  let mintedToken = null;

  if (!token && ssoToken && ssoPort) {
    try {
      const ssoPayload = await ssoPort.verify(ssoToken);
      await userRepository.upsertFromSso({
        id: ssoPayload.sub,
        email: ssoPayload.email,
        name: ssoPayload.name,
        picture: ssoPayload.picture
      });
      token = await sessionPort.sign({ id: ssoPayload.sub, email: ssoPayload.email });
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

function applyStreak(user) {
  const today = new Date().toISOString().split("T")[0];
  if (user.last_active_date === today) {
    user.streakUpdated = false;
    return;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  user.streak = user.last_active_date === yesterdayStr ? (user.streak || 0) + 1 : 1;
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
