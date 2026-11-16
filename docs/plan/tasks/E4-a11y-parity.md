# E4 — Accessibility parity: tree comparison vs UI5 + accessible* props audit

**Goal:** make "accessibility is ported in full" (AGENTS.md rule 9) checkable the same way pixel parity is. Compare the
accessibility tree of every fixture with UI5's, audit every UI5 `accessible*` property against our API, and close the
gaps found. Requested by the owner: accessibility must be preserved completely, and it must stay preserved through the
Storybook and AnalyticalTable work. Run after S0 is merged (section 5 needs its handoff) and before wave H; can run in parallel with S1–S5.

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

## 5. Defects handed off by the Storybook cards — `docs/plan/handoff/*-a11y-candidates/`

**Run E4 after S0 is merged.** At the start, list every `docs/plan/handoff/*-a11y-candidates/` directory on main
(S0's is always there; S1–S4 add their own when they find component defects — see "Component defects you find" in
their cards). Each holds a report and candidate patches. If S0's directory is missing, stop and report — don't recreate
the candidates from memory. Handle every directory present when you start; directories that arrive while E4 is in
flight: rebase/merge main before finishing and handle them too, or, if that would make E4 too large, leave them for S5
and say so in your final message.

S0's strict Storybook checks found five component defects. S0 kept its scope (docs only) and marked them as narrow
known issues in `tests-storybook/`; the owner decided they are fixed here. The patches were validated in an isolated
copy (Storybook 335 passed, owning regressions 215 passed) but **not** against the pixel suite and **not** against
E4's tree comparison: treat them as starting points, re-verify everything.

| Patch | Defect | UI5 2.28 does | Decision |
|---|---|---|---|
| `table-loading-grid-child.patch` | Loading overlay (progressbar) is a child of `role=grid` → axe `aria-required-children` | same violation | Fix (move overlay after the grid). Deviation from UI5's tree → `a11yDiff` entry: "UI5 places BusyIndicator inside role=grid (TableTemplate.js), axe aria-required-children". |
| `calendar-visible-range-name.patch` | Year-range button shows `2015 - 2034`, name is "Year range from 2015 to 2034" → axe `label-content-name-mismatch` | same violation | Fix (visible range + purpose via `aria-labelledby`, keep `labels.yearRangeButton` and its default). `a11yDiff` entry quoting `CalendarTemplate.js`. |
| `select-desktop-popup-semantics.patch` | No outer dialog around the listbox; hidden trigger stays in the Tab order while open | dialog exists but is unnamed (axe `aria-dialog-name`) | Fix (named dialog, trigger `tabindex=-1` while open, as `Select.js:_effectiveTabIndex`). `a11yDiff` only for the dialog name. |
| `input-pointer-focus-indicator.patch` | Focus ring painted on pointer focus | UI5 paints it on pointer too (`Input.css.js`) | Fix — **AGENTS.md rule 5 (keyboard-only focus ring) wins over UI5 here.** Touches shared `registry/styles/components/field.css`: run `tests/visual.spec.ts` for every field-based component (input, textarea, select, combobox, multi-*, pickers, step-input, search) and record any interaction-fixture change. No `a11yDiff` (focus paint isn't in the tree). |
| `table-keyboard-focus-reentry.patch` | Pointer marker survives keyboard re-entry, so no focus ring on Tab-in after a click | correct (`TableNavigation.js:_focusElement`) | Fix — plain bug, no deviation. |

For each defect (the five above and any from S1–S4 handoffs — decide those the same way: fix; `a11yDiff` entry with a
concrete reason when the fix deviates from UI5; AGENTS.md rules 5/9 win over UI5 where they conflict): apply (or
rewrite) the change in the component's own files, add/keep the fixture and behaviour test the report describes, run the
pixel suite and the tree comparison, then **delete the matching known-issue marker in `tests-storybook/`** in the same
commit (search for `fixed by E4 —`). When a directory's defects are all done, delete that handoff directory. At the end
`grep -r "fixed by E4 —" tests-storybook` must be empty (markers saying `fixed by E4-followup` belong to S5).

The report also lists four inherited failures — `SelectTrigger` / `SelectContent` with `asChild` and several children
throw Radix's "Slot … expected a single React element child". That is an API-shape issue, not ARIA: list it in your
final message as a follow-up, don't fix it here.

## Files

Shared (allowed): `tests/a11y-tree*.spec.ts` (new), `tests/a11y-tree-normalize.ts` (new),
`scripts/a11y-audit.mjs` (new), `docs/plan/a11y-audit.md` (new), `docs/src/fixture-types.ts` (`a11yDiff` only),
`AGENTS.md` (only to adjust rule 9's wording to what was built), `registry/styles/components/field.css` (section 5,
Input focus ring only), `tests-storybook/**` (remove `fixed by E4` markers only), `docs/plan/handoff/*-a11y-candidates/`
(delete each when done), and for gap fixes each affected component's own files (rule 3). Commit gap fixes per component (`E4: <component> — <gap>`), so integration can review them one by one.

## Acceptance

- AGENTS.md definition of done.
- `tests/a11y-tree.spec.ts` (and the phone/SAPUI5 variants) pass for every fixture; every `a11yDiff` entry has a
  concrete reason and a narrow `ignore` path.
- `docs/plan/a11y-audit.md` has no `gap` rows.
- Section 5: every handed-off defect fixed with tests (or explicitly left for S5 with a reason);
  `grep -r "fixed by E4 —" tests-storybook` is empty; `pnpm storybook:build && pnpm test:storybook` passes twice;
  every handled `docs/plan/handoff/*-a11y-candidates/` directory is deleted.
- Final message: number of fixtures compared, the `a11yDiff` entries with reasons, the gaps fixed (one line each), and
  the announcement inventory.
