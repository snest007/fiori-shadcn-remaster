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
node scripts/smoke-install.mjs     # fresh consumer app: shadcn init + add every block, build, render
node scripts/integrate.mjs …       # merging card branches — see docs/plan/INTEGRATION.md
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
9. **Accessibility is ported in full, never trimmed.** Everything UI5's `dist/<Name>Template.js` and `dist/<Name>.js`
   give assistive technology is part of the port: roles, every `aria-*` attribute and its states, hidden description /
   label texts (`ui5-hidden-text`, `aria-describedby` targets), live-region announcements (`announce()`, `aria-live`),
   the keyboard model, roving `tabindex` and focus management (initial focus, focus return, focus trap). Quote the UI5
   template or function in a code comment for non-obvious ARIA.
   - Every UI5 `accessibleName` / `accessibleNameRef` / `accessibleDescription` / `accessibleDescriptionRef` /
     `accessibleRole` / `accessibilityAttributes` has an equivalent: native `aria-*` props passed through to the element
     UI5 puts them on (document which element in the prop's JSDoc), or a named prop when UI5 builds the text itself.
     Every announced or hidden text is an overridable string (rule 5).
   - Customisation points (render props, `asChild`, custom cells/items/days, `className` slots) must not be able to drop
     ARIA: the component, not the consumer's render output, owns roles, `aria-selected`/`aria-expanded`/`aria-checked`
     /`aria-sort`/`aria-rowindex`…, ids and `tabindex`. Each customisation point gets a test that a custom render
     keeps them.
   - The accessibility tree must match UI5's for every fixture (`tests/a11y-tree.spec.ts`, added by card E4); deviations need an entry in
     the fixture set's `a11yDiff` with a concrete reason (e.g. "UI5 bug: role=listitem inside role=grid, filed as …"),
     never to make a failing test pass.
   - Don't remove or weaken an existing ARIA attribute, keyboard shortcut or announcement without the card saying so
     (rule 7 applies to accessibility behaviour too).

## Definition of done (every card)

- `pnpm generate && pnpm typecheck && pnpm registry:build` succeed.
- `PORT=4310 pnpm exec playwright test` passes with **0 failed and 0 flaky**; run it twice.
- The card's own acceptance checks all hold.
- Accessibility (rule 9): new or changed states have fixtures on both sides so `tests/a11y-tree.spec.ts` compares them;
  axe stays clean; new keyboard paths and announcements have behaviour tests.
- Git: work on a branch `codex/<card-id>`, small commits, messages in English, imperative mood. Don't push; don't merge.
  If you work in a separate worktree, leave the main checkout untouched (no edits, no branch switch) — an earlier run
  left an uncommitted draft and a stray branch there.
- SAPUI5 fixtures share one reference page: a popup you open must not stay painted outside its own cell (hide parents
  you replace, re-pin after `_applyPosition`), and it must not close because another fixture took focus.
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
- `page.waitForEvent("filechooser")` enables interception asynchronously: do a round trip (`await page.evaluate(() => 0)`)
  before the action that opens the chooser. Playwright workers are capped at 75%.
