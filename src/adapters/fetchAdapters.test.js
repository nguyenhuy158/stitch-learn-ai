import test from "node:test";
import assert from "node:assert/strict";
import { createFreeDictionary } from "./dictionaryapi/dictionary.js";
import { createTatoebaExamples } from "./tatoeba/examples.js";
import { createNewsInLevelsFeed } from "./newsinlevels/feed.js";

/** Thay global.fetch bang handler theo URL trong 1 test, tu restore sau do. */
function mockFetch(t, handler) {
  const original = global.fetch;
  global.fetch = handler;
  t.after(() => { global.fetch = original; });
}

function res(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
    text: async () => body
  };
}

test("createFreeDictionary: map response, 404 tra rong, loi khac thi throw", async (t) => {
  const entries = JSON.stringify([{ phonetics: [{ audio: "https://a.mp3" }], meanings: [{ synonyms: ["pass"], antonyms: [] }] }]);
  const statusByTerm = { ticket: [200, entries], xyzzy: [404, ""], boom: [500, ""] };
  mockFetch(t, async (url) => {
    const term = decodeURIComponent(url.split("/").pop());
    return res(statusByTerm[term][1], statusByTerm[term][0]);
  });
  const dict = createFreeDictionary();
  assert.deepEqual(await dict.lookup("ticket"), { audioUrl: "https://a.mp3", synonyms: ["pass"], antonyms: [] });
  assert.deepEqual(await dict.lookup("xyzzy"), { audioUrl: "", synonyms: [], antonyms: [] });
  await assert.rejects(() => dict.lookup("boom"), /Dictionary API error: 500/);
});

test("createTatoebaExamples: map response, loi thi throw", async (t) => {
  const body = JSON.stringify({
    data: [{ text: "Show your ticket.", translations: [{ lang: "vie", text: "Cho xem vé." }] }]
  });
  let fail = false;
  mockFetch(t, async () => (fail ? res("", 503) : res(body)));
  const port = createTatoebaExamples();
  assert.deepEqual(await port.search("ticket"), [{ en: "Show your ticket.", vi: "Cho xem vé." }]);
  fail = true;
  await assert.rejects(() => port.search("ticket"), /Tatoeba error: 503/);
});

const FEED_XML = `<rss><channel><item>
  <title>Swiftenomics – level 1</title>
  <link>https://www.newsinlevels.com/products/s1/</link>
  <category><![CDATA[Interesting]]></category>
  <guid>g1</guid>
  <pubDate>Fri, 28 Aug 2026 14:00:25 +0000</pubDate>
  <content:encoded><![CDATA[<p>Taylor Swift is famous.</p>]]></content:encoded>
</item><item>
  <title>Swiftenomics – level 2</title>
  <link>https://www.newsinlevels.com/products/s2/</link>
  <category><![CDATA[Interesting]]></category>
  <guid>g2</guid>
  <pubDate>Fri, 28 Aug 2026 14:00:25 +0000</pubDate>
  <content:encoded><![CDATA[<p>Taylor Swift is very famous.</p>]]></content:encoded>
</item></channel></rss>`;

const PAGE_HTML = `<meta property="og:image" content="https://img.jpg" />
<iframe src="https://w.soundcloud.com/player/?url=abc"></iframe>`;

test("createNewsInLevelsFeed: lay bai + media tung trang, trang loi chi thieu media", async (t) => {
  mockFetch(t, async (url) => {
    if (url.includes("/feed/")) return res(FEED_XML);
    if (url.endsWith("/s1/")) return res(PAGE_HTML);
    throw new Error("network down"); // trang level 2 loi
  });
  const articles = await createNewsInLevelsFeed().fetchArticles();
  assert.equal(articles.length, 2);
  assert.equal(articles[0].imageUrl, "https://img.jpg");
  assert.equal(articles[0].audioUrl, "https://w.soundcloud.com/player/?url=abc");
  assert.equal(articles[1].imageUrl, "");
  assert.equal(articles[1].audioUrl, "");
});

test("createNewsInLevelsFeed: trang bai tra loi HTTP thi media rong, feed loi thi throw", async (t) => {
  let feedStatus = 200;
  mockFetch(t, async (url) => (url.includes("/feed/") ? res(FEED_XML, feedStatus) : res("", 500)));
  const port = createNewsInLevelsFeed();
  const articles = await port.fetchArticles();
  assert.deepEqual([articles[0].imageUrl, articles[0].audioUrl], ["", ""]);
  feedStatus = 503;
  await assert.rejects(() => port.fetchArticles(), /News feed error: 503/);
});
