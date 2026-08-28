import test from "node:test";
import assert from "node:assert/strict";
import { createMochiClient } from "./client.js";

const SCHEMA = { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] };

test("parse duoc ca khi model tra string lan object", async () => {
  const asString = createMochiClient({ ai: { run: async () => ({ response: '{"ok":true}' }) }, model: "m" });
  assert.deepEqual(await asString.askJson("hi", SCHEMA), { ok: true });

  const asObject = createMochiClient({ ai: { run: async () => ({ response: { ok: true } }) }, model: "m" });
  assert.deepEqual(await asObject.askJson("hi", SCHEMA), { ok: true });
});

test("chi gui option gateway khi co ten gateway", async () => {
  const calls = [];
  const ai = { run: async (...args) => (calls.push(args), { response: "{}" }) };

  await createMochiClient({ ai, model: "m" }).askJson("hi", SCHEMA);
  assert.equal(calls[0][2], undefined);

  await createMochiClient({ ai, model: "m", gateway: "gw" }).askJson("hi", SCHEMA);
  assert.deepEqual(calls[1][2], { gateway: { id: "gw" } });
});

test("loi cua model va JSON hong deu thanh Error co nghia", async () => {
  const boom = createMochiClient({ ai: { run: async () => { throw new Error("7505"); } }, model: "m" });
  await assert.rejects(() => boom.askJson("hi", SCHEMA), /Failed to call AI/);

  const junk = createMochiClient({ ai: { run: async () => ({ response: "sorry, here you go:" }) }, model: "m" });
  await assert.rejects(() => junk.askJson("hi", SCHEMA), /Malformed AI response/);

  const empty = createMochiClient({ ai: { run: async () => ({}) }, model: "m" });
  await assert.rejects(() => empty.askJson("hi", SCHEMA), /Empty response/);
});

test("askMessages giu nguyen thu tu hoi thoai", async () => {
  let seen;
  const ai = { run: async (_m, input) => ((seen = input.messages), { response: "{}" }) };
  await createMochiClient({ ai, model: "m" }).askMessages(
    [{ role: "system", content: "s" }, { role: "user", content: "u" }],
    SCHEMA
  );
  assert.deepEqual(seen.map((m) => m.role), ["system", "user"]);
});
