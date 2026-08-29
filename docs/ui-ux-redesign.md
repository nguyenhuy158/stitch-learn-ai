# UI/UX Audit & Redesign Spec — ai-english

Scope: full read-through of `src/client` (tokens, theme, layout, all 17 `ui/` components, all 24 pages). No browser/runtime tooling used — all findings are from source. This doc is the working spec for the implementation pass that follows.

---

## 1. Current state summary

- **Token system is genuinely good.** `tokens.css` + `theme.css` define a coherent oklch-derived palette (`--ui-bg/surface/surface-muted/border/fg/fg-muted/primary/primary-hover/primary-fg/primary-soft/ring/success/warning/danger` + soft variants) across 3 accents × 2 modes, registered into Tailwind via `@theme inline`. This is a solid foundation, not a rewrite target.
- **A real component library already exists** at `src/client/ui/`: `Button`, `Card`, `Field`, `Input`/`Textarea`/`Select`, `Modal`/`ConfirmDialog`, `Sheet`, `Toast`/`ToastProvider`, `Tabs`, `Menu`, `Avatar`, `Switch`, `Badge`, `Progress`, `BottomNav`/`Fab`, `HeaderBar`, `Spinner`, `states.tsx` (`Skeleton`, `SkeletonListRow`, `EmptyState`, `LoadingState`). Button and Input handle mobile touch-target sizing (≥44px) and iOS zoom-prevention (16px input font) correctly out of the box.
- **`Tabs` is a real adoption success**: `GamesLeaderboard`, `Lessons`, `Rankings` all use the shared component with no drift.
- **AppShell/nav is well-scoped**: only 5 top-level routes get the persistent bottom-nav/sidebar; the other 19 drill-down pages correctly use a lighter `PageHeader` back-link pattern instead of forcing tab chrome everywhere.
- **`prefers-reduced-motion` is handled globally** in `tokens.css`, and shared overlay animations (`ui-fade-in`, `ui-zoom-in`, `ui-slide-up/down`) are centralized rather than duplicated per-component.

**The core finding this whole audit hangs on: the design system is not missing, it is ~50% unadopted.** Verified by grep — zero page imports `Input`, `Textarea`, `Field`, `Modal`, `Sheet`, `Menu`, `Badge`, `HeaderBar`, or `Fab`. `LoadingState`/`Skeleton` have zero call sites. `EmptyState` has exactly one (`Lessons.tsx:58`). `Progress` has zero real usages (the one grep hit in `WordRace.tsx` is a local `progress` state variable, not the component). `ToastProvider` is mounted at `main.tsx:14` but `useToast()` is never called anywhere. Every symptom below — hardcoded `red-500`/`green-500`, inconsistent focus rings, radius drift, 12 duplicated spinner blocks — is downstream of pages hand-rolling what the kit already provides.

### 2.6.1 Emoji usage (deliberate, not drift)

Decorative emoji used in 3 deliberate spots, NOT drift:
- `Home.tsx:37 👋` — greeting wave (warm tone, brand voice)
- `Home.tsx:44 🔥` — streak counter (visual reward)
- `Flashcards.tsx:19 EMOJI_POOL` — 20 emoji rotate as random card icon
  (decoration, not interactive control)
- `History.tsx:61 💬` — chat conversation icon

Tool grid (Home.tsx) uses lucide-react SVG icons (TutorIcon, CardsIcon,
etc.) from `navItems.ts TOOL_KEYS`, not emoji. Plan §2.6 was outdated
(cited lines 97/107/118 which no longer exist after refactor).

Decision: keep emoji as deliberate decorative elements. SVG icons
(lucide-react) for interactive controls. Document any new emoji as
`aria-hidden` since they convey no semantic info beyond what the
adjacent text already says.

## 2. Design system gaps

### 2.1 Adoption failure (the root cause)

| Component | Call sites | Consequence |
|---|---|---|
| `Input`/`Textarea` | 0 | Chat.tsx:98, Help.tsx:59, IpaTranscribe.tsx:40, Writing.tsx:51 hand-roll `<input>`/`<textarea>` with `focus:outline-2 focus:outline-primary` instead of the shared ring-based focus style. No `Field` label/error wiring anywhere. |
| `LoadingState`/`Skeleton` | 0 | 12 files independently hand-roll `<div className="flex justify-center py-16"><Spinner /></div>`: Challenge:60, Chat:62, Flashcards:149, GamesLeaderboard:53, History:110, LessonDetail:50, Lessons:53, Mistakes:52, PictureVocab:39, Profile:31, Rankings:58, Saved:42. |
| `EmptyState` | 1 (Lessons.tsx:58) | Every other empty list state is a bespoke `PageState` text block with no icon/CTA affordance. |
| `Badge` | 0 | Status pills (lesson locked/done, level, difficulty) are hand-rolled per page with inconsistent padding/color logic. |
| `Modal`/`ConfirmDialog` | 0 | Logout (Profile.tsx:152) and other destructive actions fire immediately on click, no confirm step. |
| `Toast` | 0 (provider mounted, unused) | Save/error feedback (e.g. Flashcards `toggleSave` catch block, Profile `.catch(() => {})`) is silently swallowed with no user-visible acknowledgment. |
| `Menu`, `Sheet`, `HeaderBar`, `Fab` | 0 | Dead code, no consumers. |

### 2.2 The `cn()` blocker (must be resolved before any Card-adoption fix)

`src/client/ui/cn.ts` is a plain class-joiner, not `tailwind-merge` — later classes don't reliably beat earlier ones from the same utility group, they just concatenate and let CSS source order decide. `Home.tsx:56-57` has a code comment documenting a real regression from this: `<Card className="bg-primary-hover">` lost to `Card`'s own `bg-surface` because of source order, so Home abandons `Card` entirely for its streak panel and hand-rolls the div. The same `bg-primary-hover` panel pattern is duplicated (not through `Card`) in `GamesLeaderboard.tsx:59`, `History.tsx:137`, and `Rankings.tsx:65`.

**This blocks the obvious fix** ("just use `<Card className="...">` everywhere") — it will silently fail the same way again. Resolve this first (see P0-1).

### 2.3 Token drift — hardcoded colors instead of semantic tokens

14 hardcoded `red-500`/`green-500` hits, all in the 5 game pages, doing the exact same job the `success`/`danger` tokens already do:
- Listening.tsx:174,201,202
- Matching.tsx:182,199,200
- Spelling.tsx:182,200,201
- WordGame.tsx:167,195,196
- WordRace.tsx:194,206,207

### 2.4 Radius drift

`--ui-radius: 0.625rem` → `rounded-ui` is the token, but 16 hits of `rounded-2xl`/`rounded-3xl` appear in Chat, Flashcards, History, Home, Lessons, Writing, WordRace with no evident intentional distinction (e.g. Flashcards' flip-card at `rounded-3xl` vs. its own action buttons at `rounded-ui` in the same file). No documented second radius tier exists — this reads as drift, not a deliberate "media card" token.

### 2.5 Arbitrary type values instead of a scale

29 `text-[…px]` arbitrary values across Flashcards, Help, History, Saved, Mistakes, Writing, PictureVocab, Profile (e.g. `text-[13px]`, `text-[11px]`, `text-[22px]`). No documented type scale exists for anyone to converge on.

### 2.6 Icon system fragmentation

`components/icons.tsx` defines only 9 SVGs (Home/Book/Chat/History/User/Check/Lock/Star/Send), used almost exclusively for nav (AppShell) and lesson-list status (Lessons.tsx). Everywhere else — Home's 14-entry tool grid, all 5 game pages, Flashcards, IpaChart/IpaTranscribe, Saved — icons are raw emoji embedded in JSX/data arrays. `StarIcon` is defined but has zero consumers (confirmed dead code); Saved.tsx and Flashcards.tsx instead use literal `★`/`☆` text glyphs for the identical "starred" concept `StarIcon` was clearly meant to cover.

### 2.7 Accessibility

- **`text-accent` fails contrast at small sizes, in all 3 themes (light mode).** `--orange` is a hand-picked hex per theme (theme.css:18,70,121), not oklch-derived like the rest of the palette, and it's applied to small semantic text: Saved.tsx:55, PictureVocab.tsx:76, LessonDetail.tsx:60 meaning lines, Flashcards.tsx:217 meaning text, XP figures. Computed contrast against `--card`/`bg-surface` white: teal `#f2792e` ≈ **2.8:1**, ocean `#b58f08` ≈ **3.0:1**, sunset `#4f93ff` ≈ **3.0:1** — all fail WCAG AA body-text (4.5:1); teal fails even the large-text/UI-component minimum (3:1).
- **Focus ring may be under-contrast.** `--ui-ring` is `oklch(from var(--teal) l c h / 35%)` — the only focus indicator on Button/Tabs/Switch/BottomNav is a 2px ring at 35% alpha. Worth verifying against WCAG 1.4.11 non-text contrast (3:1 against adjacent surface); 35% alpha on a light surface is a plausible fail.
- **Async errors aren't announced.** `PageState` (`components/PageHeader.tsx:30-36`) renders `tone="error"` text with no `role="alert"`/`aria-live`, so every failed fetch across ~15 pages is silent to screen reader users.
- **4 raw inputs bypass the accessible focus pattern**: Chat.tsx:98, Help.tsx:59, IpaTranscribe.tsx:40, Writing.tsx:51 use `focus:outline-2 focus:outline-primary` instead of `Input`'s `focus:ring-2 ring-ring` treatment — inconsistent, and outline-only focus is clipped by `overflow-hidden` ancestors in at least Chat's message list.

### 2.8 i18n note (constraint for implementation)

All user-facing strings go through `t()` from `src/client/i18n/LanguageProvider.tsx`, backed by `src/client/i18n/translations.ts`. Any new copy introduced by this spec (new `EmptyState` titles, new `ErrorState` copy, confirm-dialog text) must be added as a key there — never a literal string in JSX.

---

## 3. Global design system fixes

### 3.0 Decision: Card background/tone (resolve before anything else touches Card)

Add a `tone` prop to `Card` instead of relying on `className` overrides (which `cn()` cannot reliably win):

```tsx
// ui/Card.tsx
type CardProps = {
  tone?: "surface" | "primary" | "muted"; // default "surface"
  padded?: boolean;
  className?: string;
  ...
};

const TONE = {
  surface: "bg-surface text-fg",
  primary: "bg-primary-hover text-white",
  muted: "bg-surface-muted text-fg",
};

// root class: cn("rounded-ui border border-border shadow-sm", TONE[tone], padded && "p-4", className)
// primary tone: drop border-border (it reads as a seam on a solid primary panel) — border only for surface/muted.
```

This directly unblocks Home's streak card, History's level card, GamesLeaderboard's/Rankings' header panel — all become `<Card tone="primary">` instead of hand-rolled divs, with zero risk of the class-collision `Home.tsx:56-57` warns about.

### 3.1 Type scale (replaces the 29 `text-[…]` arbitrary values)

| Token (Tailwind) | rem / px | line-height | Use |
|---|---|---|---|
| `text-xs` | 0.75rem / 12px | 1rem | metadata, timestamps, captions |
| `text-sm` | 0.875rem / 14px | 1.25rem | body default, list secondary line |
| `text-base` | 1rem / 16px | 1.5rem | form inputs (iOS zoom guard), primary body |
| `text-lg` | 1.125rem / 18px | 1.75rem | card titles, list primary line |
| `text-xl` | 1.25rem / 20px | 1.75rem | section headers |
| `text-2xl` | 1.5rem / 24px | 2rem | page-level stat/greeting |
| `text-3xl` | 1.875rem / 30px | 2.25rem | PageHeader title (desktop) |

Rule: no `text-[…]` in page code. The two real outliers found (`text-[22px]` PageHeader mobile title, `text-[13px]`/`text-[11px]` micro-labels) collapse to `text-lg`/`text-xs` respectively — the 1-2px difference is not perceptible and isn't worth a bespoke value.

### 3.2 Spacing scale

Standardize on the existing Tailwind 4px scale, but constrain page code to this subset so spacing stops being page-specific:

- `gap-2` (8px) — inline icon/label gaps
- `gap-3` (12px) — related control clusters
- `p-4` (16px) — default card/list-row padding
- `p-5` / `sm:p-9` (20px/36px) — page content gutters (already the dominant pattern — keep it, just apply everywhere `main` wraps content)
- `mb-6` / `mb-7` (24px/28px) — section separation

Rule: `p-3.5`, `p-2.5`, `gap-2.5` (the halfway values currently sprinkled through Home/Flashcards/IpaChart) round up to the nearest step above (`p-4`, `gap-3`) — they add a visual-rhythm tax for no benefit.

### 3.3 Radius

Adopt `rounded-ui` (0.625rem) as the *only* card/button/input radius. Retire `rounded-2xl`/`rounded-3xl` from Chat, Flashcards, History, Home, Lessons, Writing, WordRace (16 sites, §2.4) — none of them represent an intentionally different "media card" tier, they're drift. Exception: Flashcards' flip-card (`Flashcards.tsx:201,205,214`) is a full-bleed hero object, not a list card — keep one deliberate larger radius there (`rounded-3xl`) and document it as the single named exception, everything else converges on `rounded-ui`.

### 3.4 Shadow tokens

No shadow tokens currently exist — `shadow-sm`/`shadow-lg` are used ad hoc (Card uses `shadow-sm`, Flashcards flip-card uses `shadow-lg`). Formalize two tiers only:
- `shadow-sm` — default resting elevation for `Card`, list rows, buttons.
- `shadow-lg` — reserved for actively-dragging/focused transient elements (Flashcards flip-card mid-drag, Modal/Sheet panels). Nothing else should use `shadow-lg`.

### 3.5 Motion tokens

Two durations cover everything already in use — name them so future code doesn't reinvent numbers:
- `--ui-duration-fast: 150ms` (hover/press states, focus rings)
- `--ui-duration-base: 250ms` (existing drag/flip/slide transitions in Flashcards, Modal, Sheet — already the value in use, just codify it)

### 3.6 Standardized empty/loading/error state

Consolidate `states.tsx` and `PageHeader.tsx`'s `PageState` into one contract so pages stop choosing between two near-identical APIs:

```tsx
// ui/states.tsx — extend with ErrorState, add role="alert"
export function ErrorState({ children, retry }: { children: ReactNode; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center text-sm text-danger">
      {children}
      {retry && <Button variant="outline" size="sm" onClick={retry}>{t("common.retry")}</Button>}
    </div>
  );
}
```
`LoadingState` replaces all 12 `flex justify-center py-16 / <Spinner />` blocks (§2.1 file list) verbatim — same visual, one implementation. `PageState tone="error"` (PageHeader.tsx:30-36) gets `role="alert"` added in place, no call-site changes needed.

### 3.7 Game-page component family (highest-leverage single extraction)

`Listening`, `Matching`, `Spelling`, `WordGame`, `WordRace` are ~80% identical: difficulty picker, timer/progress bar, result card, choice buttons — each hand-rolled 5 times with the same `red-500`/`green-500` hardcoding (§2.3). Extract to `src/client/components/game/`:

- `DifficultyPicker` — the repeated 3-button difficulty selector.
- `TimerBar` — wraps the existing `ui/Progress` component (currently 0 real consumers) instead of each page's hand-rolled bar.
- `ChoiceButton` — the correct/incorrect answer button, using `success`/`danger` tokens instead of `red-500`/`green-500`.
- `GameResultCard` — the end-of-round summary panel (score, replay CTA), built on `Card tone="primary"`.

This is the single biggest LOC-reduction and consistency win in the app — 5 files' worth of duplicated logic and drifted color usage collapse to 4 shared components plus 5 thin page-specific wrappers.

---

## 4. Per-page findings

### Home (`pages/Home.tsx`)
- Streak card (line 58) hand-rolled specifically to dodge the `cn()`/`Card` collision (documented in the code comment at lines 56-57) — becomes `<Card tone="primary">` once §3.0 ships.
- Tool grid (`TOOL_KEYS`, lines 16-31) and lesson/suggestion rails (lines 90-121) use `rounded-2xl` — converge to `rounded-ui` per §3.3, and `gap-2`/`p-3.5`/`p-4` spacing across the three rails should converge to `gap-3`/`p-4` per §3.2.
- 14 emoji used as tool icons with zero visual relationship to the 9-icon SVG set used two component-levels up (AppShell) — either extend `icons.tsx` to cover the top 6-8 most-used tools or accept emoji as the intentional "tool tile" style and stop mixing SVG (`BookIcon`/`ChatIcon`, lines 97/107) with emoji (line 118) inside the same page.
- No loading/error state for the lessons rail — if `api.lessons()` rejects, the rail just silently stays empty forever (no `.catch`).

### AppShell / nav (`components/AppShell.tsx`)
- Only 5/24 routes get persistent nav — correct scoping, no change needed.
- Sidebar (desktop) uses `icons.tsx` SVGs consistently — this is the one place the icon system isn't fragmented; worth using as the reference when consolidating §2.6.

### Chat (`pages/Chat.tsx`)
- Message input (line 98) is a raw `<input>`/`<textarea>` with `focus:outline-2 focus:outline-primary` — swap for `ui/Textarea` per §2.1/2.7, gets ring-based focus + `Field` error wiring for free.
- Loading block (line 62) — replace with `LoadingState` per §3.6.
- `rounded-2xl`/`rounded-3xl` message bubbles — converge to `rounded-ui` per §3.3 (bubbles are the kind of place a second radius tier could be *deliberate*, but currently it isn't documented as such, so treat as drift for now).

### Lessons (`pages/Lessons.tsx`)
- Already the best-adopted page: `Tabs` (shared component) and the only real `EmptyState` usage in the app (line 58) — use this file as the reference implementation when retrofitting other list pages.
- Loading block (line 53) still hand-rolled — swap for `LoadingState` for full consistency even though the rest of the page is already correct.
- Lock/check status icons correctly use `icons.tsx` (`LockIcon`/`CheckIcon`) — the one other consumer of the shared icon set besides AppShell.

### LessonDetail (`pages/LessonDetail.tsx`)
- Loading block (line 50) — swap for `LoadingState`.
- Meaning/definition text at line 60 uses `text-accent` — fails contrast per §2.7, route to `text-fg`/`text-primary` instead of the raw accent color for this weight of text.

### PictureVocab (`pages/PictureVocab.tsx`)
- Loading block (line 39) — swap for `LoadingState`.
- Line 76 meaning text uses `text-accent` at small size — same contrast fix as LessonDetail (§2.7).
- Image-forward card layout has no documented alt-text/labeling convention distinct from other list pages — confirm images carry meaningful `alt` (not just the English word) given this page is explicitly for vocabulary-by-picture.

### Game pages — WordGame / WordRace / Matching / Spelling / Listening
- All five: hardcoded `red-500`/`green-500` at the exact line numbers in §2.3 — replace with `success`/`danger` tokens as part of the `ChoiceButton` extraction (§3.7).
- All five: hand-rolled timer/progress bar duplicating `ui/Progress` (0 real consumers) — replace via `TimerBar` (§3.7).
- All five: near-identical difficulty-picker and result-card markup — extract `DifficultyPicker`/`GameResultCard` (§3.7) rather than fixing each file's colors independently, or the same drift reappears next time someone edits one game page and not the other four.
- WordRace specifically: local state variable named `progress` shadows the unused `Progress` component name in searches — no code issue, just a discoverability trap for whoever does the extraction (grep for the component by import path, not by string "progress").

### Login (`pages/Login.tsx`)
- Auth surface — should be the strictest page for input accessibility (this is the one page every unauthenticated user must clear) but does not use `ui/Input`/`Field`, so it doesn't get automatic label/error/aria-describedby wiring for free. Bring it onto `Field`+`Input` first, since it's the highest-traffic form in the app and validates the pattern before rolling it out elsewhere.
- No `ErrorState`/`role="alert"` on auth failure — a failed login is exactly the kind of error a screen-reader user most needs announced (§2.7).

### Flashcards (`pages/Flashcards.tsx`)
- Flip-card uses the one deliberately-kept `rounded-3xl` exception (§3.3) — fine as-is.
- Star toggle (lines 251) uses literal `★`/`☆` glyphs where `StarIcon` (dead code in `icons.tsx`) clearly was meant to cover this — wire `StarIcon` in here and delete the emoji-glyph approach, or delete `StarIcon` if the emoji approach is preferred; don't leave both.
- Meaning text (line 217) uses `text-accent` on `bg-primary-hover` (white text card back) — this specific instance is *not* the light-mode-on-white contrast failure from §2.7 (different background), but verify it separately since it's a different color pairing.
- `toggleSave` (line 125) swallows failures silently (`catch { /* best-effort */ }`) — wire to `useToast()` so a failed save isn't invisible.

### Profile (`pages/Profile.tsx`)
- Logout button (line 152-158) fires immediately with no confirmation — wrap in `ConfirmDialog` (0 current consumers, §2.1).
- Settings toggles use `Switch` (good — one of the few real adopters) but the language/session-size pill-groups (lines 67-90, 123-141) are hand-rolled segmented controls with duplicated class logic — worth a small `SegmentedControl` extraction if this pattern appears a third time elsewhere, otherwise leave (only 2 instances, same file, not yet a cross-cutting gap).
- Stat cards (lines 49-60) use `Card` correctly with `text-[11px]` labels — fold into `text-xs` per §3.1.

### PageHeader+list+PageState group — Saved, Mistakes, Rankings, GamesLeaderboard, IpaTranscribe, IpaChart
- Shared shape: `PageHeader` + `Card`-per-row list + `PageState` empty/error, loading via hand-rolled spinner block. Apply §3.6 (`LoadingState`) uniformly; no page-specific structural issues beyond what's already itemized.
- IpaTranscribe.tsx:40 and Help.tsx:59 raw `<input>` with `focus:outline` (§2.1/2.7) — same fix as Chat/Writing.
- GamesLeaderboard.tsx:59 and Rankings.tsx:65 both hand-roll the same `bg-primary-hover` header panel Home avoids via `Card` — becomes `<Card tone="primary">` per §3.0.
- Saved.tsx:55 uses `text-accent` on small meaning text — same contrast fix as LessonDetail/PictureVocab (§2.7).

### History (`pages/History.tsx`)
- Level card (line 137) hand-rolled `rounded-2xl bg-primary-hover` — becomes `<Card tone="primary">` per §3.0, and radius converges to `rounded-ui` per §3.3.
- Loading block (line 110) — swap for `LoadingState`.

### Writing (`pages/Writing.tsx`)
- Line 51 raw `<textarea>` with `focus:outline` — swap for `ui/Textarea` (§2.1).
- `rounded-2xl`/`rounded-3xl` hits — converge per §3.3.

### Help (`pages/Help.tsx`)
- Line 59 raw `<input>`/`<textarea>` with `focus:outline` — swap for `ui/Input`/`Textarea`.
- Otherwise a simple static content page — lowest-priority in this group.

### Appearance (`pages/Appearance.tsx`)
- Theme/mode picker is a bespoke selectable-list pattern (radio-like rows) not built on any shared `ui/` primitive — acceptable as a one-off given it's the only page doing theme selection, no cross-cutting fix needed here beyond spacing/type convergence (§3.1/3.2).

### NotFound (`pages/NotFound.tsx`)
- Minimal by design — verify it still gets a real i18n'd message and a `Link` home, no structural issue found.

### Challenge (`pages/Challenge.tsx`)
- Loading block (line 60) — swap for `LoadingState`; otherwise unremarkable, follows the standard `PageHeader`+`Card` list pattern cleanly.

---

## 5. Prioritized action list

Ordered by enablement — each item is scoped to be completable in one focused edit, and later items assume earlier ones are done (don't skip ahead or the same lines get rewritten twice).

### P0 — unblock everything else

1. **Add `tone` prop to `Card` (`ui/Card.tsx`)**: `"surface" | "primary" | "muted"`, default `"surface"`. This is the decision in §3.0 — make it before touching any hand-rolled `bg-primary-hover` panel, since `cn()` cannot safely override `Card`'s background via `className`.
2. **Migrate the 4 hand-rolled `bg-primary-hover` panels to `<Card tone="primary">`**: Home.tsx:58 (delete the Vietnamese comment at lines 56-57 once fixed), History.tsx:137, GamesLeaderboard.tsx:59, Rankings.tsx:65.
3. **Replace hardcoded `red-500`/`green-500` with `success`/`danger` tokens** at the 14 sites in Listening.tsx:174,201,202 / Matching.tsx:182,199,200 / Spelling.tsx:182,200,201 / WordGame.tsx:167,195,196 / WordRace.tsx:194,206,207.
4. **Add `role="alert"` to `PageState` `tone="error"` branch** in `components/PageHeader.tsx:30-36` — one-line fix, immediately makes every failed fetch across ~15 pages screen-reader-visible.
5. **Fix `text-accent` contrast for small semantic text**: route Saved.tsx:55, PictureVocab.tsx:76, LessonDetail.tsx:60 meaning/label text to `text-fg` or `text-primary`; reserve `text-accent` for large/bold display numbers (XP counters, streak numbers) where the failing contrast ratio is less critical to legibility.

### P1 — adopt the existing kit

6. **Add `LoadingState` usage to the 12 duplicated spinner blocks**: Challenge:60, Chat:62, Flashcards:149, GamesLeaderboard:53, History:110, LessonDetail:50, Lessons:53, Mistakes:52, PictureVocab:39, Profile:31, Rankings:58, Saved:42.
7. **Add `ErrorState` to `ui/states.tsx`** (per §3.6 snippet) and wire it into the 4 raw-input pages' failure paths (Chat, Help, IpaTranscribe, Writing) plus Login's auth-failure state.
8. **Swap the 4 raw `<input>`/`<textarea>` + `focus:outline` sites for `ui/Input`/`Textarea`**: Chat.tsx:98, Help.tsx:59, IpaTranscribe.tsx:40, Writing.tsx:51. Start with Login.tsx since it's unaudited but highest-traffic — bring it onto `Field`+`Input` first to validate the pattern.
9. **Wrap Profile logout (Profile.tsx:152-158) in `ConfirmDialog`.**
10. **Wire `useToast()` into at least the two silent-catch sites**: Flashcards.tsx:125 `toggleSave`, Profile.tsx's `.catch(() => {})` update handlers (lines ~114, ~130).
11. **Resolve `StarIcon` duplication**: either wire `icons.tsx`'s `StarIcon` into Flashcards.tsx:251/Saved.tsx's starred state, or delete `StarIcon` if the emoji-glyph approach is intentionally preferred — don't leave both.

### P2 — consistency/polish

12. **Extract game-page component family** (`components/game/DifficultyPicker.tsx`, `TimerBar.tsx` wrapping `ui/Progress`, `ChoiceButton.tsx`, `GameResultCard.tsx` on `Card tone="primary"`) and migrate Listening/Matching/Spelling/WordGame/WordRace onto it — do this after P0-3 lands so the extraction starts from already-token-correct colors.
13. **Radius convergence**: replace the 16 `rounded-2xl`/`rounded-3xl` hits (Chat, Flashcards, History, Home, Lessons, Writing, WordRace) with `rounded-ui`, keeping only Flashcards' flip-card (`Flashcards.tsx:201,205,214`) as the documented exception.
14. **Type scale convergence**: replace the 29 `text-[…]` arbitrary values (Flashcards, Help, History, Saved, Mistakes, Writing, PictureVocab, Profile) with the scale in §3.1 (`text-[22px]`→`text-lg`, `text-[13px]`/`text-[11px]`→`text-xs`).
15. **Spacing convergence**: replace halfway spacing values (`p-3.5`, `p-2.5`, `gap-2.5`) with the nearest step up per §3.2, starting with Home.tsx's three content rails and Profile.tsx's stat cards.
16. **Verify and, if needed, raise `--ui-ring` alpha** (`theme.css:36`, currently 35%) against WCAG 1.4.11 non-text contrast in light mode — one-line token change if it fails.
17. **Icon system consolidation**: decide whether to extend `icons.tsx` to cover Home's top tool-grid entries or formally accept emoji as the tool-tile style; either way, stop mixing both conventions within the same component (Home.tsx uses `BookIcon`/`ChatIcon` SVGs at lines 97/107 alongside raw emoji at line 118).
