import { createD1UserRepository } from "./adapters/d1/userRepository.js";
import { createD1ChatRepository } from "./adapters/d1/chatRepository.js";
import { createD1LessonRepository } from "./adapters/d1/lessonRepository.js";
import { createJoseSessionProvider } from "./adapters/jose/sessionProvider.js";
import { createJoseSsoVerifier } from "./adapters/jose/ssoVerifier.js";
import { createGeminiTutor } from "./adapters/gemini/tutor.js";
import { createGeminiVocabGenerator } from "./adapters/gemini/vocabGenerator.js";
import { passwordHasher } from "./domain/services/passwordHasher.js";
import { handleRequest } from "./adapters/http/router.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const deps = {
      env,
      userRepository: createD1UserRepository(env.DB),
      chatRepository: createD1ChatRepository(env.DB),
      lessonRepository: createD1LessonRepository(env.DB),
      sessionPort: createJoseSessionProvider(env.JWT_SECRET),
      ssoPort: env.SSO_ISSUER
        ? createJoseSsoVerifier({ issuer: env.SSO_ISSUER, audience: env.SSO_AUDIENCE })
        : null,
      aiTutorPort: createGeminiTutor({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || "gemini-2.5-flash" }),
      vocabGeneratorPort: createGeminiVocabGenerator({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || "gemini-2.5-flash" }),
      passwordHasher
    };

    const apiResponse = await handleRequest(request, url, deps);
    if (apiResponse) return apiResponse;

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes(".")) {
      const indexRequest = new Request(new URL("/", request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }
    return response;
  }
};
