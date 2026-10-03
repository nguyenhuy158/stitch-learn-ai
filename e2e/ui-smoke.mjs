// E2E smoke CHI CHO DEV (wrangler dev + D1 local): dang nhap bang cookie
// session tu ky (khong qua SSO auth.huyab.click), roi di qua cac flow chinh co
// ghi D1 local. `pnpm e2e` tu bat server va tao user; KHONG chay vao production.
//
// Bien moi truong (e2e/run.mjs truyen san):
// - E2E_BASE_URL: mac dinh http://127.0.0.1:8787
// - E2E_JWT_SECRET: JWT_SECRET cua wrangler dev, de ky cookie auth_token
// - E2E_USER_ID / E2E_USER_NAME: user da them vao D1 local
import { assertLocalOnly, BASE, findChromium } from "@huyab/e2e";
import { SignJWT } from "jose";
import { chromium } from "playwright-core";

const SECRET = process.env.E2E_JWT_SECRET;
const USER_ID = process.env.E2E_USER_ID;
const USER_NAME = process.env.E2E_USER_NAME;
const WAIT = { timeout: 15000 };

if (!SECRET || !USER_ID || !USER_NAME) {
  console.error(
    "Thieu E2E_JWT_SECRET / E2E_USER_ID / E2E_USER_NAME: chay qua `pnpm e2e`.",
  );
  process.exit(1);
}
// ui-smoke ghi du lieu: chi chay vao server local.
assertLocalOnly();

let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`PASS ${name}`);
}

// Cung cach src/adapters/jose/sessionProvider.js ky token.
const token = await new SignJWT({ id: USER_ID, email: `${USER_ID}@e2e.local` })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("1h")
  .sign(new TextEncoder().encode(SECRET));

const browser = await chromium.launch({ executablePath: findChromium() });
const context = await browser.newContext();
await context.addCookies([{ name: "auth_token", value: token, url: BASE }]);
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

/** Goi API cung origin trong trang (mang cookie session). */
function api(path, init) {
  return page.evaluate(
    async ({ path, init }) => {
      const response = await fetch(path, { credentials: "include", ...init });
      return {
        status: response.status,
        body: await response.json().catch(() => null),
      };
    },
    { path, init },
  );
}

try {
  await page.goto(`${BASE}/`);
  await page
    .getByRole("heading", { name: new RegExp(USER_NAME) })
    .waitFor(WAIT);
  ok("logged-in home greets the user");

  const term = `e2e-${Date.now()}`;
  const saved = await api("/api/word/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term, meaning: "từ thử e2e" }),
  });
  if (saved.status !== 200)
    throw new Error(`save word: ${saved.status} ${JSON.stringify(saved.body)}`);
  const check = await api(`/api/word/saved?term=${encodeURIComponent(term)}`);
  if (check.body?.saved !== true)
    throw new Error(`word chua duoc luu: ${JSON.stringify(check.body)}`);
  ok("save a looked-up word to D1");

  const me = await api("/api/auth/me");
  if (me.body?.user?.streak < 1)
    throw new Error(`luu tu phai tinh la hoc: ${JSON.stringify(me.body)}`);
  ok(`saving counts as studying (streak ${me.body.user.streak})`);

  await page.goto(`${BASE}/saved`);
  await page.getByText(term).first().waitFor(WAIT);
  ok("saved word shows on /saved");

  await page.goto(`${BASE}/picture-vocab`);
  await page.getByRole("heading").first().waitFor(WAIT);
  ok("/picture-vocab renders");

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
