import test from "node:test";
import assert from "node:assert/strict";
import { parseNewsFeed } from "./feed.js";

const SAMPLE = `<rss><channel>
<item>
  <title>Swiftenomics &#8211; level 1</title>
  <link>https://www.newsinlevels.com/products/swiftenomics-level-1/</link>
  <pubDate>Fri, 28 Aug 2026 14:00:25 +0000</pubDate>
  <category><![CDATA[Interesting]]></category>
  <guid isPermaLink="false">https://www.newsinlevels.com/?p=1</guid>
  <content:encoded><![CDATA[<p>28-08-2026 15:00</p>
<p>Taylor Swift is a very famous singer. Fans buy <strong>tickets</strong>.</p>
<p>Difficult words: <a href="#"><strong>ticket</strong></a> (a pass).</p>
<p>You can watch the original video in the Level 3 section.</p>
<p>The post <a href="#">Swiftenomics</a> appeared first on <a href="#">site</a>.</p>
]]></content:encoded>
</item>
<item>
  <title>Not an article</title>
  <guid>x</guid>
  <content:encoded><![CDATA[<p>hi</p>]]></content:encoded>
</item>
</channel></rss>`;

test("parseNewsFeed lay bai theo level, bo boilerplate va item khong phai bai", () => {
  const articles = parseNewsFeed(SAMPLE);
  assert.equal(articles.length, 1);
  const a = articles[0];
  assert.equal(a.story, "Swiftenomics");
  assert.equal(a.level, 1);
  assert.equal(a.category, "Interesting");
  assert.equal(a.guid, "https://www.newsinlevels.com/?p=1");
  assert.deepEqual(a.paragraphs, [
    "Taylor Swift is a very famous singer. Fans buy tickets.",
    "Difficult words: ticket (a pass)."
  ]);
});
