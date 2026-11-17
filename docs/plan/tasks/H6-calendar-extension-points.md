# H6 — Calendar composition and content extension points

> **Approved with X0 on 2026-11-17.** Implement [docs/extension-contract.md](../../extension-contract.md) (read its
> amendments first) and [the Calendar design](../../spikes/calendar-composition/README.md). Depends on E4, E5 and
> **P2a merged** (Calendar and date pickers were split out of P2), and does not run alongside P2a or H6b/H6c.
> Amendment 1 applies: every T3 key here is backed by the X0 fiscal consumers and probes; don't add keys beyond the
> list below.

**Goal:** implement Calendar's T1/T2/T3 contract without changing no-override UI5 pixels, tree or interaction.
Consumers can replace reusable layouts and item models without forking Calendar. Fiscal components remain consumer
examples, not registry features. Keep all existing exports/props and planned content shorthands (rule 7).

## Source and prototype

Read UI5 2.28 `Calendar.js/CalendarTemplate.js/CalendarHeaderTemplate.js`, `DayPicker`, `MonthPicker`, `YearPicker`,
`YearRangePicker` and `CalendarLegend*` JavaScript/templates/generated CSS before porting behaviour. Quote non-obvious
ARIA and keyboard functions. Read X0's prototype and exact default comparison; **implement state-derived selectors**,
not its throwaway React-element model collector. No dependencies added.

## Implement

1. **T1:** root/part className, typed `classNames`, stable existing data-slot names and missing part slots. Day states
   include today, selected, range-start/end/between, other-month, weekend, disabled and special type. Preserve default
   classes/sizes. `picker/onPickerChange` adds controlled current view; existing `initialPicker` stays initial state.
   `texts` resolves via provider; legacy `labels` wins over texts/provider and remains public. Locale in all info.
2. **T2:** `renderDay(CalendarDayInfo)` inside owned DayCell; `getDayLabel` appends consumer meaning to the complete
   UI5 name; `getDayProps` merges decorative native props, classes/styles and observational handlers while filtering
   owned roles/ARIA/id/tabindex/identity/ref with dev warnings. `renderMonth`/`renderYear` use generic item info and
   `defaultContent`. Preserve roving focus with custom focusable content; do not introduce nested tab stops. Legend
   item `children` and `marker` are content slots, preserving list semantics and legend focus/highlighting.
3. **T3:** partial typed map: Header, NavButton, HeaderButton, DayGrid, Grid, Row, WeekNumber, DayCell, GridPicker,
   Cell, Legend, LegendItem. Boundary hosts remain component-owned; replacements arrange protected public parts,
   including CalendarGrid/Row/Cell/NavButton/HeaderButton, exported from the same installed item entry. Replacement
   gets shorthand output as `defaultContent` and relevant day/week/item/header info. No unrestricted semantic asChild.
4. **Context:** read-only focused date, selection, picker, labels, resolved locale/week config, components/class maps;
   focus/select/showPicker/page actions and typed grid/row/row-header/cell/header-button getters. Internal factories
   never appear in public facade. Getters merge extras as arguments and are used by default/protected parts alike.
5. **Policies:** `getPage(date, dir, picker): Date | null`, defaulting to UI5 paging, shared by header and plain
   PageUp/Down. Controlled focusedDate remains a supported external page source. Unify month/year/yearrange and
   custom keyed item models under the generic GridPicker; items have stable keys independent of optional dates,
   consumer-defined text/disabled state, count and positive rowSize; controlled/uncontrolled focus and selection.
   Partial rows and disabled focus recovery need deterministic tests. For arbitrary item grids, F4 must not silently
   switch invisible Gregorian views; use the design's explicit scope and document it.
6. **Date fields:** one guarded `calendarProps` passthrough on DatePicker/DateRangePicker/DateTimePicker. Forward
   supported components/shorthands/texts/paging. Exclude field-owned selection/focus/locale/bounds/open/autoFocus and
   arbitrary itemPicker; field parser/selection/validation/close/focus wins. Observational selection callback chains
   after field action; existing onValueChange stays. Document exact owning native targets and prop precedence.

H6b implements activated-date callback details and the numeric custom-week policy next. Design `select` and
WeekNumber to accommodate those additive policies; do not infer activated dates from selected arrays. H6c stays a
separate week-number algorithm fix. H6 must not change the default calculation or owned P2 baselines.

## Checks

- All existing Calendar/date-field fixtures remain pixel/tree identical; paired neutral structural overrides prove
  the same UI5 tree. No tolerance, skip or baseline growth.
- Custom day/month/year/legend content; merged class/style and handler checks; hostile role/aria-selected/tabindex/
  id/ref props warn and cannot change semantics; focusable custom children cannot break roving focus. Test replaced
  Header, DayGrid, GridPicker and cells using exported wrappers/getters, including a negative control missing them.
- Generic item tests: 16 distinct keys with shared dates, 10 items / rowSize=3 partial row, disabled item recovery,
  zero items, controlled/uncontrolled focus/selection, pointer/Enter/Space/Home/End/Ctrl edges, PageUp/Down, RTL.
- Date-field forwarding retains controlled field value, parser/validation, bounds, locale, open/close/focus return;
  conflicting passthrough values cannot override them. Calendar content receives resolved de-DE/zh-CN/ar-EG locale.
- Customise docs, one story per supported tier, UI5 key comments/text audit and React-only domain examples with a
  concrete reason. Full axe in four themes and RTL keyboard; a real installed consumer replaces a part using only
  the Calendar item entry. `node scripts/smoke-install.mjs` and AGENTS.md definition of done.

## Files

Component-owned (rule 3) for calendar, date-picker, date-range-picker, date-time-picker: ui, items (including helper
file registration), styles, fixtures on both sides, demos, specs, stories. New `registry/lib/calendar/**` helper files, if necessary,
are registered by the Calendar item and public imports remain through its entry. `docs/spikes/calendar-composition/**`
may be updated for production consumer validation. Shared: `docs/extension-contract.md` only for approved API
signatures/target documentation; mention it in the commit. No AGENTS.md edits or other P-owned baseline changes.

## Acceptance

AGENTS.md definition of done; exact default parity; the new Customise examples work in four themes and RTL; neutral
replacement trees match UI5; adversarial ownership and installed-consumer tests pass. Final lists public props,
components/context and passthrough precedence, test summaries and shared edits. H6b follows this card serially.
