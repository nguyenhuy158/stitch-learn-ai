// Chay ca bo E2E dev mot lenh: build FE -> dung D1 local rieng tu con so 0
// (schema goc + migration + user e2e) -> bat `wrangler dev` -> smoke chi doc +
// smoke dang nhap -> tat server. State nam o .wrangler/e2e, khong dung toi D1
// local cua `pnpm dev`.
//
// Bien moi truong:
// - E2E_PORT: cong cho wrangler dev (mac dinh 8788, khong dung 8787 cua `pnpm dev`)
// - E2E_SKIP_BUILD=1: bo qua `pnpm build` (dung khi public/assets da moi)
// - PLAYWRIGHT_CHROMIUM_PATH: chi dinh Chromium cu the
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { rmSync } from "node:fs";

const PORT = process.env.E2E_PORT || "8788";
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 500;
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

/** Chay mot lenh den khi ket thuc; loi thi nem. */
function run(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...SMOKE_ENV },
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${label} that bai (exit ${code})`)),
    );
  });
}

/** Doi tan server tra loi /api/version, hoac nem khi qua han. */
async function waitForServer(child) {
  const deadline = Date.now() + SERVER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`wrangler dev tat som (exit ${child.exitCode})`);
    try {
      const response = await fetch(`${BASE}/api/version`);
      if (response.ok) return;
    } catch {
      // Server chua san sang, thu lai.
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`wrangler dev khong len sau ${SERVER_TIMEOUT_MS}ms`);
}

if (process.env.E2E_SKIP_BUILD !== "1") {
  await run("pnpm", ["build"], "build");
}
rmSync(PERSIST_DIR, { recursive: true, force: true });
await run(
  "pnpm",
  [...D1, "execute", ...LOCAL, "--file", "data/schema-base.sql"],
  "schema goc D1",
);
await run("pnpm", [...D1, "migrations", "apply", ...LOCAL], "migration D1");
await run(
  "pnpm",
  [
    ...D1,
    "execute",
    ...LOCAL,
    "--command",
    `INSERT INTO users (id, email, name, picture) VALUES ('${USER.id}', '${USER.id}@e2e.local', '${USER.name}', '')`,
  ],
  "tao user e2e",
);

// `detached` cho server mot process group rieng: `pnpm exec` sinh them tang
// node con, kill rieng PID cha se bo mo coi wrangler/workerd giu cong.
const server = spawn(
  "pnpm",
  [
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
  {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, CI: "1" },
    detached: true,
  },
);

/** Gui signal toi ca process group cua server (bo qua neu da tat). */
function killServer(signal) {
  try {
    process.kill(-server.pid, signal);
  } catch {
    // Group da tat.
  }
}

// Group tach rieng nen Ctrl-C khong toi server: tu don truoc khi thoat.
process.once("SIGINT", () => {
  killServer("SIGKILL");
  process.exit(130);
});

let failed = false;
try {
  await waitForServer(server);
  console.log(`\nServer san sang tai ${BASE}\n`);
  await run("node", ["e2e/readonly-smoke.mjs"], "read-only smoke");
  await run("node", ["e2e/ui-smoke.mjs"], "ui smoke");
} catch (error) {
  failed = true;
  console.error("E2E FAIL:", error.message);
} finally {
  const exited = new Promise((resolve) =>
    server.once("exit", () => resolve(true)),
  );
  killServer("SIGTERM");
  // Cho wrangler don dep; qua han thi ket lieu de process khong treo.
  const stopped =
    server.exitCode !== null ||
    (await Promise.race([
      exited,
      new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
    ]));
  // Ket lieu ca group: wrangler co the tat truoc khi workerd con kip don.
  killServer("SIGKILL");
  if (!stopped) console.error("wrangler khong tat sau SIGTERM, da SIGKILL");
}

process.exit(failed ? 1 : 0);
