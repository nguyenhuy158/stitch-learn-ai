import test from "node:test";
import assert from "node:assert/strict";
import { localDate, shiftDate } from "../streak.js";
import { ValidationError } from "../errors.js";
import { clearChatHistory } from "./clearChatHistory.js";
import { getChatHistory, listConversations } from "./getChatHistory.js";
import { getCurrentUser } from "./getCurrentUser.js";
import { getDailyChallenge, QUESTION_COUNT, CHALLENGE_XP } from "./getDailyChallenge.js";
import { completeDailyChallenge } from "./completeDailyChallenge.js";
import { getFlashcards, getDueCount } from "./getFlashcards.js";
import { getGameLeaderboard } from "./getGameLeaderboard.js";
import { getLearningStats } from "./getLearningStats.js";
import { getLessonDetail } from "./getLessonDetail.js";
import { getRankings, getWeeklyRankings } from "./getRankings.js";
import {
  listReadingStories,
  refreshReadingFeed,
  getReadingArticle,
  getReadingQuiz,
  translateReadingArticles,
  saveReadingQuizAttempt,
  getReadingQuizAttempts
} from "./getReading.js";
import { getSavedVocab } from "./getSavedVocab.js";
import { getTranslationHistory } from "./getTranslationHistory.js";
import { getTranslationRecallRound, saveRecallAttempt } from "./getTranslationRecallRound.js";
import { getWordGameRound, DIFFICULTIES } from "./getWordGameRound.js";
import { getWordPool } from "./getWordPool.js";
import { listLessons } from "./listLessons.js";
import { recordLearningActivity } from "./recordLearningActivity.js";
import { reviewVocab, scheduleReview } from "./reviewVocab.js";
import { reviewWriting } from "./reviewWriting.js";
import { sendStreakReminders } from "./sendStreakReminders.js";
import { startSsoLogin } from "./startSsoLogin.js";
import { submitFeedback } from "./submitFeedback.js";
import { submitGameScore, GAMES } from "./submitGameScore.js";
import { toggleSavedVocab } from "./toggleSavedVocab.js";
import { updateProfile } from "./updateProfile.js";

const NOW = new Date("2026-08-29T10:00:00Z");
const TODAY = localDate(NOW);

/** userRepository gia du dung cho recordLearningActivity + xp. */
function fakeUserRepo(extra = {}) {
  const calls = { activityDays: [], streaks: [], xp: [] };
  return {
    calls,
    recordActivityDay: async (userId, day) => calls.activityDays.push([userId, day]),
    listActivityDays: async () => [TODAY],
    updateStreak: async (userId, s) => calls.streaks.push([userId, s]),
    incrementXp: async (userId, xp, day) => calls.xp.push([userId, xp, day]),
    ...extra
  };
}

// ---- chat ----

test("clearChatHistory: id hop le thi xoa, id bay ba thi throw", async () => {
  const deleted = [];
  const d = { chatRepository: { deleteConversation: async (u, c) => deleted.push([u, c]) } };
  await clearChatHistory({ userId: "u1", conversationId: "conv-1" }, d);
  assert.deepEqual(deleted, [["u1", "conv-1"]]);
  await assert.rejects(() => clearChatHistory({ userId: "u1", conversationId: "x y" }, d), ValidationError);
});

test("getChatHistory: co id thi lay tin nhan, khong id thi lay tat ca", async () => {
  const d = {
    chatRepository: {
      listMessages: async (u, c, limit) => [{ u, c, limit }],
      listAll: async (u, limit) => [{ all: true, u, limit }],
      listConversations: async (u, limit) => [{ convs: true, u, limit }]
    }
  };
  assert.deepEqual(await getChatHistory({ userId: "u1", conversationId: "c1" }, d), [{ u: "u1", c: "c1", limit: 100 }]);
  assert.deepEqual(await getChatHistory({ userId: "u1" }, d), [{ all: true, u: "u1", limit: 50 }]);
  assert.deepEqual(await listConversations({ userId: "u1" }, d), [{ convs: true, u: "u1", limit: 50 }]);
});

// ---- user / auth ----

test("getCurrentUser: khong token thi user null", async () => {
  assert.deepEqual(await getCurrentUser({}, {}), { user: null, mintedToken: null });
});

test("getCurrentUser: token hop le thi tra user kem streak + week + config chuan hoa", async () => {
  const d = {
    sessionPort: { verify: async () => ({ id: "u1" }) },
    userRepository: fakeUserRepo({
      findById: async () => ({ id: "u1", gemini_config: "not json" })
    })
  };
  const { user, mintedToken } = await getCurrentUser({ authToken: "t" }, d, NOW);
  assert.equal(mintedToken, null);
  assert.equal(user.streak, 1);
  assert.equal(user.week.length, 7);
  assert.equal(user.last_active_date, TODAY);
  assert.ok(user.gemini_config.model);
});

test("getCurrentUser: token hong thi user null, khong throw", async () => {
  const d = { sessionPort: { verify: async () => { throw new Error("bad"); } } };
  assert.deepEqual(await getCurrentUser({ authToken: "t" }, d), { user: null, mintedToken: null });
});

test("getCurrentUser: ssoToken thi tao user + mint token phien", async () => {
  const d = {
    ssoPort: { verify: async () => ({ email: "a@b.c", name: "A" }) },
    avatarGeneratorPort: { generate: (email) => `avatar:${email}` },
    sessionPort: { sign: async () => "minted", verify: async () => ({ id: "u9" }) },
    userRepository: fakeUserRepo({
      resolveIdFromSso: async ({ picture }) => { assert.equal(picture, "avatar:a@b.c"); return "u9"; },
      findById: async () => ({ id: "u9", gemini_config: null })
    })
  };
  const { user, mintedToken } = await getCurrentUser({ ssoToken: "sso" }, d);
  assert.equal(mintedToken, "minted");
  assert.equal(user.id, "u9");
});

// ---- daily challenge ----

const POOL = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, term: `t${i}`, meaning: `m${i}` }));

test("getDailyChallenge: da lam roi thi completed, chua thi sinh cau hoi tu pool", async () => {
  const done = await getDailyChallenge(
    { userId: "u1" },
    { dailyChallengeRepository: { getForDay: async () => ({ xp_awarded: 15 }) } },
    NOW
  );
  assert.deepEqual(done, { day: TODAY, completed: true, xpAwarded: 15, questions: [] });

  const fresh = await getDailyChallenge(
    { userId: "u1" },
    { dailyChallengeRepository: { getForDay: async () => null, pickRandomVocab: async () => POOL } },
    NOW
  );
  assert.equal(fresh.completed, false);
  assert.equal(fresh.questions.length, QUESTION_COUNT);
  for (const q of fresh.questions) {
    assert.equal(q.choices.length, 4);
    assert.ok(q.choices.includes(q.correctMeaning));
  }
});

test("completeDailyChallenge: idempotent + cong XP dung 1 lan, score xau thi throw", async () => {
  const userRepository = fakeUserRepo();
  const marks = [];
  const deps = {
    userRepository,
    dailyChallengeRepository: {
      getForDay: async () => (marks.length ? { xp_awarded: CHALLENGE_XP } : null),
      markCompleted: async (...a) => marks.push(a)
    }
  };
  const first = await completeDailyChallenge({ userId: "u1", score: 4 }, deps, NOW);
  assert.deepEqual(first, { completed: true, xpAwarded: CHALLENGE_XP, score: 4 });
  assert.deepEqual(userRepository.calls.xp, [["u1", CHALLENGE_XP, TODAY]]);
  const again = await completeDailyChallenge({ userId: "u1", score: 4 }, deps, NOW);
  assert.deepEqual(again, { completed: true, xpAwarded: CHALLENGE_XP });
  assert.equal(marks.length, 1);
  await assert.rejects(() => completeDailyChallenge({ userId: "u1", score: -1 }, deps, NOW), ValidationError);
  await assert.rejects(() => completeDailyChallenge({ userId: "u1", score: 1.5 }, deps, NOW), ValidationError);
});

// ---- flashcards / stats ----

test("getFlashcards + getDueCount dung ngay local hom nay", async () => {
  const d = {
    vocabReviewRepository: {
      listDue: async (u, day, limit) => [{ u, day, limit }],
      countDue: async (u, day) => (day === TODAY ? 3 : -1)
    }
  };
  assert.deepEqual(await getFlashcards({ userId: "u1" }, d, NOW), [{ u: "u1", day: TODAY, limit: 30 }]);
  assert.deepEqual(await getDueCount({ userId: "u1" }, d, NOW), { count: 3 });
});

test("getLearningStats gop 3 nguon", async () => {
  const d = {
    userRepository: { listActivityDays: async () => [TODAY, "2026-08-28"] },
    savedVocabRepository: { countForUser: async () => 12 },
    vocabReviewRepository: { countDue: async () => 4 }
  };
  assert.deepEqual(await getLearningStats({ userId: "u1" }, d, NOW), {
    days: [TODAY, "2026-08-28"],
    daysLearned: 2,
    savedWords: 12,
    dueWords: 4
  });
});

// ---- lessons ----

test("listLessons + getSavedVocab + getTranslationHistory chi uy quyen cho repo", async () => {
  assert.deepEqual(await listLessons({ lessonRepository: { listAll: async () => [1, 2] } }), [1, 2]);
  assert.deepEqual(await getSavedVocab({ userId: "u1" }, { savedVocabRepository: { listForUser: async (u) => [u] } }), ["u1"]);
  assert.deepEqual(
    await getTranslationHistory({ userId: "u1" }, { translationRepository: { listAttempts: async () => [1] } }),
    { attempts: [1] }
  );
});

test("getLessonDetail: khong co / bi khoa thi throw", async () => {
  const repoWith = (lesson) => ({ lessonRepository: { findById: async () => lesson } });
  await assert.rejects(() => getLessonDetail({ lessonId: 1 }, repoWith(null)), /Lesson not found/);
  await assert.rejects(() => getLessonDetail({ lessonId: 1 }, repoWith({ is_locked: 1 })), /Lesson is locked/);
});

test("getLessonDetail: grammar chua co content thi generate roi luu", async () => {
  const saved = [];
  const d = {
    lessonRepository: {
      findById: async () => ({ id: 1, type: "grammar", title: "Tenses", sub_title: "s", content: null }),
      saveContent: async (id, c) => saved.push([id, c])
    },
    grammarContentGeneratorPort: { generate: async () => ({ sections: [] }) },
    userRepository: fakeUserRepo()
  };
  const res = await getLessonDetail({ lessonId: 1, userId: "u1" }, d);
  assert.deepEqual(res.content, { sections: [] });
  assert.deepEqual(saved, [[1, JSON.stringify({ sections: [] })]]);
});

test("getLessonDetail: vocab rong thi generate, co roi thi dung luon", async () => {
  let vocab = [];
  let generated = 0;
  const d = {
    lessonRepository: {
      findById: async () => ({ id: 2, type: "vocab", title: "Food", sub_title: "s" }),
      listVocab: async () => vocab,
      saveVocab: async (id, items) => { vocab = items; }
    },
    vocabGeneratorPort: { generate: async () => { generated++; return [{ term: "apple" }]; } },
    userRepository: fakeUserRepo()
  };
  const res = await getLessonDetail({ lessonId: 2, userId: "u1" }, d);
  assert.deepEqual(res.vocab, [{ term: "apple" }]);
  await getLessonDetail({ lessonId: 2, userId: "u1" }, d);
  assert.equal(generated, 1);
});

// ---- rankings ----

test("getRankings + getWeeklyRankings: xep hang va moc thu Hai", async () => {
  const top = [{ id: "a", xp: 9 }, { id: "u1", xp: 5 }];
  const weeks = [];
  const d = {
    userRepository: {
      listRankings: async () => top,
      getRank: async () => 2,
      listWeeklyRankings: async (since) => { weeks.push(since); return top; }
    }
  };
  assert.deepEqual(await getRankings({ userId: "u1" }, d), { top, myRank: 2 });

  const weekly = await getWeeklyRankings({ userId: "u1" }, d, NOW);
  const mondayOffset = (new Date(TODAY + "T00:00:00Z").getUTCDay() + 6) % 7;
  assert.equal(weekly.since, shiftDate(TODAY, -mondayOffset));
  assert.equal(weekly.myRank, 2);
  assert.equal((await getWeeklyRankings({ userId: "zzz" }, d, NOW)).myRank, null);
});

// ---- reading ----

const ROWS = [
  { guid: "g2", story: "S", category: "News", published_at: "p", image_url: "", level: 2 },
  { guid: "g1", story: "S", category: "News", published_at: "p", image_url: "https://img", level: 1 }
];

test("listReadingStories: chi doc cache, gom story + sort level + lay anh dau tien", async () => {
  const d = { readingRepository: { listArticles: async () => ROWS } };
  const { stories } = await listReadingStories({}, d);
  assert.equal(stories.length, 1);
  assert.equal(stories[0].imageUrl, "https://img");
  assert.deepEqual(stories[0].levels.map((l) => l.level), [1, 2]);
});

test("refreshReadingFeed: cache moi thi bo qua, cache cu thi fetch + upsert", async () => {
  const upserts = [];
  let fetched = 0;
  const d = {
    readingRepository: {
      latestFetchedAt: async () => NOW.toISOString(),
      upsertArticles: async (a, at) => upserts.push([a, at])
    },
    newsFeedPort: { fetchArticles: async () => { fetched++; return [{ guid: "g3" }]; } }
  };
  await refreshReadingFeed({}, d, NOW);
  assert.equal(fetched, 0);

  d.readingRepository.latestFetchedAt = async () => "2026-08-01T00:00:00Z";
  await refreshReadingFeed({}, d, NOW);
  assert.deepEqual(upserts, [[[{ guid: "g3" }], NOW.toISOString()]]);
});

test("getReadingArticle: map day du field, thieu guid / khong co bai thi throw", async () => {
  const article = {
    guid: "g1", story: "S", level: 1, category: "News", published_at: "p",
    source_url: "u", image_url: null, audio_url: null, paragraphs: ["a"]
  };
  const d = { readingRepository: { getArticle: async (g) => (g === "g1" ? { ...article, translations: ["â"] } : null) } };
  assert.deepEqual(await getReadingArticle({ guid: "g1" }, d), {
    guid: "g1", story: "S", level: 1, category: "News", publishedAt: "p",
    sourceUrl: "u", imageUrl: "", audioUrl: "", paragraphs: ["a"], translations: ["â"]
  });
  await assert.rejects(() => getReadingArticle({}, d), /Missing article id/);
  await assert.rejects(() => getReadingArticle({ guid: "nope" }, d), /Article not found/);
});

test("getReadingArticle: chua co ban dich thi dich on-demand va luu, dich loi thi tra rong", async () => {
  const saves = [];
  const d = {
    readingRepository: {
      getArticle: async () => ({ guid: "g1", story: "S", level: 1, paragraphs: ["a"], translations: [] }),
      saveTranslations: async (g, tr) => saves.push([g, tr])
    },
    articleTranslatorPort: { translate: async () => ["â"] }
  };
  assert.deepEqual((await getReadingArticle({ guid: "g1" }, d)).translations, ["â"]);
  assert.deepEqual(saves, [["g1", ["â"]]]);

  d.articleTranslatorPort.translate = async () => { throw new Error("ai down"); };
  assert.deepEqual((await getReadingArticle({ guid: "g1" }, d)).translations, []);
});

test("translateReadingArticles: dich cac bai chua co, 1 bai loi khong chan bai khac", async () => {
  const saves = [];
  const d = {
    readingRepository: {
      listUntranslated: async () => [
        { guid: "g1", story: "S", paragraphs: ["a"] },
        { guid: "g2", story: "S", paragraphs: ["b"] }
      ],
      saveTranslations: async (g, tr) => saves.push([g, tr])
    },
    articleTranslatorPort: {
      translate: async ({ paragraphs }) => {
        if (paragraphs[0] === "b") throw new Error("ai down");
        return ["â"];
      }
    }
  };
  assert.deepEqual(await translateReadingArticles({}, d), { pending: 2, translated: 1 });
  assert.deepEqual(saves, [["g1", ["â"]]]);
});

test("saveReadingQuizAttempt: validate roi luu + tinh hoat dong hoc", async () => {
  const userRepository = fakeUserRepo();
  const saved = [];
  const d = {
    userRepository,
    readingQuizRepository: { saveAttempt: async (...a) => saved.push(a) }
  };
  assert.deepEqual(await saveReadingQuizAttempt({ userId: "u1", guid: "g1", correct: 3, total: 4 }, d, NOW), { correct: 3, total: 4 });
  assert.deepEqual(saved, [["u1", "g1", 3, 4, NOW.toISOString()]]);
  assert.equal(userRepository.calls.activityDays.length, 1);
  await assert.rejects(() => saveReadingQuizAttempt({ userId: "u1", correct: 3, total: 4 }, d, NOW), /Missing article id/);
  await assert.rejects(() => saveReadingQuizAttempt({ userId: "u1", guid: "g1", correct: 5, total: 4 }, d, NOW), /Invalid quiz result/);
  await assert.rejects(() => saveReadingQuizAttempt({ userId: "u1", guid: "g1", correct: -1, total: 4 }, d, NOW), /Invalid quiz result/);
  await assert.rejects(() => saveReadingQuizAttempt({ userId: "u1", guid: "g1", correct: 1, total: 99 }, d, NOW), /Invalid quiz result/);
});

test("getReadingQuizAttempts: lay 5 lan gan nhat", async () => {
  const d = { readingQuizRepository: { listAttempts: async (u, g, limit) => [{ u, g, limit }] } };
  assert.deepEqual(await getReadingQuizAttempts({ userId: "u1", guid: "g1" }, d), { attempts: [{ u: "u1", g: "g1", limit: 5 }] });
  await assert.rejects(() => getReadingQuizAttempts({ userId: "u1" }, d), /Missing article id/);
});

test("getReadingQuiz: cache hit tra ngay, miss thi generate + cache, cache loi khong hong", async () => {
  const puts = [];
  const questions = [{ q: "?" }];
  const d = {
    readingRepository: { getArticle: async () => ({ story: "S", level: 1, paragraphs: ["a"] }) },
    readingQuizRepository: { get: async () => null, put: async (g, q) => puts.push([g, q]) },
    readingQuizPort: { generate: async () => questions }
  };
  assert.deepEqual(await getReadingQuiz({ guid: "g1" }, d, NOW), { questions });
  assert.deepEqual(puts, [["g1", questions]]);

  d.readingQuizRepository.get = async () => [{ q: "cached" }];
  assert.deepEqual(await getReadingQuiz({ guid: "g1" }, d, NOW), { questions: [{ q: "cached" }] });

  d.readingQuizRepository = { get: async () => { throw new Error("no table"); }, put: async () => { throw new Error("no table"); } };
  assert.deepEqual(await getReadingQuiz({ guid: "g1" }, d, NOW), { questions });

  await assert.rejects(() => getReadingQuiz({}, d, NOW), /Missing article id/);
  d.readingRepository.getArticle = async () => null;
  await assert.rejects(() => getReadingQuiz({ guid: "g1" }, d, NOW), /Article not found/);
});

// ---- translation recall ----

test("getTranslationRecallRound: kep count 1-20, chua dich cau nao thi throw", async () => {
  const sizes = [];
  const d = {
    translationRepository: {
      pickAttemptsForReview: async (u, size) => { sizes.push(size); return [{ id: 1 }]; }
    }
  };
  await getTranslationRecallRound({ userId: "u1", count: 100 }, d);
  await getTranslationRecallRound({ userId: "u1", count: 0 }, d);
  await getTranslationRecallRound({ userId: "u1" }, d);
  assert.deepEqual(sizes, [20, 5, 5]);

  d.translationRepository.pickAttemptsForReview = async () => [];
  await assert.rejects(() => getTranslationRecallRound({ userId: "u1" }, d), ValidationError);
});

test("saveRecallAttempt: trim + validate do dai", async () => {
  const saved = [];
  const d = { translationRepository: { saveAttempt: async (a) => saved.push(a) } };
  await saveRecallAttempt({ userId: "u1", vietnamese: " xin chao ", translation: "hi", corrected: "hello", correctionCount: "2" }, d);
  assert.equal(saved[0].vietnamese, "xin chao");
  assert.equal(saved[0].correctionCount, 2);
  await assert.rejects(() => saveRecallAttempt({ userId: "u1", vietnamese: " ", translation: "a", corrected: "b" }, d), /Missing attempt/);
  await assert.rejects(
    () => saveRecallAttempt({ userId: "u1", vietnamese: "x".repeat(501), translation: "a", corrected: "b" }, d),
    /Too long/
  );
});

// ---- games ----

const GAME_POOL = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, term: `w${i}`, meaning: `n${i}` }));

test("getWordGameRound: du cau hoi, moi cau 4 lua chon co dap an dung", async () => {
  const d = { wordGameRepository: { listRandomByLevels: async (levels, n) => GAME_POOL.slice(0, n) } };
  const round = await getWordGameRound({ difficulty: "easy" }, d);
  assert.equal(round.questions.length, DIFFICULTIES.easy.words);
  assert.equal(round.secondsPerWord, DIFFICULTIES.easy.secondsPerWord);
  for (const q of round.questions) {
    assert.equal(q.choices.length, 4);
    assert.ok(q.choices.includes(q.correctMeaning));
    assert.equal(new Set(q.choices).size, 4);
  }
});

test("getWordGameRound: distractor thieu thi lay nghia tu cac target khac", async () => {
  // Pool vua khit so cau hoi, khong con distractor rieng.
  const d = { wordGameRepository: { listRandomByLevels: async () => GAME_POOL.slice(0, DIFFICULTIES.easy.words) } };
  const round = await getWordGameRound({ difficulty: "easy" }, d);
  for (const q of round.questions) assert.equal(q.choices.length, 4);
});

test("getWordGameRound: difficulty sai / thieu tu thi throw", async () => {
  const d = { wordGameRepository: { listRandomByLevels: async () => [] } };
  await assert.rejects(() => getWordGameRound({ difficulty: "nope" }, d), /Invalid difficulty/);
  await assert.rejects(() => getWordGameRound({ difficulty: "easy" }, d), /Not enough vocab/);
});

test("getWordPool: kep count 2-30, thieu tu thi throw", async () => {
  const asked = [];
  const d = { wordGameRepository: { listRandomByLevels: async (levels, n) => { asked.push([levels, n]); return GAME_POOL.slice(0, n); } } };
  await getWordPool({ count: 100 }, d);
  await getWordPool({ count: 1, levels: ["A1"] }, d);
  await getWordPool({}, d);
  assert.equal(asked[0][1], 30);
  assert.deepEqual(asked[1], [["A1"], 2]);
  assert.equal(asked[2][1], 8);

  d.wordGameRepository.listRandomByLevels = async () => [];
  await assert.rejects(() => getWordPool({}, d), /Not enough vocab/);
});

test("submitGameScore: game sai thi throw, diem moi cao hon thi isNewBest", async () => {
  const userRepository = fakeUserRepo();
  const records = [];
  const d = {
    userRepository,
    gameScoreRepository: { bestForUser: async () => 10, record: async (...a) => records.push(a) }
  };
  await assert.rejects(() => submitGameScore({ userId: "u1", game: "poker", score: 1, correct: 1 }, d, NOW), /Invalid game/);

  const res = await submitGameScore({ userId: "u1", game: "word-game", score: 25, correct: 30 }, d, NOW);
  assert.deepEqual(res, { score: 25, bestScore: 25, isNewBest: true, xpAwarded: 20 });
  assert.deepEqual(userRepository.calls.xp, [["u1", 20, TODAY]]);
  assert.deepEqual(records[0], ["u1", "word-game", 25, NOW.toISOString()]);

  const low = await submitGameScore({ userId: "u1", game: "word-game", score: 3, correct: 3 }, d, NOW);
  assert.deepEqual(low, { score: 3, bestScore: 10, isNewBest: false, xpAwarded: 3 });
});

test("submitGameScore: matching an XP co dinh, 0 cau dung thi khong cong XP", async () => {
  const userRepository = fakeUserRepo();
  const d = { userRepository, gameScoreRepository: { bestForUser: async () => 0, record: async () => {} } };
  assert.equal((await submitGameScore({ userId: "u1", game: "matching-game", score: 1, correct: 0 }, d, NOW)).xpAwarded, 5);
  assert.equal((await submitGameScore({ userId: "u1", game: "word-race", score: 0, correct: 0 }, d, NOW)).xpAwarded, 0);
  assert.equal(userRepository.calls.xp.length, 1);
  assert.ok(GAMES.includes("translation-recall"));
});

test("getGameLeaderboard: co trong top thi tra rank, khong thi null", async () => {
  const d = {
    gameScoreRepository: {
      topScores: async () => [{ user_id: "a" }, { user_id: "u1" }],
      bestForUser: async () => 7
    }
  };
  const res = await getGameLeaderboard({ userId: "u1", game: "word-game" }, d);
  assert.deepEqual(res, { top: [{ user_id: "a" }, { user_id: "u1" }], myBest: 7, myRank: 2 });
  assert.equal((await getGameLeaderboard({ userId: "zzz", game: "word-game" }, d)).myRank, null);
  await assert.rejects(() => getGameLeaderboard({ userId: "u1", game: "nope" }, d), /Invalid game/);
});

// ---- streak / activity ----

test("recordLearningActivity: ghi ngay + cap nhat streak, loi thi nuot, thieu userId thi bo qua", async () => {
  const repo = fakeUserRepo();
  await recordLearningActivity({ userId: "u1" }, { userRepository: repo }, NOW);
  assert.deepEqual(repo.calls.activityDays, [["u1", TODAY]]);
  assert.deepEqual(repo.calls.streaks, [["u1", { streak: 1, last_active_date: TODAY }]]);

  await recordLearningActivity({}, { userRepository: repo }, NOW);
  assert.equal(repo.calls.activityDays.length, 1);

  const broken = { recordActivityDay: async () => { throw new Error("db down"); } };
  await recordLearningActivity({ userId: "u1" }, { userRepository: broken }, NOW); // khong duoc throw
});

// ---- spaced repetition ----

test("scheduleReview: SM-2 dung cong thuc", () => {
  const base = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
  assert.deepEqual(scheduleReview(base, 2), { easeFactor: 2.5, intervalDays: 1, repetitions: 0 });
  assert.equal(scheduleReview({ easeFactor: 2.5, intervalDays: 0, repetitions: 0 }, 4).intervalDays, 1);
  assert.equal(scheduleReview({ easeFactor: 2.5, intervalDays: 1, repetitions: 1 }, 4).intervalDays, 6);
  assert.equal(scheduleReview(base, 4).intervalDays, Math.round(6 * 2.5));
  // Ease khong bao gio tut duoi 1.3.
  assert.equal(scheduleReview({ easeFactor: 1.3, intervalDays: 1, repetitions: 1 }, 3).easeFactor, 1.3);
});

test("reviewVocab: the moi quality 4 thi hen lai ngay mai, quality xau thi throw", async () => {
  const upserts = [];
  const d = {
    vocabReviewRepository: { get: async () => null, upsert: async (u, v, s) => upserts.push([u, v, s]) },
    userRepository: fakeUserRepo()
  };
  const res = await reviewVocab({ userId: "u1", vocabId: 7, quality: 4 }, d, NOW);
  assert.equal(res.dueDate, shiftDate(TODAY, 1));
  assert.equal(res.repetitions, 1);
  assert.equal(upserts[0][2].dueDate, res.dueDate);

  await assert.rejects(() => reviewVocab({ userId: "u1", vocabId: 7, quality: 6 }, d, NOW), ValidationError);
  await assert.rejects(() => reviewVocab({ userId: "u1", vocabId: 7, quality: 2.5 }, d, NOW), ValidationError);
});

test("reviewVocab: the cu doc trang thai tu repo", async () => {
  const d = {
    vocabReviewRepository: {
      get: async () => ({ ease_factor: 2.5, interval_days: 6, repetitions: 2 }),
      upsert: async () => {}
    },
    userRepository: fakeUserRepo()
  };
  const res = await reviewVocab({ userId: "u1", vocabId: 7, quality: 5 }, d, NOW);
  assert.equal(res.intervalDays, 15);
  assert.equal(res.repetitions, 3);
});

// ---- writing ----

test("reviewWriting: validate input, thanh cong thi +5 XP va ghi hoat dong", async () => {
  const userRepository = fakeUserRepo({ findById: async () => ({ gemini_config: null }) });
  const d = {
    userRepository,
    writingReviewerPort: { review: async ({ text }) => ({ corrected: text }) }
  };
  assert.deepEqual(await reviewWriting({ userId: "u1", text: " Hello. " }, d, NOW), { corrected: "Hello." });
  assert.deepEqual(userRepository.calls.xp, [["u1", 5, TODAY]]);
  await assert.rejects(() => reviewWriting({ userId: "u1", text: "  " }, d, NOW), ValidationError);
  await assert.rejects(() => reviewWriting({ userId: "u1", text: "x".repeat(2001) }, d, NOW), ValidationError);
});

// ---- reminders ----

test("sendStreakReminders: gui cho nguoi chua hoc, 1 mail loi khong chan ca batch", async () => {
  const sent = [];
  const d = {
    userRepository: {
      listInactiveToday: async (day) => {
        assert.equal(day, TODAY);
        return [
          { id: 1, email: "a@x", name: "A", streak: 3 },
          { id: 2, email: "bad@x", name: "B", streak: 0 },
          { id: 3, email: "c@x", name: null, streak: 0 }
        ];
      }
    },
    vocabReviewRepository: { countDue: async (id) => (id === 1 ? 2 : 0) },
    readingRepository: { listArticles: async () => [{ guid: "g1", story: "Big news" }] },
    mailerPort: {
      send: async (mail) => {
        if (mail.to === "bad@x") throw new Error("bounce");
        sent.push(mail);
      }
    }
  };
  const res = await sendStreakReminders({}, d, NOW);
  assert.deepEqual(res, { checked: 3, sent: 2 });
  assert.match(sent[0].subject, /3 ngày/);
  assert.match(sent[0].html, /2 từ vựng/);
  assert.match(sent[0].html, /Big news/);
  assert.match(sent[1].subject, /5 phút/);
});

test("sendStreakReminders: bai doc / dem tu loi thi van gui email", async () => {
  const sent = [];
  const d = {
    userRepository: { listInactiveToday: async () => [{ id: 1, email: "a@x", streak: 0 }] },
    vocabReviewRepository: { countDue: async () => { throw new Error("db"); } },
    readingRepository: { listArticles: async () => { throw new Error("db"); } },
    mailerPort: { send: async (mail) => sent.push(mail) }
  };
  assert.deepEqual(await sendStreakReminders({}, d, NOW), { checked: 1, sent: 1 });
  assert.ok(!sent[0].html.includes("từ vựng"));
});

// ---- misc ----

test("startSsoLogin: build URL login, thieu issuer thi throw", () => {
  const url = startSsoLogin({ ssoIssuer: "https://sso.x", returnUrl: "https://app.x/cb?a=1" });
  assert.equal(url, "https://sso.x/login?redirect_uri=" + encodeURIComponent("https://app.x/cb?a=1"));
  assert.throws(() => startSsoLogin({ returnUrl: "x" }), /SSO is not configured/);
});

test("submitFeedback: trim + gioi han 1000 ky tu", async () => {
  const created = [];
  const d = { feedbackRepository: { create: async (u, m) => created.push([u, m]) } };
  await submitFeedback({ userId: "u1", message: "  hay lam  " }, d);
  assert.deepEqual(created, [["u1", "hay lam"]]);
  await assert.rejects(() => submitFeedback({ userId: "u1", message: "   " }, d), ValidationError);
  await assert.rejects(() => submitFeedback({ userId: "u1", message: "x".repeat(1001) }, d), ValidationError);
});

test("toggleSavedVocab: luu thi tinh hoat dong hoc, bo luu thi khong", async () => {
  const userRepository = fakeUserRepo();
  const ops = [];
  const d = {
    userRepository,
    savedVocabRepository: {
      save: async (u, v) => ops.push(["save", u, v]),
      unsave: async (u, v) => ops.push(["unsave", u, v])
    }
  };
  await toggleSavedVocab({ userId: "u1", vocabId: 5, save: true }, d);
  await toggleSavedVocab({ userId: "u1", vocabId: 5, save: false }, d);
  assert.deepEqual(ops, [["save", "u1", 5], ["unsave", "u1", 5]]);
  assert.equal(userRepository.calls.activityDays.length, 1);
});

test("updateProfile: chi nhan field cho phep, gemini_config loc qua allowlist", async () => {
  const updates = [];
  const d = { userRepository: { updateProfile: async (u, f) => updates.push([u, f]) } };
  await updateProfile(
    { userId: "u1", fields: { name: "Huy", is_admin: true, gemini_config: { model: "evil-model", explainLang: "en" } } },
    d
  );
  const [, fields] = updates[0];
  assert.equal(fields.name, "Huy");
  assert.equal(fields.is_admin, undefined);
  const cfg = JSON.parse(fields.gemini_config);
  assert.equal(cfg.explainLang, "en");
  assert.notEqual(cfg.model, "evil-model");
  await assert.rejects(() => updateProfile({ userId: "u1", fields: { is_admin: true } }, d), /No fields to update/);
});
