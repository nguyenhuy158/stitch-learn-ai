import test from "node:test";
import assert from "node:assert/strict";
import { mapDictionaryResponse } from "./dictionary.js";

test("mapDictionaryResponse lay audio dau tien co mp3 va gop synonyms/antonyms", () => {
  const entries = [
    {
      phonetics: [{ text: "/x/", audio: "" }, { audio: "https://a.mp3" }],
      meanings: [
        { synonyms: ["pass", "voucher"], antonyms: [] },
        { synonyms: ["pass"], antonyms: ["ban"] }
      ]
    }
  ];
  assert.deepEqual(mapDictionaryResponse(entries), {
    audioUrl: "https://a.mp3",
    synonyms: ["pass", "voucher"],
    antonyms: ["ban"]
  });
  assert.deepEqual(mapDictionaryResponse(null), { audioUrl: "", synonyms: [], antonyms: [] });
});
