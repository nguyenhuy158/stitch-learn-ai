# Repository Guidelines

## Project Structure & Module Organization

AI English (https://en.huyab.click) is one full-stack Cloudflare Worker: a
React + Vite + Tailwind v4 SPA in `src/client/` built into `public/`, plus a
plain-JavaScript backend (`src/worker.js`) that serves `/api/*` and falls back
to the static assets through the `ASSETS` binding (`wrangler.jsonc`). Storage
is D1 (`stitch-db`), vocab images live in R2 (`ai-english-vocab`), the AI
tutor "Mochi" runs on Workers AI (`env.AI`), login goes through the shared SSO
worker at `auth.huyab.click`, and a daily cron sends streak reminders through
the `mailer` service binding.

The backend is hexagonal: pure business logic in `src/domain/` (one use case
per file in `src/domain/usecases/`), port shapes documented as JSDoc typedefs
in `src/ports/index.js`, and every real I/O in `src/adapters/*`.
`src/worker.js` is the composition root: `buildDeps` wires adapters into use
cases and `src/adapters/http/router.js` maps routes to use cases. Swapping an
adapter (D1, Workers AI, jose, ...) must not require touching `src/domain/`.

Folder structure:

```text
src/
  worker.js                    # Composition root: buildDeps + fetch/scheduled handlers
  domain/                      # Pure rules (streak, aiConfig, translationMatch, ...)
    usecases/                  #   One action per file (getCurrentUser, sendChatMessage, ...)
  ports/index.js               # JSDoc interfaces the domain depends on
  adapters/                    # All real I/O
    d1/                        #   D1 repositories (users, lessons, reading, games, ...)
    mochi/                     #   Workers AI prompts (tutor, lookup, quizzes, reviews)
    http/                      #   router.js (route -> use case) + cookies.js
    jose/                      #   Session JWT + SSO JWKS verification
    r2/  mailer/  dicebear/    #   Vocab images, streak e-mails, default avatars
    dictionaryapi/ tatoeba/ newsinlevels/ wikipedia/  # External content sources
  client/                      # React SPA (Vite entry: root index.html -> main.tsx)
    pages/                     #   One file per route (Home, Flashcards, Reading, ...)
    components/                #   App-specific components (AppShell, PageHeader, ...)
    ui/                        #   Components copied from ui-kit (Button, Card, Modal, ...)
    lib/                       #   API client, speech, IPA, games helpers
    i18n/                      #   vi/en translations + LanguageProvider
    theme/ThemeProvider.tsx    #   Accent (data-theme) x mode (.dark) persistence
    tokens.css                 #   Verbatim copy of ui-kit/src/styles/tokens.css
    theme.css                  #   Brand accent palettes overriding the --ui-* colors
    main.css                   #   Global entry: imports tokens.css + theme.css
  data/                        # Bundled vocab data (picture dictionary, IPA chart)
  shared/build-info.generated.js  # Written by scripts/build-info.mjs on every build
data/migrations/               # D1 migrations (wrangler migrations_dir)
data/schema-base.sql           # Tables that predate 0001 (fresh local D1 only)
e2e/                           # run.mjs (dev e2e), readonly-smoke.mjs (dev + prod), ui-smoke.mjs
public/                        # Static assets + Vite output (index.html, assets/)
scripts/                       # build-info.mjs, seed-subtlex.mjs, R2 upload scripts
docs/                          # Feature notes, integration plan, UI/UX spec
```

## Build, Test, and Development Commands

- `pnpm install`: install dependencies.
- `pnpm dev`: write build info, then run `wrangler dev` (Worker + assets,
  local D1) on port 8787.
- `pnpm dev:client`: Vite dev server on port 5173, proxying `/api` to 8787.
- `pnpm build`: write build info, then `vite build` into `public/`. It
  rewrites `public/index.html` (tracked) and writes hashed files to
  `public/assets/` (gitignored).
- `pnpm check`: TypeScript check of `src/client` (`tsc --noEmit`).
- `pnpm lint`: `biome check .` (lint + format check). `pnpm format`:
  `biome format --write .`.
- `pnpm test`: run `node --test` over `src/**/*.test.js`.
- `pnpm migrate` / `pnpm migrate:local`: apply D1 migrations remote / local.
- `pnpm e2e`: build, create a fresh local D1 in `.wrangler/e2e` (schema base +
  migrations + an `e2e-user`), start `wrangler dev --local` on port 8788 (no
  Workers AI, no Cloudflare login), run `e2e/readonly-smoke.mjs` then the
  logged-in `e2e/ui-smoke.mjs`, and stop the server. Like `pnpm build`, it
  rewrites `public/index.html` and `src/shared/build-info.generated.js`.
- `pnpm e2e:prod`: read-only smoke against https://en.huyab.click (GET
  `/api/version`, `/api/auth/me`, `/api/stats` expecting 401, `/api/lessons`,
  `/api/picture-vocab`, and the `/` -> `/login` page; no login, no writes).
  Both need Chromium: `pnpm exec playwright-core install chromium`, or set
  `PLAYWRIGHT_CHROMIUM_PATH` (local Google Chrome is picked up on macOS).

Use `pnpm` for all package commands (never npm/yarn).

Deploy: do not run `wrangler deploy` locally. Pushing to `origin/main`
triggers Cloudflare Workers Builds (configured in the dashboard), which runs
`pnpm install --frozen-lockfile && pnpm build` and then the deploy command
`npx wrangler d1 migrations apply stitch-db --remote && npx wrangler deploy`.
Do not commit `public/assets/`; Cloudflare rebuilds it. A failing migration
stops the deploy and production keeps the previous code.

D1 migrations: add `data/migrations/00XX_name.sql` and commit; Cloudflare
applies it on deploy (tracked in table `d1_migrations`; the first 31 files
were baselined as applied). Migration 0001 assumes tables created before
migrations existed, so a fresh local D1 needs `pnpm exec wrangler d1 execute
stitch-db --local --file data/schema-base.sql` before `pnpm migrate:local`.

Secrets (set with `wrangler secret put`, never committed): `JWT_SECRET`.
Vars in `wrangler.jsonc`: `MOCHI_MODEL`, `AI_GATEWAY`, `SSO_ISSUER`,
`SSO_AUDIENCE`.

## Coding Style & Naming Conventions

Backend is plain JavaScript ES modules (JSDoc for shapes); the client is
TypeScript/TSX with `strict: false`, plus a few `.js` helpers. Follow the
existing style: two-space indentation, double quotes, semicolons. Use cases
are camelCase verbs (`getDailyChallenge.js`) exporting one async function that
receives its dependencies by destructuring; adapters are
`create<Source><Thing>` factories (`createD1UserRepository`). React
components and pages use PascalCase file names. Do not leave magic strings or
magic numbers; extract named constants.

Hexagonal boundaries:

- Keep D1, `fetch`, Workers AI, jose and other I/O out of `src/domain/`.
- New I/O gets a typedef in `src/ports/index.js`, an adapter in
  `src/adapters/<source>/`, and a key in `buildDeps` in `src/worker.js`
  (`src/worker.deps.test.js` fails if a use case needs a key `buildDeps`
  does not provide).
- External sources always go through a port plus a D1 cache, and their
  failures must not break the feature.

UI: use the `--ui-*` tokens through Tailwind utilities (`bg-surface`,
`text-fg-muted`, `bg-primary`, `rounded-ui`, ...) instead of hardcoded colors.
`src/client/tokens.css` must stay a verbatim copy of ui-kit's
`src/styles/tokens.css`; brand accents (lavender, teal, ocean, sunset) and
their dark variants live only in `src/client/theme.css`. Dark mode is the
`.dark` class on `<html>`, toggled by `ThemeProvider`.

Biome (`biome.json`) was added after the code was written; `pnpm lint`
reports existing findings. Do not mass-reformat; keep touched code clean.

## Testing Guidelines

Tests use the built-in `node:test` runner with `node:assert`, colocated as
`*.test.js` beside the module (`src/domain/streak.test.js`,
`src/adapters/tatoeba/examples.test.js`). Use cases are tested with plain fake
dependency objects (see `src/domain/usecases/usecases.test.js`); pass `now`
instead of reading the clock so tests do not depend on today's date. Browser
coverage is the e2e smoke (`pnpm e2e` locally and in CI, `pnpm e2e:prod` for
read-only checks on production); `ui-smoke.mjs` signs its own session cookie
and writes to the local D1, so it refuses any non-local base URL.

## Commit & Pull Request Guidelines

History uses Conventional Commits with short Vietnamese subjects without
diacritics, for example `feat(vocab): seed 100 cum tu A1` or
`fix(reading): import usecase getReading vao router`. Pull requests should
include a short summary, test/build results, linked issue if available, and
screenshots for visible UI changes.

## Agent-Specific Instructions

Keep responses short and focused. If a requirement is unclear, ask before making
assumptions.
Design UI/UX to fit inside a single viewport by default. Avoid page-level
scrolling; use compact layouts, tabs, panes, or contained internal lists when
content can overflow.

Reference material (untracked PDFs at the repo root, ignored by `*.pdf`):

- `Oxford Picture Dictionary.pdf` is an image-only scan (no text layer, 238
  pages, ~245x316pt). PDF page = printed page + 10 (printed "20 Money" = PDF
  page 30); pages 1-9 are cover/preface, Contents at PDF pages 9-11. 12 units
  (Everyday Language, People, Housing, Food, Clothing, Health, Community,
  Transportation, Areas of Study, Plants and Animals, Work, Recreation), ~140
  topics, 3700+ words up to PDF page ~183, then Verb Guide + Index.
- Render pages with poppler: `pdftoppm -f <from> -l <to> -png -r 120
  'Oxford Picture Dictionary.pdf' out-prefix` (on NixOS run it through
  `nix-shell -p poppler-utils --run "..."`; never install globally). Use
  `-r 250`+ when cropping single icons; 120 is enough to read text.
- Crop with ImageMagick `convert page.png -crop WxH+X+Y +repage out.png`, in
  two passes (whole illustration cluster first, then each cell). Overlapping
  angled illustrations (e.g. Money items 7-12) do not crop cleanly; list-style
  pages (e.g. Colors) do.
- Workflow for N words: render the topic pages, read the layout (number +
  English word + Vietnamese meaning), crop each item, build `{word, meaning,
  image}` data. Store images in R2 (`ai-english-vocab`, see
  `scripts/push-airport-to-r2.sh`), not in Worker assets; scratch crops are
  lost at the end of a session.
