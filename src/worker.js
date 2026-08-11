import { createD1UserRepository } from "./adapters/d1/userRepository.js";
import { createD1ChatRepository } from "./adapters/d1/chatRepository.js";
import { createD1LessonRepository } from "./adapters/d1/lessonRepository.js";
import { createD1FeedbackRepository } from "./adapters/d1/feedbackRepository.js";
import { createD1SavedVocabRepository } from "./adapters/d1/savedVocabRepository.js";
import { createD1VocabReviewRepository } from "./adapters/d1/vocabReviewRepository.js";
import { createD1DailyChallengeRepository } from "./adapters/d1/dailyChallengeRepository.js";
import { createD1WordGameRepository } from "./adapters/d1/wordGameRepository.js";
import { createD1GameScoreRepository } from "./adapters/d1/gameScoreRepository.js";
import { createJoseSessionProvider } from "./adapters/jose/sessionProvider.js";
import { createJoseSsoVerifier } from "./adapters/jose/ssoVerifier.js";
import { createGeminiTutor } from "./adapters/gemini/tutor.js";
import { createGeminiVocabGenerator } from "./adapters/gemini/vocabGenerator.js";
import { createGeminiWritingReviewer } from "./adapters/gemini/writingReviewer.js";
import { createDicebearAvatarGenerator } from "./adapters/dicebear/avatarGenerator.js";
import { passwordHasher } from "./domain/services/passwordHasher.js";
import { createMailerPort } from "./adapters/mailer/mailerPort.js";
import { handleRequest } from "./adapters/http/router.js";
import { sendStreakReminders } from "./domain/usecases/sendStreakReminders.js";

function buildDeps(env) {
  return {
    env,
    userRepository: createD1UserRepository(env.DB),
    chatRepository: createD1ChatRepository(env.DB),
    lessonRepository: createD1LessonRepository(env.DB),
    feedbackRepository: createD1FeedbackRepository(env.DB),
    savedVocabRepository: createD1SavedVocabRepository(env.DB),
    vocabReviewRepository: createD1VocabReviewRepository(env.DB),
    dailyChallengeRepository: createD1DailyChallengeRepository(env.DB),
    wordGameRepository: createD1WordGameRepository(env.DB),
    gameScoreRepository: createD1GameScoreRepository(env.DB),
    sessionPort: createJoseSessionProvider(env.JWT_SECRET),
    ssoPort: env.SSO_ISSUER
      ? createJoseSsoVerifier({ issuer: env.SSO_ISSUER, audience: env.SSO_AUDIENCE })
      : null,
    aiTutorPort: createGeminiTutor({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || "gemini-2.5-flash" }),
    vocabGeneratorPort: createGeminiVocabGenerator({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || "gemini-2.5-flash" }),
    writingReviewerPort: createGeminiWritingReviewer({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || "gemini-2.5-flash" }),
    avatarGeneratorPort: createDicebearAvatarGenerator(),
    mailerPort: createMailerPort(env.MAILER, env.MAILER_KEY),
    passwordHasher
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const deps = buildDeps(env);

    const apiResponse = await handleRequest(request, url, deps);
    if (apiResponse) return apiResponse;

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes(".")) {
      const indexRequest = new Request(new URL("/", request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }
    return response;
  },

  async scheduled(_event, env) {
    const result = await sendStreakReminders({}, buildDeps(env));
    console.log(`Streak reminders: ${result.sent}/${result.checked} sent`);
  }
};
