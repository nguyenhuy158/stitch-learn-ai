import { createD1UserRepository } from "./adapters/d1/userRepository.js";
import { createD1ChatRepository } from "./adapters/d1/chatRepository.js";
import { createD1LessonRepository } from "./adapters/d1/lessonRepository.js";
import { createD1TranslationRepository } from "./adapters/d1/translationRepository.js";
import { createD1FeedbackRepository } from "./adapters/d1/feedbackRepository.js";
import { createD1SavedVocabRepository } from "./adapters/d1/savedVocabRepository.js";
import { createD1VocabReviewRepository } from "./adapters/d1/vocabReviewRepository.js";
import { createD1WordLookupCacheRepository } from "./adapters/d1/wordLookupCacheRepository.js";
import { createD1DailyChallengeRepository } from "./adapters/d1/dailyChallengeRepository.js";
import { createD1WordGameRepository } from "./adapters/d1/wordGameRepository.js";
import { createD1GameScoreRepository } from "./adapters/d1/gameScoreRepository.js";
import { createJoseSessionProvider } from "./adapters/jose/sessionProvider.js";
import { createJoseSsoVerifier } from "./adapters/jose/ssoVerifier.js";
import { createMochiClient } from "./adapters/mochi/client.js";
import { createMochiTutor } from "./adapters/mochi/tutor.js";
import { createMochiVocabGenerator } from "./adapters/mochi/vocabGenerator.js";
import { createMochiGrammarContentGenerator } from "./adapters/mochi/grammarContentGenerator.js";
import { createMochiWritingReviewer } from "./adapters/mochi/writingReviewer.js";
import { createMochiTranslationExercise } from "./adapters/mochi/translationExercise.js";
import { createMochiWordLookup } from "./adapters/mochi/wordLookup.js";
import { createDicebearAvatarGenerator } from "./adapters/dicebear/avatarGenerator.js";
import { createR2VocabImageStore } from "./adapters/r2/vocabImageStore.js";
import { createMailerPort } from "./adapters/mailer/mailerPort.js";
import { createNewsInLevelsFeed } from "./adapters/newsinlevels/feed.js";
import { createD1ReadingRepository } from "./adapters/d1/readingRepository.js";
import { createD1ReadingQuizRepository } from "./adapters/d1/readingQuizRepository.js";
import { createMochiReadingQuiz } from "./adapters/mochi/readingQuiz.js";
import { handleRequest } from "./adapters/http/router.js";
import { sendStreakReminders } from "./domain/usecases/sendStreakReminders.js";

function buildDeps(env) {
  const mochi = createMochiClient({
    ai: env.AI,
    model: env.MOCHI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    gateway: env.AI_GATEWAY
  });
  return {
    env,
    userRepository: createD1UserRepository(env.DB),
    chatRepository: createD1ChatRepository(env.DB),
    lessonRepository: createD1LessonRepository(env.DB),
    feedbackRepository: createD1FeedbackRepository(env.DB),
    translationRepository: createD1TranslationRepository(env.DB),
    savedVocabRepository: createD1SavedVocabRepository(env.DB),
    vocabReviewRepository: createD1VocabReviewRepository(env.DB),
    wordLookupCacheRepository: createD1WordLookupCacheRepository(env.DB),
    dailyChallengeRepository: createD1DailyChallengeRepository(env.DB),
    wordGameRepository: createD1WordGameRepository(env.DB),
    gameScoreRepository: createD1GameScoreRepository(env.DB),
    sessionPort: createJoseSessionProvider(env.JWT_SECRET),
    ssoPort: env.SSO_ISSUER
      ? createJoseSsoVerifier({ issuer: env.SSO_ISSUER, audience: env.SSO_AUDIENCE })
      : null,
    aiTutorPort: createMochiTutor(mochi),
    vocabGeneratorPort: createMochiVocabGenerator(mochi),
    grammarContentGeneratorPort: createMochiGrammarContentGenerator(mochi),
    writingReviewerPort: createMochiWritingReviewer(mochi),
    translationExercisePort: createMochiTranslationExercise(mochi),
    wordLookupPort: createMochiWordLookup(mochi),
    avatarGeneratorPort: createDicebearAvatarGenerator(),
    vocabImagePort: createR2VocabImageStore(env.VOCAB_IMAGES),
    mailerPort: createMailerPort(env.MAILER, env.MAILER_KEY),
    newsFeedPort: createNewsInLevelsFeed(),
    readingRepository: createD1ReadingRepository(env.DB),
    readingQuizRepository: createD1ReadingQuizRepository(env.DB),
    readingQuizPort: createMochiReadingQuiz(mochi)
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
