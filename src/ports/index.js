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
 * @property {(id: string, day: string) => Promise<void>} recordActivityDay
 * @property {(id: string, limit: number) => Promise<string[]>} listActivityDays
 * @property {(id: string, fields: object) => Promise<void>} updateProfile
 * @property {(id: string, amount: number, day: string) => Promise<void>} incrementXp
 * @property {(limit: number) => Promise<Array<{id: string, name: string, xp: number, streak: number}>>} listRankings
 * @property {(sinceDay: string, limit: number) => Promise<Array<{id: string, name: string, streak: number, weekly_xp: number}>>} listWeeklyRankings
 * @property {(id: string) => Promise<number|null>} getRank
 * @property {(day: string) => Promise<Array<{id: string, email: string, name: string|null, streak: number}>>} listInactiveToday
 *
 * @typedef {Object} ChatRepository
 * @property {(userId: string, conversationId: string, limit: number) => Promise<Array<{role: string, content: string}>>} listRecent
 * @property {(userId: string, conversationId: string, userMessage: string, modelMessage: string, metadata: object) => Promise<void>} appendExchange
 * @property {(userId: string, conversationId: string, limit: number) => Promise<object[]>} listMessages
 * @property {(userId: string, limit: number) => Promise<Array<{id: string, title: string|null, last_at: string, message_count: number}>>} listConversations
 * @property {(userId: string, limit: number) => Promise<object[]>} listAll
 * @property {(userId: string, conversationId: string) => Promise<void>} deleteConversation
 *
 * @typedef {Object} LessonRepository
 * @property {() => Promise<object[]>} listAll
 * @property {(id: number) => Promise<object|null>} findById
 * @property {(lessonId: number) => Promise<Array<{id: number, term: string, type: string|null, pronounce: string|null, meaning: string, example: string|null, word_family: string|null}>>} listVocab
 * @property {(lessonId: number, items: Array<{term: string, meaning: string, example?: string}>) => Promise<void>} saveVocab
 * @property {() => Promise<Array<{id: number, term: string, meaning: string, example: string|null, lesson_id: number, lesson_title: string}>>} listAllVocab
 * @property {(lessonId: number, content: string) => Promise<void>} saveContent
 *
 * @typedef {Object} VocabGeneratorPort
 * @property {(input: {title: string, subTitle: string, count?: number}) => Promise<Array<{term: string, meaning: string, example: string}>>} generate
 *
 * @typedef {Object} GrammarContentGeneratorPort
 * @property {(input: {title: string, subTitle: string}) => Promise<{summary: string, sections: Array<{heading: string, explanation: string, examples: string[]}>}>} generate
 *
 * @typedef {Object} SessionPort
 * @property {(claims: object) => Promise<string>} sign
 * @property {(token: string) => Promise<object>} verify
 *
 * @typedef {Object} SsoPort
 * @property {(token: string) => Promise<object>} verify
 *
 * @typedef {Object} AiTutorPort
 * @property {(input: {level: string, history: object[], message: string, config?: object}) => Promise<{message: string, feedback: string|null, corrections: string[]|undefined}>} reply
 *
 * @typedef {Object} PasswordHasher
 * @property {(password: string, salt?: string) => Promise<{hash: string, salt: string}>} hash
 *
 * @typedef {Object} AvatarGeneratorPort
 * @property {(seed: string) => string} generate - deterministic SVG data URI from a seed (e.g. email)
 *
 * @typedef {Object} WritingReviewerPort
 * @property {(input: {text: string, config?: object}) => Promise<{corrected: string, corrections: Array<{original: string, suggestion: string, explanation: string}>, overallFeedback: string}>} review
 *
 * @typedef {Object} TranslationExercisePort
 * @property {(input: {term: string, meaning: string, example: string|null}) => Promise<{vietnamese: string}>} generate
 * @property {(input: {vietnamese: string, translation: string, config?: object}) => Promise<{corrected: string, corrections: Array<{original: string, suggestion: string, explanation: string}>, overallFeedback: string}>} review
 *
 * @typedef {Object} WordLookupPort
 * @property {(input: {term: string, context?: string|null}) => Promise<{term: string, type: string, meaning: string, example: string, synonyms: string[], antonyms: string[]}>} lookup
 *
 * @typedef {Object} WordLookupCacheRepository
 * @property {(term: string) => Promise<{term: string, type: string, meaning: string, example: string, synonyms: string[], antonyms: string[]}|null>} get
 * @property {(key: string, word: object, createdAt: string) => Promise<void>} put
 *
 * @typedef {Object} FeedbackRepository
 * @property {(userId: string, message: string) => Promise<void>} create
 *
 * @typedef {Object} SavedVocabRepository
 * @property {(userId: string, vocabId: number) => Promise<void>} save
 * @property {(userId: string, vocabId: number) => Promise<void>} unsave
 * @property {(userId: string, word: {term: string, meaning: string, type?: string, example?: string}, tag: string) => Promise<number|null>} saveGeneratedWord
 * @property {(userId: string, term: string) => Promise<boolean>} isTermSaved
 * @property {(userId: string) => Promise<Array<{id: number, term: string, meaning: string, example: string|null, lesson_id: number, lesson_title: string}>>} listForUser
 *
 * @typedef {Object} VocabReviewRepository
 * @property {(userId: string, today: string, limit: number) => Promise<Array<{id: number, term: string, meaning: string, example: string|null, lesson_id: number, lesson_title: string, interval_days: number|null, repetitions: number|null}>>} listDue - cards due today or never reviewed, due-soonest first
 * @property {(userId: string, vocabId: number) => Promise<{ease_factor: number, interval_days: number, repetitions: number, due_date: string}|null>} get
 * @property {(userId: string, vocabId: number, fields: {easeFactor: number, intervalDays: number, repetitions: number, dueDate: string, reviewedAt: string}) => Promise<void>} upsert
 *
 * @typedef {Object} DailyChallengeRepository
 * @property {(userId: string, day: string) => Promise<{xp_awarded: number}|null>} getForDay
 * @property {(userId: string, day: string, xpAwarded: number, completedAt: string) => Promise<void>} markCompleted
 * @property {(count: number) => Promise<Array<{id: number, term: string, meaning: string}>>} pickRandomVocab
 *
 * @typedef {Object} MailerPort
 * @property {(input: {to: string, subject: string, html: string}) => Promise<void>} send
 *
 * @typedef {{guid: string, story: string, level: number, title: string, category: string, publishedAt: string, sourceUrl: string, paragraphs: string[]}} NewsArticle
 *
 * @typedef {Object} NewsFeedPort
 * @property {() => Promise<NewsArticle[]>} fetchArticles
 *
 * @typedef {Object} ReadingRepository
 * @property {() => Promise<string|null>} latestFetchedAt
 * @property {(articles: NewsArticle[], fetchedAt: string) => Promise<void>} upsertArticles
 * @property {(limit: number) => Promise<Array<{guid: string, story: string, level: number, category: string, published_at: string}>>} listArticles
 * @property {(guid: string) => Promise<object|null>} getArticle
 *
 * @typedef {{question: string, choices: string[], answer: number, explanation: string}} QuizQuestion
 *
 * @typedef {Object} ReadingQuizPort
 * @property {(input: {story: string, level: number, paragraphs: string[]}) => Promise<QuizQuestion[]>} generate
 *
 * @typedef {Object} ReadingQuizRepository
 * @property {(guid: string) => Promise<QuizQuestion[]|null>} get
 * @property {(guid: string, questions: QuizQuestion[], createdAt: string) => Promise<void>} put
 */
export {};
