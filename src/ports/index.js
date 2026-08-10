/**
 * Ports are the interfaces the domain depends on. JS has no interface
 * keyword, so this file exists purely as documentation of the shape each
 * adapter must implement. Domain use-cases receive these via a plain
 * dependency object (no DI framework needed at this scale).
 *
 * @typedef {Object} UserRepository
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(email: string) => Promise<object|null>} findByEmail
 * @property {(claims: {email: string, name: string, picture: string}) => Promise<string>} resolveIdFromSso
 * @property {(id: string, fields: {streak: number, last_active_date: string}) => Promise<void>} updateStreak
 * @property {(id: string, fields: object) => Promise<void>} updateProfile
 *
 * @typedef {Object} ChatRepository
 * @property {(userId: string, limit: number) => Promise<Array<{role: string, parts: Array<{text: string}>}>>} listRecent
 * @property {(userId: string, userMessage: string, modelMessage: string, metadata: object) => Promise<void>} appendExchange
 * @property {(userId: string, limit: number) => Promise<object[]>} listAll
 *
 * @typedef {Object} LessonRepository
 * @property {() => Promise<object[]>} listAll
 * @property {(id: number) => Promise<object|null>} findById
 * @property {(lessonId: number) => Promise<Array<{term: string, meaning: string, example: string|null}>>} listVocab
 * @property {(lessonId: number, items: Array<{term: string, meaning: string, example?: string}>) => Promise<void>} saveVocab
 *
 * @typedef {Object} VocabGeneratorPort
 * @property {(input: {title: string, subTitle: string, count?: number}) => Promise<Array<{term: string, meaning: string, example: string}>>} generate
 *
 * @typedef {Object} SessionPort
 * @property {(claims: object) => Promise<string>} sign
 * @property {(token: string) => Promise<object>} verify
 *
 * @typedef {Object} SsoPort
 * @property {(token: string) => Promise<object>} verify
 *
 * @typedef {Object} AiTutorPort
 * @property {(input: {level: string, history: object[], message: string}) => Promise<{message: string, feedback: string|null, corrections: string[]|undefined}>} reply
 *
 * @typedef {Object} PasswordHasher
 * @property {(password: string, salt?: string) => Promise<{hash: string, salt: string}>} hash
 *
 * @typedef {Object} AvatarGeneratorPort
 * @property {(seed: string) => string} generate - deterministic SVG data URI from a seed (e.g. email)
 */
export {};
