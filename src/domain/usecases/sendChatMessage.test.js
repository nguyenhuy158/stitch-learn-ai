import test from "node:test";
import assert from "node:assert/strict";
import { sendChatMessage } from "./sendChatMessage.js";
import { getChatHistory } from "./getChatHistory.js";

function deps(calls) {
  return {
    userRepository: {
      findById: async () => ({ level: "B1", gemini_config: null }),
      incrementXp: async () => {},
      listActivityDays: async () => [],
      recordActivityDay: async () => {},
      updateStreak: async () => {}
    },
    chatRepository: {
      listRecent: async (...args) => (calls.push(["listRecent", ...args]), []),
      appendExchange: async (...args) => calls.push(["appendExchange", ...args]),
      listMessages: async (...args) => (calls.push(["listMessages", ...args]), []),
      listAll: async (...args) => (calls.push(["listAll", ...args]), [])
    },
    aiTutorPort: { reply: async () => ({ message: "hi", feedback: "", corrections: [] }) }
  };
}

test("chat doc va ghi dung cuoc tro chuyen duoc chon", async () => {
  const calls = [];
  await sendChatMessage({ userId: "u1", message: "hello", conversationId: "abc-123" }, deps(calls));
  assert.deepEqual(calls[0], ["listRecent", "u1", "abc-123", 10]);
  assert.deepEqual(calls[1].slice(0, 4), ["appendExchange", "u1", "abc-123", "hello"]);
});

test("conversation id la rac thi bi tu choi truoc khi goi AI", async () => {
  for (const bad of [undefined, "", "../../etc", "a".repeat(65)]) {
    await assert.rejects(() => sendChatMessage({ userId: "u1", message: "hi", conversationId: bad }, deps([])));
  }
});

test("history khong co id thi tra ve toan bo (trang Lich su)", async () => {
  const calls = [];
  await getChatHistory({ userId: "u1" }, deps(calls));
  assert.equal(calls[0][0], "listAll");
  await getChatHistory({ userId: "u1", conversationId: "abc" }, deps(calls));
  assert.deepEqual(calls[1], ["listMessages", "u1", "abc", 100]);
});
