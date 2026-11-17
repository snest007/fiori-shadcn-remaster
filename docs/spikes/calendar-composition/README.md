# Calendar composition — X0 design and executable prototype

Draft for approval, 2026-11-17. [Library contract](../../extension-contract.md). Registry code is unchanged.
`calendar.tsx` is a refactored copy of `registry/ui/calendar.tsx` at base `5ed08d1`. Default state, classes, DOM tags
and UI5 behaviour remain the copied implementation. This is not a shipped Calendar API or a fiscal component.

## Run and verify

```bash
pnpm exec vite --port 5183 --strictPort
# /spikes/calendar-composition/index.html?mode=period&variant=Z445&date=2026-03-10
# /spikes/calendar-composition/index.html?mode=day&variant=V3&locale=de-DE&dir=rtl
pnpm exec tsc --noEmit -p docs/spikes/calendar-composition/tsconfig.json
pnpm exec playwright test -c docs/spikes/calendar-composition/playwright.config.ts
node docs/spikes/calendar-composition/packaging-proof.mjs
```

The suite has its own config/port (5184 by default, `PORT` override), zero retries, and stays out of the root test
suite. Results go to `/tmp/shadcn-fiori-X0-test-results` and `/tmp/shadcn-fiori-X0-results.json`, separately from root
Playwright results. Evidence summaries are recorded below after validation. No dependency changes.

## Components map and protected hosts

`components?: Partial<CalendarComponents>` replaces these parts. The replacement receives `defaultContent` and the
relevant `day`, `week`, `item`, `direction` or `buttonKind` info. Component identities should be stable functions
outside the consumer render. Each replacement runs inside an existing invariant host, so forgetting to spread a
prop cannot remove its role/ARIA/focus handlers. Default host tags/classes remain exactly the same.

| Key | Existing host / replacement responsibility |
|---|---|
| `Header` | `fiori-calheader-root`, inert layout; arrange header controls with the public protected button parts. |
| `NavButton` | Previous/next div with role=button, disabled, name and keyboard/mouse handlers; replace icon content. |
| `HeaderButton` | Month/year/year-range div with role=button, name, hidden state and shortcuts; replace content. |
| `DayGrid` | Day-picker outer div with keyboard/pointer handling; replace child layout using public grid/row/cell parts. |
| `Grid` | The semantic day grid; replace its child layout, retain grid ownership. |
| `Row` | Semantic row; replace row content while using protected cells. |
| `WeekNumber` | Row header, same visible/accessible number from `getWeekNumber`. |
| `DayCell` | Day gridcell with owned name, selected/disabled state, date identity and roving tabindex. |
| `GridPicker` | Generic month/year/year-range or consumer-item grid host; replace rows/cells, not keyboard handling. |
| `Cell` | Generic gridcell; arbitrary keyed item identity independent of Date. |
| `Legend` | Legend list host with roving focus; replace its content with protected legend items. |
| `LegendItem` | Legend listitem host; replace marker/text content. |

Public exports come from the **same Calendar item entry**: `Calendar`, `CalendarLegend`, `CalendarLegendItem`,
`CalendarNavButton`, `CalendarHeaderButton`, `CalendarGrid`, `CalendarRow`, `CalendarCell`, `useCalendar`, and their
public types. The spike keeps everything in one entry file; production may split helpers registered by that item.
Unlike unrestricted `asChild`, replacement of a semantic host tag itself is not supported.

## Context and behaviour

Proposed public `useCalendar()` facade:

```ts
{
  focusedDate, selectedDates, picker, labels, locale, weekConfig,
  dayGrid: { days, rows, weeks }, gridPicker: { kind, items, rowSize, focusedKey, selectedKeys, focusItem, selectItem },
  components, classNames,
  focus(date, moveDOMFocus?), select(date, { source, shiftKey? }),
  showPicker(picker), page(-1 | 1),
  getGridProps(extra?), getRowProps(rowKey, extra?),
  getRowHeaderProps(week | weekStart, extra?), getCellProps(date | item, extra?),
  getHeaderButtonProps("month" | "year" | "year-range" | -1 | 1, extra?)
}
```

The facade state properties and selected-date array are read-only. Grid model collections are also read-only inputs. Grid getters are available in the grid-part scope; header getters in every part.
Day and generic item info carry resolved locale, focused/selected/disabled state and defaultContent; month/year
shorthands and structural Cell replacements receive the same enriched item info.
`getGridProps` returns the semantic host's ARIA; the protected outer DayGrid/GridPicker host retains the delegated
keyboard handlers. Replacements use the protected parts within that boundary. T4 must compose these into a
standalone state/getter hook before allowing grid layouts outside Calendar. Internal activation/element factories
are not public context. H6 should build selectors directly from state models; this prototype collects the
already-built **React element model**, before overrides render (no DOM scraping), to reuse exactly the copied
attributes/classes. That implementation technique is not a stability promise.

- `selectedDates/defaultSelectedDates/onSelectedDatesChange` and `focusedDate/defaultFocusedDate/onFocusedDateChange`
  remain. `picker/onPickerChange` adds control; `initialPicker` remains the existing uncontrolled initial shorthand.
- `select(date, detail)` and selection callbacks preserve UI5 `Calendar.js:_fireEventAndUpdateSelectedDates`'s
  activated timestamp as `detail.date`. `detail = { date, picker, source: "pointer" | "keyboard" }`; Shift selection
  internally carries the modifier. One-argument callbacks remain valid. H6b ports every path, including week toggle.
- `getPage(date, dir, picker): Date | null` defaults to the copied UI5 month/12-month/20-year/160-year paging. `null`
  disables the direction. Header and plain PageUp/Down share the adapter; modified year shortcuts retain UI5's model.
  Controlled `focusedDate` remains an alternative for externally driven page changes. No separate mutable page
  state: do not create contradictory focus/page sources.
- `itemPicker` supplies `items`, `rowSize`, `label`, keyed `focusedKey/defaultFocusedKey/onFocusedKeyChange`, and
  `selectedKeys/defaultSelectedKeys/onSelectedKeysChange`. `items` have `{ key, text, date?, disabled? }`; `date` is
  optional and never identity. Unique stable keys support P13–P16 even when they share a date range. Item count comes
  from the model, not a fixed Calendar constant; rowSize is a positive integer, partial final rows are allowed.
  Production H6 unifies built-in and custom item engines; the spike retains the old built-in branches to prove exact
  defaults and runs the new keyed branch through the same GridPicker/Row/Cell boundaries and key model.
- Custom item grids keep arrows (horizontal direction mirrored in RTL), Home/End by row, Ctrl+Home/End by page,
  Enter on keydown, Space on keyup, and PageUp/Down through `page`. The default header shows the item model label and hides Gregorian month/year shortcut buttons. Date-picker F4 switching is suppressed for an
  arbitrary item model: it has no Gregorian month view. A future multi-view item consumer must supply an explicit
  view model rather than leave an invisible shortcut. Grid names and selection announcements are overridable;
  `itemPicker.texts.selected(label)` defaults to UI5 `LIST_ITEM_SELECTED`'s English selection status plus item name.
- `getWeekNumber({days, weekStart, weekEnd, defaultNumber, locale}): number` defaults to the current computation;
  visible number and `labels.calendarWeek(n)` receive the same value. It does not implement fiscal week logic.
  H6c corrects **defaultNumber** independently, including explicit-first-day/zh-CN/en-US defects.
- Extra cell props are merged with owned props; conflicting role/ARIA/id/tabindex/identity/ref fields warn and are
  ignored. Classes/styles concatenate/merge, handlers chain. Semantic getters are an aid, not permission to spread
  unsafe props afterwards. Neutral customisers retain the default tree; changed domain layouts get explicit names,
  selection/count/focus and axe assertions.

## H6 / H6b mapping and picker passthrough

| Original point | Decision and implementation owner |
|---|---|
| H6.1 `renderDay`, day info, `getDayLabel` | Keep T2 shorthands. `renderDay` is default DayCell content; DayCell replacement wins and receives that `defaultContent`. Label hook **appends** consumer meaning to the full reference date/range name. |
| H6.2 `renderMonth`, `renderYear` | Keep T2 shorthands for the default generic Cell. Year-range info uses the same generic model. No separate `renderYearRange` prop; use Cell/GridPicker replacement for structural needs. |
| H6.3 slots, states, `classNames`, `getDayProps` | Keep T1/T2. Preserve old data-slot names, add missing parts/state attributes; `getDayProps` adds decoration/observational handlers through the ownership filter. `classNames` uses the typed part keys above in the spike; production documents their existing data-slot correspondence. |
| H6.4 legend children and marker | Keep both content shorthands; add Legend/LegendItem replacements on owned hosts. No new fiscal legend implementation. |
| H6.5 labels/texts/locale audit | Keep all old labels. `texts` is the provider-facing rule-10 path; explicit legacy labels win over texts, which win over provider/defaults. Item info always carries resolved locale. No guessing translated defaults in X0. |
| H6.6 picker forwarding | One `calendarProps` passthrough for supported extension props, including components and all shorthands. No duplicated prop list on each picker. |
| H6b.1 activated-date detail | Keep separate H6b S implementation after H6; use the same context select/action detail for all paths. Replace fiscal inference with detail.date, never infer selection intent from array endpoints. |
| H6b.2 custom week numbers | Keep separate H6b S implementation; WeekNumber replacement does not replace the numeric policy hook. Custom consumers get defaultNumber, independent of H6c's correction. |
| H6c week-numbering bug fix | Unchanged card and scope; runs after H6/H6b/P2. No algorithm fixes in X0. |

No existing or planned content shorthand is removed. The design avoids adding separate `renderHeader`,
`renderDayGrid`, `renderWeekNumber`, `renderGridPicker`, paging-count or fiscal props: typed replacements/adapters
cover those needs. A structural override takes precedence over its shorthand by receiving shorthand output as
`defaultContent`, so consumers can compose instead of losing it.

**DatePicker/DateRangePicker/DateTimePicker:** one typed `calendarProps` passthrough forwards components, class maps,
content/label/week hooks, paging and texts. Omit field-owned selected/focused state and initial state, selectionMode/
selectionLevel, autoFocus, locale/min/max/firstDay settings and their overriding handlers. The field owns parsing,
formatted value, selection mode, validation, popover focus/close and bounds. Chain an observational
`calendarProps.onSelectedDatesChange(dates, detail)` after the field's action; retain the field's `onValueChange` API.
Inherited locale/bounds win and are present in the context. Do not allow a spread to replace field-owned behaviour.

Arbitrary `itemPicker` is excluded from a date field passthrough: P13's identity is not a Gregorian Date value.
Consumers compose a separate controlled field/popover with the standalone public Calendar item model for that use
case. This keeps Gregorian-only scope and date-field value semantics, while allowing fiscal day content/paging.

## Proofs and limitations

`main.tsx` imports the actual current Calendar fixture set(s), transforms only Calendar/legend component identities,
and reuses each fixture renderer and props. `parity.spec.ts` freezes today's date, compares every case in all four
themes and both densities, requires equal accessibility snapshots and **identical PNG bytes**. It has no tolerance,
baseline update or skip. At this base there are nine cases → 72 exact pair comparisons. Existing baseline defects
are intentionally preserved; this proves identity with today's registry, not that those defects are fixed.

`fiscal-consumers.tsx` imports only public exports from `./calendar`, plus the existing consumer-owned fiscal data
and adapter. It provides:

- A P01–P16 item grid per fiscal year, with special period identity, accessible names, selection status, one roving
  cell and header/keyboard fiscal-year paging.
- A day grid with period content in **every** covered cell and its accessible name, fiscal week row headers,
  activated-day whole-period selection (including a date before the prior range), and header/keyboard fiscal-period
  paging. Adapter expectations reuse the old spike's literal answer key; no period calculation moves into Calendar.

Ported tests cover adapter boundaries, day selection/keyboard/locale/variant changes and fiscal paging; new tests
cover the special-item grid, rows/page edges, RTL, names, announcements and axe with **no rule exclusions** in four
themes for both consumers. Extension probes cover neutral replacements, hostile props, getters/handlers, custom
focusable content and non-4-column/disabled item models. The original fiscal spike is unchanged and remains a
record of the old API gaps; H6b updates it on production implementation.

Production follow-ups are H6 and H6b; E5/P2 must supply locale/provider and full UI5 announcement corrections before
they run. This spike retains current English default-label resolution to keep strict default identity; it does not
pretend E5 is merged into this base. New domain names use consumer-overridable texts and Intl formatting. H6 must
register helper files and compare with UI5 through the existing oracle, not ship this throwaway file verbatim.

The copied day/month pickers also retain today's non-mirrored horizontal arrow keys in RTL; P2 owns that existing
parity gap before H6. The new keyed item model does mirror horizontal keys. The ar-EG fiscal proof checks localised
day/period/week names and numbers while preserving the copied day navigation. New custom week policies format their
visible number with Intl; the no-override week text stays the copied value for exact parity.

## Owner decisions (recommendations)

Approve both invariant semantic hosts and protected getters; reject unrestricted asChild on Calendar semantics.
Keep H6b as the two small additive policies after H6, then H6c's bug fix. Approve same-item exports and guarded
calendarProps passthrough; defer T4 and arbitrary fiscal items in date fields. Treat new APIs as documented
experimental for one release, under rule 7 throughout. Approve the bounded rollout list after each P group; full
rollout cards and rule 11 are written/activated only after that approval.

## Validation record

Final prototype checks:

```text
41 passed (16.6s)
✔ Calendar composition packaging OK: same installed item, public entry imports, strict build, fiscal period/day consumers rendered
✔ smoke install OK: 81 components, 7 blocks built and rendered without errors
✔ X0 document checks OK: seven decisions, 81 unique component rows, X1–X40, local links
```

Spike TypeScript and repository `pnpm generate && pnpm typecheck && pnpm registry:build` succeeded. The final spike
suite ran with four workers and zero retries; the packaging proof ran on that final code. Exact no-override parity
covered 72 pairs, and both fiscal modes passed axe in all four themes without exclusions. Test outputs are in
`/tmp/x0-spike-final4.log`, `/tmp/x0-packaging-final4.log`, `/tmp/x0-smoke.log` and `/tmp/x0-preflight-final.log`.

The first clean repository run (`PORT=4350 SAPUI5_PORT=4354 pnpm exec playwright test --workers=5 --retries=0`):

```text
1418 passed (7.3m)
```

The second clean repository run (`PORT=4350 SAPUI5_PORT=4354 pnpm exec playwright test --workers=3 --retries=0`):

```text
1418 passed (15.7m)
```

Both full runs recorded zero failed, zero flaky and zero skipped tests, with no runner errors. X0 is complete and
ticked with its prototype commit; the contract and implementation/rollout cards remain drafts for owner approval.
Logs/results are `/tmp/x0-full-run3.log`, `/tmp/x0-full-run3-results.json`, `/tmp/x0-full-run5.log` and
`/tmp/x0-full-run5-results.json`. Ports are isolated from other checkouts.

Earlier discarded root runs had one flaky result, then six failures/four tests that
did not run under high machine load; owning files were unchanged, and no root test, timeout, pixel tolerance or
baseline was altered. Final runs disable retries. Their logs are `/tmp/x0-full-run1.log` and
`/tmp/x0-full-run2.log`; the first clean run is `/tmp/x0-full-run3.log` with JSON results preserved separately.

A fourth attempt reported `1 failed` / `1417 passed (7.7m)` at
`tests/color-palette-popover.spec.ts:118` (the surface closed, but opener focus was not restored). That source and
test are unchanged. The focused zero-retry rerun passed (`1 passed (6.2s)`); it does not count as a full clean run.
The second clean full run used three workers and zero retries to reduce shared-machine pressure. Discarded-run evidence is preserved
in `/tmp/x0-full-run4.log`, `/tmp/x0-full-run4-results.json` and `/tmp/x0-color-focus.log`.

The [self-review record](VALIDATION.md) tracks the card's deliverables and preserved production limitations. Owner
approval, activation of rule 11, production H6/H6b, production stories and full rollout cards remain later work as
specified by X0; this proposal does not merge or publish them.
