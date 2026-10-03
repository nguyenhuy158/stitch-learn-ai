// Chay ca bo E2E dev mot lenh: build FE -> dung D1 local rieng tu con so 0
// (schema goc + migration + user e2e) -> bat `wrangler dev` -> smoke chi doc +
// smoke dang nhap -> tat server. State nam o .wrangler/e2e, khong dung toi D1
// local cua `pnpm dev`.
//
// Bien moi truong:
// - E2E_PORT: cong cho wrangler dev (mac dinh 8788, khong dung 8787 cua `pnpm dev`)
// - E2E_SKIP_BUILD=1: bo qua `pnpm build` (dung khi public/assets da moi)
// - PLAYWRIGHT_CHROMIUM_PATH: chi dinh Chromium cu the
import { randomBytes } from "node:crypto";
import { rmSync } from "node:fs";
import { run, startServer } from "@huyab/e2e";

const PORT = process.env.E2E_PORT || "8788";
const BASE = `http://127.0.0.1:${PORT}`;
const PERSIST_DIR = ".wrangler/e2e";
const D1 = ["exec", "wrangler", "d1"];
const LOCAL = ["stitch-db", "--local", "--persist-to", PERSIST_DIR];
// Secret chi song trong lan chay nay: cookie ky bang no khong dung duoc o dau khac.
const JWT_SECRET = randomBytes(32).toString("hex");
const USER = { id: "e2e-user", name: "E2E Learner" };
const SMOKE_ENV = {
  E2E_BASE_URL: BASE,
  E2E_JWT_SECRET: JWT_SECRET,
  E2E_USER_ID: USER.id,
  E2E_USER_NAME: USER.name,
};

if (process.env.E2E_SKIP_BUILD !== "1") {
  await run("pnpm", ["build"], { label: "build" });
}
rmSync(PERSIST_DIR, { recursive: true, force: true });
await run(
  "pnpm",
  [...D1, "execute", ...LOCAL, "--file", "data/schema-base.sql"],
  { label: "schema goc D1" },
);
await run("pnpm", [...D1, "migrations", "apply", ...LOCAL], {
  label: "migration D1",
});
await run(
  "pnpm",
  [
    ...D1,
    "execute",
    ...LOCAL,
    "--command",
    `INSERT INTO users (id, email, name, picture) VALUES ('${USER.id}', '${USER.id}@e2e.local', '${USER.name}', '')`,
  ],
  { label: "tao user e2e" },
);

const server = await startServer({
  command: "pnpm",
  args: [
    "exec",
    "wrangler",
    "dev",
    // Tat binding remote (Workers AI): khong can token Cloudflare, khong ton phi.
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    PORT,
    "--persist-to",
    PERSIST_DIR,
    "--var",
    `JWT_SECRET:${JWT_SECRET}`,
  ],
  readyUrl: `${BASE}/api/version`,
});

let failed = false;
try {
  console.log(`\nServer san sang tai ${BASE}\n`);
  await run("node", ["e2e/readonly-smoke.mjs"], {
    label: "read-only smoke",
    env: SMOKE_ENV,
  });
  await run("node", ["e2e/ui-smoke.mjs"], {
    label: "ui smoke",
    env: SMOKE_ENV,
  });
} catch (error) {
  failed = true;
  console.error("E2E FAIL:", error.message);
} finally {
  await server.stop();
}

process.exit(failed ? 1 : 0);
