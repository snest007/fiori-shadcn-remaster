# AGENTS.md — rules for coding agents (Codex, Claude, …)

shadcn-fiori: SAP Fiori (Horizon) look **and** interaction for React, shipped as a shadcn registry.
Every visual value comes from SAP's open-source theme packages; every component is pixel-compared against
UI5 Web Components 2.28 (SAP's official implementation). Read `README.md` and `CONTRIBUTING.md` before any task.

## Where the work is

- Task backlog: `docs/plan/README.md` (index, order, dependencies) and one card per task in `docs/plan/tasks/`.
- Do exactly one task card per run unless told otherwise. A card lists its goal, the UI5 source to read, the files
  you may touch, the behaviour to reproduce, the tests to add, and its acceptance checks.
- When the card is done, tick it in `docs/plan/README.md` (`[ ]` → `[x]`) in the same commit.

## Environment

- Node 24, pnpm 10 (`pnpm install --frozen-lockfile`). Never add, remove or upgrade npm dependencies unless the card says so.
- Run `pnpm generate` once after install (tokens, icons, illustrations, component CSS are generated and git-ignored in part).
- Playwright needs Chromium: `pnpm exec playwright install chromium` if it is missing.
- If your sandbox blocks network or the browser, say so in your final message instead of skipping checks silently.

## Commands

```bash
pnpm generate                      # regenerate tokens / icons / illustrations / component CSS
pnpm typecheck                     # tsc --noEmit
pnpm registry:build                # registry.json + public/r (shadcn build)
pnpm build                         # docs site → dist/
PORT=4310 pnpm exec playwright test                      # full suite (builds + serves on PORT)
PORT=4310 pnpm exec playwright test tests/<name>.spec.ts # one spec
PORT=4310 pnpm exec playwright test tests/visual.spec.ts # pixel diff vs UI5, 4 themes × 2 densities
pnpm check                         # everything above, in order
pnpm dev                           # http://localhost:5173 (docs), /?fixtures, /ui5.html, /block.html?name=<block>
```

Always pass a `PORT` other than 4173/5173 to Playwright so it builds and serves its own copy.

## Hard rules

1. **Source of truth is UI5 2.28 in `node_modules`** (`@ui5/webcomponents`, `@ui5/webcomponents-fiori`), not memory and
   not the web. Read the component's `dist/<Name>.js`, `dist/<Name>Template.js` and `dist/generated/themes/<Name>.css.js`
   before writing code. Quote the UI5 file/function you ported in a code comment where behaviour is non-obvious.
2. **No hard-coded design values.** Use `--sap*` tokens and `--fiori-*` parameters from `registry/styles/fiori.css`
   (`grep -- '--fiori-<component>' registry/styles/fiori.css | sort -u`). If a value has a parameter, use the parameter.
3. **Component file ownership.** Each component owns `registry/ui/<name>.tsx`, `registry/items/<name>.json`,
   `registry/styles/components/<name>.css`, `docs/src/fixtures/<name>.tsx` + `<name>.ui5.ts`, `docs/src/demos/<name>.tsx`,
   `tests/<name>.spec.ts` — including `registry/items/<name>.json` when you add imports (update its `dependencies` /
   `registryDependencies`). Edit other files only if the card lists them; call out any other shared edit in the commit message.
4. **Pixel parity is the bar.** New visual states get fixtures on both sides. The visual test fails a cell above 2% differing
   pixels or on any size difference. Fix causes; don't raise `tolerance` or add `skipCompare` without a concrete reason
   written in a code comment (e.g. "UI5 animates X and it can't be frozen").
5. **Keyboard focus ring only for keyboard** (`:focus-visible`). Text defaults in English, every user-visible string
   overridable by a prop. Value states are `none | negative | critical | positive | information`.
6. **Tests must be deterministic.** Wait for the state you assert on (focus moved, value re-rendered) before the next key
   press; scope locators to your own demo (`#<name>-demo …`) — the docs page holds every component. Never fix a flaky
   test by adding retries or sleeps.
7. **Don't break public APIs.** Adding props is fine; renaming or removing exported names/props needs the card to say so.
8. Tailwind v4 arbitrary vars: `h-(--fiori-x)`, `text-(length:--sapFontSize)`, `font-(family-name:--sapFontFamily)`;
   line height `leading-[normal]` (not `leading-normal`). No `-webkit-font-smoothing`. No `transition` unless UI5 has it.

## Definition of done (every card)

- `pnpm generate && pnpm typecheck && pnpm registry:build` succeed.
- `PORT=4310 pnpm exec playwright test` passes with **0 failed and 0 flaky**; run it twice.
- The card's own acceptance checks all hold.
- Git: work on a branch `codex/<card-id>`, small commits, messages in English, imperative mood. Don't push; don't merge.
- Final message: what changed (files), test summary lines (copy them), anything skipped or deferred and why,
  any shared file you touched.

## Gotchas already paid for (don't rediscover them)

- UI5 fixtures that use `@ui5/webcomponents-fiori` must import `@ui5/webcomponents-fiori/dist/Assets.js`.
- Icons used in a `.ui5.ts` fixture must be imported individually (`@ui5/webcomponents-icons/dist/<icon>.js`).
- Popups are compared "in place": see `docs/src/fixtures/ui5-popup-in-place.ts` and `ui5-picker-popover.ts`.
  "If feasible" in a card means: try the in-place helper; if the UI5 side still can't render the open surface
  deterministically inside the cell after a real attempt (≈1 hour), add `skipCompare` for that one case with the reason,
  cover it with a behaviour test, and mention it in your final message.
- Blocks install into `components/<name>.tsx`; a block may not share a name with a component (the build fails).
- Fixture ids, demo element ids and test ids are prefixed with the component name.
- The `file-uploader` "Enter opens the file picker" test is load-sensitive in Chromium; Playwright workers are capped at 75%.
