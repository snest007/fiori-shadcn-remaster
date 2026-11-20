# S0 — Storybook: setup, theme toolbar, docs page, deploy + pilot stories

**Goal:** add Storybook as the main place to browse components: one sidebar entry per component, one story per
variant/state, live Controls, "Show code", the usage guidance from G0, the install command, and a toolbar that switches
the 4 Horizon themes × 2 densities × LTR/RTL. Requested in the follow-up to issue #1 ("the current docs page is hard
to browse"). This card builds the setup and writes stories for a pilot set only; S1–S4 fill in the rest, S5 closes
coverage.

The existing docs site (`docs/`, `?fixtures`, `ui5.html`, `block.html`) stays as it is: the pixel-diff and behaviour
tests depend on it. Storybook is an additional entry point, not a replacement.

## Dependencies (this card is allowed to add them)

Exact pins, as **devDependencies**, all on the same version: `storybook`, `@storybook/react-vite`,
`@storybook/addon-docs`, `@storybook/addon-a11y` — **10.6.7** (latest stable on 2026-11-16; its `@storybook/react-vite`
peer range covers Vite 8, React 19 and TypeScript 5.9). Don't use the 11.x beta. Don't run `storybook init` (it rewrites
`package.json` and adds sample stories); write the config by hand. Nothing else; if one more package turns out to be
required, stop and explain why in your final message instead of adding it.

## Setup

1. **Aliases shared with the docs build.** Move the `resolve.alias` list from `vite.config.ts` into `vite.aliases.ts`
   (new, exports the array) and import it from `vite.config.ts` — behaviour of the docs build must not change.
2. **`.storybook/vite.config.ts`** (new): a minimal Vite config for Storybook only — `react()`, `tailwindcss()`, the
   shared aliases. Point Storybook at it with `core.builder.options.viteConfigPath`. Reason: the root config sets
   `root: "docs"` and a multi-page `rollupOptions.input`, which must not leak into the Storybook build.
3. **`.storybook/main.ts`**: framework `@storybook/react-vite`; stories `docs/stories/**/*.stories.tsx` and
   `docs/stories/**/*.mdx`; addons docs + a11y; `typescript.reactDocgen: "react-docgen-typescript"` so Controls and the
   props table come from the real prop types in `registry/ui/*.tsx`; `docs.defaultName: "Docs"`; telemetry off
   (`core.disableTelemetry: true`).
4. **`.storybook/preview.tsx`**:
   - `import "../docs/src/index.css"` (Tailwind + `fiori.css` + component CSS, same as the docs site).
   - `globalTypes` with toolbar menus: **Theme** (`sap_horizon` Morning Horizon, `sap_horizon_dark` Evening Horizon,
     `sap_horizon_hcb` High Contrast Black, `sap_horizon_hcw` High Contrast White), **Density** (cozy / compact),
     **Direction** (ltr / rtl). Defaults: Morning Horizon, cozy, ltr.
   - A decorator that sets `data-theme`, `data-density` and `dir` on `document.documentElement` (exactly how
     `docs/src/main.tsx` does it — fiori.css keys off those attributes) and paints the canvas with
     `var(--sapBackgroundColor)` and `var(--sapTextColor)`; in docs mode apply the same to each story block so dark and
     HC themes don't sit on a white page.
   - `parameters.docs.source.type = "code"` (show the story's JSX, not a generated guess).
   - Sidebar order: Introduction, then categories in the order of `DemoCategory` in `docs/src/demos/types.ts`
     (Actions, Forms, Dates, Data, Overlays, Display, Navigation, Layout), then Floorplans.
5. **Story helpers — `docs/stories/_lib/`** (new):
   - `meta.ts`: `fioriMeta({ name, component, category, title? })` returns the CSF `meta` object: `title` =
     `<Category>/<Title>`, `component`, `tags: ["autodocs"]`, and `parameters.fiori = { name }` for the docs page.
     Category comes from `docs/src/demos/*.tsx` (the demo whose `docs[].name` lists the item) — parse it, don't
     hand-maintain a second list.
   - `argTypes.ts`: merges descriptions from the demo's hand-written `docs[].props` (`"Button.variant"` → `variant` on
     the `Button` story component) over docgen's, so prop docs written for the docs site aren't lost where the source
     has no JSDoc.
   - `DocsPage.tsx`: the autodocs page template — title, `description` from `registry/items/<name>.json`, the
     **install command** (`npx shadcn add @fiori/<name>`, copy button), **When to use / Don't use** from the item's
     `usage` (render nothing when absent; alternatives link to their Storybook page), then the primary story with
     Controls, the props table, and every other story with its code. Import item JSON directly (Vite JSON import).
6. **Introduction page** — `docs/stories/Introduction.mdx`: what the library is, how to install the registry, how to
   use the theme/density/direction toolbar, links to the docs site, the fixtures page and the GitHub repo.
7. **Scripts (`package.json`):** `"storybook": "storybook dev -p 6006 --no-open"`,
   `"storybook:build": "pnpm css && storybook build -o storybook-static --quiet"`,
   `"test:storybook": "playwright test -c playwright.storybook.config.ts"`. Add `storybook-static/` to `.gitignore`.
   Add `pnpm storybook:build && pnpm test:storybook` to the end of `check`.
8. **Deploy:** `build:pages` builds Storybook into `dist/storybook/` **after** the docs build (the docs build empties
   `dist/`). Storybook's static output uses relative URLs; verify it works under
   `https://snest007.github.io/fiori-shadcn-remaster/storybook/` by serving `dist/` under that base path locally.
   `.github/workflows/ci.yml`: add `pnpm storybook:build && pnpm test:storybook` after the main suite.
9. **Docs site link:** in `docs/src/main.tsx`, a "Storybook" link in the ShellBar — `./storybook/` in production builds,
   `http://localhost:6006/` under `pnpm dev`. Nothing else in the docs site changes.
10. **tsconfig:** add `.storybook` and `docs/stories` to `include` so `pnpm typecheck` covers them.
11. **AGENTS.md:** add `docs/stories/<name>.stories.tsx` to the component file-ownership list (rule 3), the Storybook
    commands to "Commands", and a line under "Definition of done": a new visual state or prop also gets a story.
12. **README:** a short "Browse in Storybook" section with the Pages URL and `pnpm storybook`.

## Story-writing rules (binding for S1–S5)

- One file per registry item: `docs/stories/<category-lowercase>/<name>.stories.tsx`. Items that share a demo today
  (e.g. `label`/`input`/`select`, `token`/`tokenizer`) still get one file each.
- **`Playground` first**: the main component with `args` for its top-level props and Controls for each — unions as
  `select`/`inline-radio`, booleans as toggles, strings as text, callbacks wired to `fn()` from `storybook/test` so
  the Actions panel logs them. Hide props that make no sense as controls (`className`, `asChild`, refs, render props)
  with `table: { disable: true }` or `control: false`.
- Then **one story per meaningful variant or state**, named for what it shows: every `variant`/`design`, every value
  state (`none | negative | critical | positive | information`), disabled, read-only, required, sizes, selection modes,
  with/without icon, empty, loading, overflow, long text. Take the list from the component's fixtures
  (`docs/src/fixtures/<name>.tsx`) — every fixture case that's a distinct *state* should have a story; pure pixel
  edge cases need not.
- **Compositions** where the component is meant to be used with others (Form with fields, Dialog with footer Bar,
  Table with Toolbar), as real-world examples — short, English, realistic data.
- **Controlled behaviour works**: stories that need state use `useArgs()` or a small wrapper with `React.useState` so
  typing, selecting and toggling behave as in an app. Owner's clarification (2026-11-18): a render function that
  calls `useArgs()` uses `storybook/preview-api` hooks (`useState`, `useEffect`, `useRef`…) for its own state, never
  React's, because Storybook throws when both are mixed. **"Show code" is copy-pasteable** means it shows the real
  component usage (imports, props, JSX, data) a reader adapts to their app; it may contain the story's Storybook
  state plumbing (`useArgs`, `storybook/preview-api`, `fn()`) and is not required to run unchanged outside
  Storybook. That is how `.storybook/story-source.ts` has worked since S0; it is not a shared-setup defect.
- **Overlays** (Dialog, Popover, Menu, pickers, value help, …): a trigger story *and* an `Open` story rendered open
  (`defaultOpen`/`open` arg) with `parameters.docs.story = { inline: false, height: "<px>" }` so the docs page shows the
  open surface without covering other stories.
- **Full-page components and blocks** (ShellBar, DynamicPage, ObjectPage, FlexibleColumnLayout, floorplans):
  `parameters.layout = "fullscreen"`.
- Rules from AGENTS.md apply: no hard-coded design values (only Tailwind classes backed by `--sap*`/`--fiori-*`
  tokens, layout utilities like `flex gap-2` are fine), English strings, icons via `@/lib/fiori-icons`.
- Stories only import from `@/components/ui/*`, `@/components/blocks/*`, `@/lib/*` and `docs/stories/_lib/*` — never
  from `docs/src/fixtures` or `docs/src/demos` (stories are user-facing examples; copy the JSX if a demo is a good
  starting point).
- **Accessibility is part of every example** (AGENTS.md rule 9): every story gives each control an accessible name
  (a `Label` with `htmlFor`, `aria-label` on icon-only buttons, a title for dialogs); compositions keep the
  label/field/description links; no story overrides a component-owned role or state. Stories that show a
  customisation point (custom cell, item, day) keep the component's ARIA, and the a11y test below checks it. The docs
  page shows an **Accessibility** section per component, taken from the component's JSDoc and E4's
  `docs/plan/a11y-audit.md` when present: keyboard shortcuts, the `aria-*`/`labels` props for names and announcements,
  and which element they land on.
- **Localization is part of every example** (AGENTS.md rule 10): stories never hard-code a `locale` or a component
  text unless the story is about it, so the Locale toolbar (added by E5) drives them. Each component with `texts` /
  `labels` gets one `CustomTexts` story overriding a few of them, and the docs page lists the component's text keys
  (with their UI5 key and English default) under **Localization**. Direction-dependent components get an `RTL`
  story (`globals: { dir: "rtl" }`).
- Component source files are **not** edited by S-cards, with one exception: adding a missing JSDoc comment to a prop
  type (comment only, no code change) so it shows in the props table. List such edits in the commit message.

## Pilot stories (this card writes these — they set the bar for S1–S4)

`button`, `input`, `select`, `calendar`, `data-table`, `dialog`. Read each one's `registry/ui/<name>.tsx`, fixtures and
demo first so the stories cover what the component really supports.

## Tests — `tests-storybook/storybook.spec.ts` + `playwright.storybook.config.ts` (new)

Separate Playwright config (own `testDir`, so the main suite is unaffected) that serves `storybook-static/` on
`PORT` (default 4320) with `vite preview --outDir storybook-static` or an equivalent already in the dependencies.

- **Every story renders:** read `index.json`, open each story's `iframe.html?id=<id>&viewMode=story`, wait for
  `#storybook-root` to have content, assert no `pageerror` and no `console.error`.
- **Toolbar globals apply:** `iframe.html?id=<button playground>&globals=theme:sap_horizon_dark;density:compact;dir:rtl`
  → `<html>` has `data-theme="sap_horizon_dark"`, `data-density="compact"`, `dir="rtl"`, and the canvas background is
  the theme's `--sapBackgroundColor`.
- **Docs page:** `?path=/docs/actions-button--docs` (via `iframe.html?viewMode=docs&id=actions-button--docs`) shows
  the install command and, for `data-table` (has `usage`), the "When to use" section; a `button` page without `usage`
  shows no empty section.
- **Controls drive the component:** on the Button playground set `args=variant:emphasized` → the button has the
  emphasized background (compare computed `background-color` to `--sapButton_Emphasized_Background`).
- **Accessibility:** axe (`@axe-core/playwright`) on every story in Morning Horizon and High Contrast Black, same rule
  set as `tests/a11y.spec.ts`, including `color-contrast` in Morning Horizon (with the same disabled-control
  exclusion). Every interactive element in a story has a non-empty accessible name (assert via
  `getByRole(...).all()` + `accessibleName`). Every story with a Playground: changing each select/radio Control keeps
  axe clean. Keyboard: on each pilot Playground, Tab reaches the component and the focus ring shows only after a
  keyboard action (`:focus-visible`).
  - **Known component defects (owner's decision, 2026-11-16):** five defects the pilot checks found in component
    source (Table loading overlay inside `role=grid`, Calendar year-range name mismatch, Select popup dialog semantics,
    Input focus ring on pointer, Table focus re-entry) are fixed by **E4**, not here. Commit the candidate patches and
    report to `docs/plan/handoff/S0-a11y-candidates/`. In `tests-storybook/`, mark each affected check as narrowly as
    possible — the specific story, axe rule and node selector, or the specific focus assertion — with the comment
    `component defect, fixed by E4 — see docs/plan/handoff/S0-a11y-candidates`. No global rule disabling, no
    baselines, no skips of whole stories.
- Deterministic: wait for the state you assert; no sleeps, no retries beyond the config default.

## Files

Shared (allowed): `package.json` (the 4 devDependencies + scripts), `pnpm-lock.yaml`, `vite.config.ts`,
`vite.aliases.ts` (new), `.storybook/**` (new), `docs/stories/**` (new), `tests-storybook/**` (new),
`playwright.storybook.config.ts` (new), `tsconfig.json` (`include` only), `.gitignore`, `.github/workflows/ci.yml`,
`docs/src/main.tsx` (ShellBar link only), `AGENTS.md`, `README.md`, `docs/plan/handoff/S0-a11y-candidates/**` (new).

## Acceptance

- AGENTS.md definition of done (main suite still 0 failed / 0 flaky, twice).
- `pnpm storybook:build && pnpm test:storybook` passes twice with 0 failed / 0 flaky.
- `pnpm build:pages` produces `dist/storybook/index.html`, and it loads under the `/fiori-shadcn-remaster/storybook/`
  base path.
- No pilot story has an axe violation or an unnamed control, apart from the marked E4 defects; the docs page of each pilot has its Accessibility
  section.
- Final message: screenshots of the Button and Data Table docs pages in Morning Horizon and Evening Horizon, and of the
  Dialog `Open` story in High Contrast Black; the list of stories per pilot component.
