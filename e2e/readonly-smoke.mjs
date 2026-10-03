// Smoke CHI DOC: chi GET trang/API cong khai va kiem trang render; khong dang
// nhap, khong submit form, khong ghi gi. An toan de chay vao production:
// `pnpm e2e:prod` (en.huyab.click). `pnpm e2e` chay no truoc ui-smoke de dev
// va prod dung chung mot bo kiem tra.
//
// Bien moi truong:
// - E2E_BASE_URL: mac dinh http://127.0.0.1:8787
// - PLAYWRIGHT_CHROMIUM_PATH: chi dinh Chromium cu the (xem findChromium cua @huyab/e2e)
import { BASE, expectStatus, findChromium, request } from "@huyab/e2e";
import { chromium } from "playwright-core";

const WAIT = { timeout: 15000 };

let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`PASS ${name}`);
}

/** GET mot endpoint, nem neu status khac mong doi; tra ve Response. */
async function get(path, expectedStatus) {
  const response = await request(path);
  expectStatus(response, expectedStatus);
  return response;
}

console.log(`Read-only smoke tai ${BASE}\n`);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  const version = await (await get("/api/version", 200)).json();
  if (typeof version.commit !== "string" || version.commit.length === 0) {
    throw new Error(`/api/version thieu commit: ${JSON.stringify(version)}`);
  }
  ok(`GET /api/version (${version.shortCommit})`);

  const me = await (await get("/api/auth/me", 200)).json();
  if (me.user !== null)
    throw new Error(`/api/auth/me phai user=null: ${JSON.stringify(me)}`);
  ok("GET /api/auth/me is anonymous without cookie");

  await get("/api/stats", 401);
  ok("GET /api/stats is guarded (401)");

  const lessons = await (await get("/api/lessons", 200)).json();
  if (!Array.isArray(lessons))
    throw new Error(`/api/lessons khong phai mang: ${JSON.stringify(lessons)}`);
  ok(`GET /api/lessons (${lessons.length} lessons)`);

  const vocab = await (await get("/api/picture-vocab", 200)).json();
  if (!Array.isArray(vocab.topics) || vocab.topics.length === 0) {
    throw new Error("/api/picture-vocab khong co topic nao");
  }
  ok(`GET /api/picture-vocab (${vocab.topics.length} topics)`);

  await page.goto(`${BASE}/`);
  await page.waitForURL("**/login", WAIT);
  await page.getByRole("heading", { name: "AI English" }).waitFor(WAIT);
  await page
    .getByRole("button", { name: /Đăng nhập với Google|Sign in with Google/ })
    .waitFor(WAIT);
  ok("SPA redirects to /login and renders the Google button");

  if (pageErrors.length > 0)
    throw new Error(`loi JS tren trang: ${pageErrors.join(" | ")}`);
  ok("no uncaught page errors");
} catch (error) {
  failed += 1;
  console.log("FAIL:", error.message);
  await page.screenshot({ path: "e2e-failure.png" }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
