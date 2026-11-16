# S0 accessibility candidates for E4

The owner explicitly kept S0's original scope on 2026-11-16: **do not merge component behavior changes into S0**. These five patches are review inputs for E4, not an applied implementation. The owner authorized committing only these patches and this report, and recording the five existing component defects in S0's tests at the narrow story/rule/node or story/focus-state boundaries below. Each known record uses:

> component defect, fixed by E4 — see docs/plan/handoff/S0-a11y-candidates

The wording identifies the owning follow-up card; it does not mean E4 is already implemented. E4's tree audit and E5's locale provider were absent during this work. Known-defect handling adds no axe rule disabling: the existing non-contrast audit and separate Morning Horizon contrast audit (excluding only disabled controls) remain in place. No component role/state is overridden by a story, and a new rule, node, story or focus failure remains a failure. All current controls keep their accessible-name checks. S0 source changes are JSDoc only.

## Reproduce from a checkout

The candidate base is `bb69dea` on `codex/S0`, including main merged at `dbeb594` and its real UI5 `definePromise`/render readiness barrier. The source behavior of Button, Input, Select, Calendar, DataTable, Dialog and Table remained unchanged during S0; shared `field.css` also remained unchanged.

Follow the repository's Node 24 / pnpm 10 setup, frozen install and `pnpm generate`. Do not add dependencies. Run:

```sh
pnpm storybook:build
PORT=4328 pnpm test:storybook
PORT=4328 SAPUI5_PORT=4329 pnpm exec playwright test --retries=0
```

Use a separate full source/config/assets copy or an isolated worktree when evaluating these patches. Apply them together only there, then run generate, typecheck, registry build, Storybook and owning regressions. Neither this report nor reproduction depends on ignored validation directories, screenshots or node_modules being checked in.

## Native comparison and known S0 boundaries

The installed oracle was **UI5 Web Components 2.28.1**. Fresh native components awaited definition, `definePromise`, the actual UI5 render queue and fonts before measurement. Morning Horizon and High Contrast Black produced the following settled results.

| Defect | Native UI5 / unmodified React | Narrow S0 record |
|---|---|---|
| Select Open popup | Native Popup has an unnamed desktop dialog. React lacks that enclosing dialog, while Radix hides the story root and leaves its trigger focusable. | `forms-select--open` only: `aria-hidden-focus` on `#storybook-root`; `landmark-one-main` on `html`; `page-has-heading-one` on `html`; `region` on the unique `[data-radix-popper-content-wrapper]`. Require expanded Country combobox, hidden root and visible owned Country choices listbox. |
| Calendar Year header | Native and React display `2015 - 2034` but name it `Year range from 2015 to 2034`, causing `label-content-name-mismatch`. | Only the visible `[data-slot="calendar-year-range-button"]`: `dates-calendar--year-picker`; `dates-calendar--custom-texts` explicitly opened in year mode and paged; or `dates-calendar--playground` while the `initialPicker` Control choice is exactly `year`. Verify current visible range and default/caller callback name. |
| DataTable Loading | Native and React expose the BusyIndicator's progressbar as an invalid grid child (`aria-required-children`). | `data-data-table--loading` only: Products `.fiori-table__grid[role=grid][aria-busy=true]`, with its unique existing loading progressbar inside the grid. |
| Input pointer ring | Native and React paint the inner ring on pointer focus; repository rule 5 requires keyboard origin only. | `forms-input--playground` only, pointer phase on the Company inner native input and its own input wrapper. All typing/name/ARIA and keyboard entry checks still execute. |
| Table keyboard reentry | React preserves its pointer marker when Tab enters through a native-style sentinel, suppressing the keyboard ring. | `data-data-table--playground` only, keyboard reentry to the first Notebook Basic 15 row, `aria-rowindex=2`, with the stale `data-pointer-focus` marker. Other navigation/focus assertions still execute. |

Calendar RTL was **not** a port mismatch: March 12 + ArrowRight focused March 13 in both native UI5 and React, with document, native Calendar and native DayPicker directions all confirmed RTL. `DayPicker.js:_onkeydown` explicitly changes the day by +1; it does not use ItemNavigation's mirroring. No RTL behavior patch is included. S0's test and JSDoc disclose this native limitation.

## Five proposed patches

1. **table-loading-grid-child.patch** — `registry/ui/table.tsx`. Move the existing loading overlay immediately after the grid without adding a layout wrapper. Preserve busy state, progressbar semantics, focus handling and positioned host.
2. **calendar-visible-range-name.patch** — `registry/ui/calendar.tsx`. Preserve the native default callback, caller callback, existing aria-label and title. Add owned visible-range and hidden-purpose IDs, and compose them through aria-labelledby. Reuse the existing displayed range; introduce no separator or replacement default text. Test arbitrary caller purpose text before/after paging and Enter into the year-range picker.
3. **select-desktop-popup-semantics.patch** — `registry/ui/select.tsx`. Add a named dialog/aria-modal scope around the component-owned listbox inside Radix's positioning surface. Gate the role by desktop state, never by label truthiness. Preserve caller tabindex on closed phone triggers; use owned -1 while open. Keep the wrapper's flex/max-height relation for item-aligned long lists. Existing naming/title props supply its name; empty caller labels retain the role.
4. **input-pointer-focus-indicator.patch** — `registry/ui/input.tsx` and shared `registry/styles/components/field.css`. Privately record document input origin at Input module load with a WeakMap and capture listeners, before a pointer-opened popup mounts its Input. Apply that origin during focus; retain local pointer/key/blur handling and gate only the existing ring. No new helper file, npm dependency or provider. This also covers programmatic focus and newly mounted Dialog autofocus.
5. **table-keyboard-focus-reentry.patch** — `registry/ui/table.tsx`. Remove the stale pointer marker before keyboard/programmatic `focusElement` navigation, including the already-active element path.

Native owning sources: `TableTemplate.js`, `TableNavigation.js:_focusElement/_onfocusin`, `SelectPopoverTemplate.js`, `PopupTemplate.js`, `Popup.js:_ariaModal`, `Select.js:_effectiveTabIndex`, `CalendarTemplate.js`, `DayPicker.js:_onkeydown`, `InputTemplate.js`, and `generated/themes/Input.css.js` in installed UI5 packages. Non-obvious behavior is cited in patch comments.

These proposals intentionally repair native UI5 accessibility bugs in the Loading tree and popup name, add the Calendar's visible label to its existing native purpose, and follow the repository's stricter keyboard-origin ring policy. They are not claims of identical native accessibility trees. E4 must document tree deviations and add both-side fixtures/behavior coverage when adopting fixes.

## Candidate validation evidence

All validation below used a fully independent source/config/assets copy with only node_modules symlinked. The final candidate was not applied to canonical source.

- Generate, typecheck, registry build, Storybook build and Pages build: exit 0.
- Final strict Storybook suite before complete docs inventory: **329 passed (1.2m)**, 0 failed/flaky/skipped.
- Final strict Storybook suite including six complete docs/actual-JSX inventory checks: **335 passed (1.2m)**, 0 failed/flaky/skipped.
- Final owning regressions (`calendar`, `select`, `table`, `a11y` specs): **215 passed (1.3m)**, retries 0, 0 failed/flaky/skipped.
- Boundary diagnostics: **28 passed, 4 explicitly inherited failures, 0 unexpected failures**. The four failures are SelectTrigger/SelectContent asChild in two themes; unmodified canonical source produced the same full errors and alerts: `Slot failed to slot onto its children. Expected a single React element child or Slottable.` These were not counted as passes and were not fixed by the candidates.
- Pointer-button programmatic Input focus and pointer-opened newly mounted Dialog Input autofocus: no ring. Keyboard Enter equivalents: ring. Canceled pointer followed by external Tab: ring. Disabled input touched without ever focusing, then enabled and entered through external Tab: ring.
- Select default refs, selection, focus return, F6/Shift+F6, closed-phone caller tabindex -1, empty-label retained dialog role, and item-aligned 102-option viewport bounds/End scrolling: passed in both themes.
- Loading host/overlay bounds and actual elementsFromPoint stacks at a scrolled growing footer and sticky/virtual header/body: equal to unmodified React baseline. The sticky/virtual header above the loader and growing footer below it are inherited stacking behavior.
- Before/after React screenshots: identical size for all eight cells. Loading, Calendar Year and Select Open had 0 changed pixels in both themes. Pointer Input changed only by removing its ring: 5128 pixels in Morning, 2536 in HCB. These are local before/after comparisons, not a replacement for full UI5 pixel acceptance.
- Settled after comparison: native Loading/Select/Year retained the listed defects; patched React had 0 axe violations in those states in both themes. Native pointer Input painted a 2px ring; patched React painted none. RTL day navigation stayed 12→13 on both sides.
- Independent read-only review concluded SAFE TO PRESENT; this was candidate review, not final S0/E4 card acceptance.

The first strict canonical diagnostic under the updated rules returned **319 passed (1.4m), 10 failed**; one was an incorrect mirrored Calendar RTL expectation and was corrected against the native source. A later candidate diagnostic returned **328 passed (1.1m), 1 failed** because addon-a11y's afterEach scan overlapped external axe. Tests now wait the actual StoryRender finished phase for render/name/error and axe checks; no sleep, retry or disabled addon was introduced. Raw violations and known records remain separate test attachments under the owner's narrow S0 exception.

## Documentation evidence and next owner action

Current canonical docs inventory: **6 passed (9.7s)**. It checked every non-primary story and actual JSX code for all six pilots. Story counts: Button 18, Input 15, Select 14, Calendar 15, DataTable 21, Dialog 16 — **99 stories**. Complete Morning/Evening docs screenshots were 1280×6535 for Button and 1280×16840 for DataTable; Dialog Open HCB was 1280×1000. The Pages base path, manager, full inventory, sources, Introduction and modal loaded with no page/console errors. Screenshots are deliberately not part of this six-file handoff.

Main's readiness correction is already merged into S0. E4 should recheck installed owning source, apply/revise candidates in its own authorized scope, add exact fixtures/tree deviations and regression cases, remove the corresponding S0 known records when defects disappear, and run its complete definition of done. E5 architecture remains separate. No component behavior was merged into S0, and no push or publication was performed.
