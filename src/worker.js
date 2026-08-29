import { createD1UserRepository } from "./adapters/d1/userRepository.js";
import { createD1ChatRepository } from "./adapters/d1/chatRepository.js";
import { createD1LessonRepository } from "./adapters/d1/lessonRepository.js";
import { createD1TranslationRepository } from "./adapters/d1/translationRepository.js";
import { createD1FeedbackRepository } from "./adapters/d1/feedbackRepository.js";
import { createD1SavedVocabRepository } from "./adapters/d1/savedVocabRepository.js";
import { createD1VocabReviewRepository } from "./adapters/d1/vocabReviewRepository.js";
import { createD1WordLookupCacheRepository } from "./adapters/d1/wordLookupCacheRepository.js";
import { createD1WordFrequencyRepository } from "./adapters/d1/wordFrequencyRepository.js";
import { createD1DailyChallengeRepository } from "./adapters/d1/dailyChallengeRepository.js";
import { createD1WordGameRepository } from "./adapters/d1/wordGameRepository.js";
import { createD1GameScoreRepository } from "./adapters/d1/gameScoreRepository.js";
import { createD1ReadingRepository } from "./adapters/d1/readingRepository.js";
import { createD1ReadingQuizRepository } from "./adapters/d1/readingQuizRepository.js";
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
import { createTatoebaExamples } from "./adapters/tatoeba/examples.js";
import { createFreeDictionary } from "./adapters/dictionaryapi/dictionary.js";
import { createWikipediaEtymology } from "./adapters/wikipedia/etymology.js";
import { createD1WikipediaEtymologyRepository } from "./adapters/d1/wikipediaEtymologyRepository.js";
import { createD1ExampleSentencesRepository } from "./adapters/d1/exampleSentencesRepository.js";
import { createMochiReadingQuiz } from "./adapters/mochi/readingQuiz.js";
import { createMochiArticleTranslator } from "./adapters/mochi/articleTranslator.js";
import { listReadingStories, translateReadingArticles } from "./domain/usecases/getReading.js";
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
    vocabReviewRepository: createD1VocabReviewRepository(env.DB),
    savedVocabRepository: createD1SavedVocabRepository(env.DB),
    translationRepository: createD1TranslationRepository(env.DB),
    exampleSentencesRepository: createD1ExampleSentencesRepository(env.DB),
    wordLookupCacheRepository: createD1WordLookupCacheRepository(env.DB),
    wordFrequencyRepository: createD1WordFrequencyRepository(env.DB),
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
    readingQuizPort: createMochiReadingQuiz(mochi),
    articleTranslatorPort: createMochiArticleTranslator(mochi),
    exampleSentencesPort: createTatoebaExamples(),
    dictionaryPort: createFreeDictionary(),
    wikipediaEtymologyPort: createWikipediaEtymology(),
    wikipediaEtymologyRepository: createD1WikipediaEtymologyRepository(env.DB)
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
    const deps = buildDeps(env);
    const result = await sendStreakReminders({}, deps);
    console.log(`Streak reminders: ${result.sent}/${result.checked} sent`);
    // Fetch bai doc moi tu feed (listReadingStories tu refresh khi stale) roi dien song ngu.
    await listReadingStories({}, deps).catch((e) => console.log(`News refresh failed: ${e.message}`));
    // Dien song ngu cho cac bai chua co ban dich (moi bai da mo cung tu dich on-demand).
    const t = await translateReadingArticles({}, deps);
    console.log(`Article translations: ${t.translated}/${t.pending} translated`);
  }
};
