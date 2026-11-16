# E4 — Accessibility parity: tree comparison vs UI5 + accessible* props audit

**Goal:** make "accessibility is ported in full" (AGENTS.md rule 9) checkable the same way pixel parity is. Compare the
accessibility tree of every fixture with UI5's, audit every UI5 `accessible*` property against our API, and close the
gaps found. Requested by the owner: accessibility must be preserved completely, and it must stay preserved through the
Storybook and AnalyticalTable work. Run before wave H; can run in parallel with wave S.

## 1. Tree comparison — `tests/a11y-tree.spec.ts` (new)

Same structure as `tests/visual.spec.ts`: open `/index.html?fixtures&…` and `/ui5.html?…`, wait for
`html[data-ready=true]`, then for each `[data-fixture]` cell take Playwright's `locator.ariaSnapshot()` on both pages
(it pierces UI5's shadow roots) and compare.

- **Normalise before comparing** (in a small `tests/a11y-tree-normalize.ts`, unit-tested): drop pure-presentational
  nodes Chromium already ignores; collapse whitespace in names; treat UI5's `ui5-hidden-text` content that ends up as
  the description the same as ours. Keep roles, accessible names, descriptions, states (`checked`, `selected`,
  `expanded`, `pressed`, `disabled`, `required`, `invalid`, `level`, `valuenow`/`valuemin`/`valuemax`) and nesting.
  Don't normalise anything else away: if a difference is real, it must show.
- **Matrix:** Morning Horizon cozy LTR for all fixtures (the tree doesn't depend on theme or density); plus RTL for
  fixtures whose name or order depends on direction (Slider, StepInput, Carousel, pickers).
- **Interactive states:** reuse the E1 interaction fixtures (open popups, focused items, expanded nodes) — the open
  surface is where most ARIA lives (listbox/option, dialog/aria-modal, menu/menuitem, grid/gridcell).
- **Phone fixtures** (`?fixtures-phone`) and **SAPUI5 fixtures** (`?fixtures-sapui5` vs the OpenUI5 page) get the same
  comparison in `tests/a11y-tree-phone.spec.ts` / `tests/a11y-tree-sapui5.spec.ts` — cases those pages already pair.
- **Allowed differences:** `FixtureSet` gets an optional
  `a11yDiff?: Record<string, { ignore: string[]; reason: string }>` keyed by case id. `ignore` lists the node paths
  that may differ; everything else in that case is still compared (ignoring a whole case is not allowed). The reason
  is printed with any failure. Allowed reasons: a documented UI5 bug (quote the UI5 source line), or a React/DOM
  difference with no effect in a screen reader (e.g. an extra `generic` wrapper). Not allowed: "we haven't ported it".
- **Report:** write `test-results/a11y-tree-report.json` (case → diff lines) like the pixel report, so integration can
  review it.

## 2. `accessible*` audit — `docs/plan/a11y-audit.md` (new, committed)

Generate the list with a script `scripts/a11y-audit.mjs` (new) from
`node_modules/@ui5/webcomponents*/dist/custom-elements.json`: for every component we ship, every member whose name
starts with `accessib` (170 today: `accessibleName`, `accessibleNameRef`, `accessibleDescription`,
`accessibleDescriptionRef`, `accessibleRole`, `accessibilityAttributes`, `accessibleMode`), plus every i18n text UI5
announces for it (`*_ARIA_*`, `*_ACC_*` keys used in its template). One row each: UI5 member → our equivalent (native
`aria-*` passthrough + which element, a named prop, or a `labels` key) → status (`ok` / `fixed in E4` / `gap`).

Then **close every gap**: add the passthrough or prop, a JSDoc line naming the element, a fixture case using it on both
sides (so the tree test covers it), and an assertion in the component's spec. `accessibilityAttributes` maps to
documented `aria-*` props on the right inner element (e.g. Button `aria-haspopup`/`aria-expanded`/`aria-controls`).

## 3. Customisation points keep ARIA

For every component that accepts custom rendering (`asChild`, render props, custom items/cells/days, `className`
slots): a test that renders a custom child and asserts the component-owned ARIA is still there (role, state attribute,
id references, `tabindex` for roving focus). List the components and the test names in the final message.

## 4. Announcements

Inventory every `aria-live` region and every place UI5 calls `announce()` for our components (grep the UI5 `dist/*.js`
we port). For each: our equivalent exists, it uses the same politeness (`polite`/`assertive`), and a test asserts the
announced text after the triggering action (value-state change, token deleted, items loaded, selection count, …).

## Files

Shared (allowed): `tests/a11y-tree*.spec.ts` (new), `tests/a11y-tree-normalize.ts` (new),
`scripts/a11y-audit.mjs` (new), `docs/plan/a11y-audit.md` (new), `docs/src/fixture-types.ts` (`a11yDiff` only),
`AGENTS.md` (only to adjust rule 9's wording to what was built), and for gap fixes each affected component's own files
(rule 3). Commit gap fixes per component (`E4: <component> — <gap>`), so integration can review them one by one.

## Acceptance

- AGENTS.md definition of done.
- `tests/a11y-tree.spec.ts` (and the phone/SAPUI5 variants) pass for every fixture; every `a11yDiff` entry has a
  concrete reason and a narrow `ignore` path.
- `docs/plan/a11y-audit.md` has no `gap` rows.
- Final message: number of fixtures compared, the `a11yDiff` entries with reasons, the gaps fixed (one line each), and
  the announcement inventory.
