import test from "node:test";
import assert from "node:assert/strict";
import { mapTatoebaResponse } from "./examples.js";

test("mapTatoebaResponse chi lay cau co ban dich Viet, gioi han so cau", () => {
  const data = {
    data: [
      { text: "Please show your ticket.", translations: [{ lang: "vie", text: "Làm ơn cho xem vé." }] },
      { text: "No Vietnamese here.", translations: [{ lang: "fra", text: "Rien." }] },
      { text: "A", translations: [{ lang: "vie", text: "a" }] },
      { text: "B", translations: [{ lang: "vie", text: "b" }] }
    ]
  };
  assert.deepEqual(mapTatoebaResponse(data, 2), [
    { en: "Please show your ticket.", vi: "Làm ơn cho xem vé." },
    { en: "A", vi: "a" }
  ]);
  assert.deepEqual(mapTatoebaResponse({}, 2), []);
});
