# H6b — Calendar: activated day in selection events, custom week numbers

**Goal:** close the two gaps the fiscal-calendar spike found that H6 doesn't cover (G4 and G3 in
`docs/spikes/fiscal-calendar/README.md`). With them, a consumer can build SAP fiscal-year-variant calendars on
`Calendar` without editing its source. The use cases are "click a day → select its whole fiscal period" and "show
fiscal weeks for a 4-4-5 variant". Default rendering, pixel fixtures, accessibility tree and keyboard model stay
identical. Both additions are additive (rule 7). Depends on **H6 (merged)**: it reuses H6's info objects, its
`getDayProps` filtering and its date-picker passthrough. Run it after H6, never at the same time: both edit
`calendar.tsx`.

## 1. Activated day in `onSelectedDatesChange` (gap G4)

Problem: when the selection changes, the consumer can't tell which day the user activated. The spike infers it from
range-mode internals (`dates[dates.length - 1]` after a full range restarts), which breaks as soon as Calendar's
range logic changes.

UI5 already carries this: `Calendar.js:_fireEventAndUpdateSelectedDates` fires `selection-change` with
`{ timestamp, selectedDates, selectedValues }`, where `timestamp` is the day that was pressed / Enter-ed / Space-d.
The event is cancelable; controlled `selectedDates` is our equivalent of `preventDefault`.

- Add an optional second argument: `onSelectedDatesChange?: (dates: Date[], detail: CalendarSelectionDetail) => void`
  with `CalendarSelectionDetail = { date: Date; picker: CalendarPicker; source: "pointer" | "keyboard" }`.
  - `date` is the activated day, or the month/year when `selectionLevel` is `"month"` / `"year"`. For Shift+Space,
    which selects a whole week in multiple mode, it is the focused day.
  - Quote the UI5 function in a code comment. Existing one-argument callbacks keep working, so this is not a breaking
    change.
- Fire it from every selection path: click, Enter, Space (keyup), Shift+click / Shift+Enter range extension,
  Shift+Space week toggle, and the month/year pickers when they select.
- `DatePicker`, `DateRangePicker` and `DateTimePicker` keep their own `onValueChange` API. They only forward this
  detail if H6 chose the `calendarProps` passthrough. Don't add a new picker callback.

## 2. Custom week numbers (gap G3)

Problem: the week column always shows calendar weeks. A 4-4-5 fiscal variant needs fiscal weeks (1…53, counted from
the fiscal year's first day). Today the consumer can only hide the column.

- Add `getWeekNumber?: (week: CalendarWeekInfo) => number`, with
  `CalendarWeekInfo = { days: Date[]; weekStart: Date; weekEnd: Date; defaultNumber: number; locale: string }`.
  - `defaultNumber` is what Calendar shows today.
  - The returned number feeds both the visible `fiori-dp-weekname` text and the row header's
    `aria-label={labels.calendarWeek(n)}`, so sighted and screen-reader users get the same number.
  - It returns a **number**, not a string, on purpose: `labels.calendarWeek` keeps its `(week: number) => string`
    signature (rule 7). Consumers rename the column with the existing `labels.weekNumber` / `labels.calendarWeek`
    (for example "Fiscal Week 14").
- **Contract for later week-numbering work:** consumers never compute or depend on Calendar's default week rule; they
  receive it as `defaultNumber`. A later card may change how `defaultNumber` is computed (see "Out of scope") without
  touching this API.
- UI5 has no equivalent. This is a React-only extension point. Say so in the prop's JSDoc, and add no UI5 fixture for
  it.

## Fixtures and tests

- Existing calendar / picker fixtures: zero pixel and accessibility-tree changes.
- `tests/calendar.spec.ts`:
  - The detail's `date` is the activated day for click, Enter, Space, Shift+click range end, Shift+Space week toggle
    and month/year selection.
  - In controlled range mode, a consumer that always sets `[periodStart, periodEnd]` from `detail.date` selects the
    correct period on every click. This includes clicking a day **before** the current range start, the case the spike
    couldn't detect.
  - `getWeekNumber` changes the visible number and the row header's accessible name.
  - `defaultNumber` equals today's number for de-DE and en-US around a year boundary (2026-12-28 … 2027-01-10).
  - RTL: the week column keeps its position and numbers.
- Demo (React-only, not pixel-compared; say so in a comment): a "Fiscal weeks" toggle in the calendar demo, or a
  story, showing 4-4-5 fiscal weeks from a literal period table. If wave S is merged, add the story
  (`docs/stories/dates/calendar.stories.tsx`).
- Spike: if `docs/spikes/fiscal-calendar/` is on main, update it to use both hooks. Replace the
  `dates[dates.length - 1]` inference with `detail.date`, replace `hideWeekNumbers={variant.weekBased}` with
  `getWeekNumber`, and update the README gap table. Its suite must still pass:
  `pnpm exec playwright test -c docs/spikes/fiscal-calendar/playwright.config.ts`.

## Files

Component-owned (rule 3) for `calendar` (and `date-picker`, `date-range-picker`, `date-time-picker` only if the
forwarding needs a type change), plus `docs/spikes/fiscal-calendar/**`. Shared: none.

## Out of scope (noted for a later card)

- **Week-numbering rule (verified against ui5-calendar 2.28 on 2026-11-17; fixed by card H6c).** Method:
  UI5 and ours side by side, 11 year-boundary months (2020–2028), 66 week rows per configuration. A UI5 "first day
  override" means the global `formatSettings.firstDayOfWeek` config; UI5 has no per-calendar prop for it.

  | Configuration | Rows that differ from UI5 |
  |---|---|
  | de-DE, en-US, en-GB, ar-EG — no `firstDayOfWeek` | 0 |
  | zh-CN — no `firstDayOfWeek` | 34 (e.g. week of 2020-12-28: UI5 1, ours 53) |
  | de-DE `firstDayOfWeek={1}` (what the date pickers pass) | 34 (week of 2020-12-28: UI5 53, ours 1) |
  | de-DE `firstDayOfWeek={0}` | 28 |
  | en-US `firstDayOfWeek={1}` | 60 (off by one all year) |
  | en-US `firstDayOfWeek={0}` | 0 |

  How UI5 numbers weeks (`DayPicker.js:_calculateWeekNumber` → `DateFormat` pattern `"w"` → `UniversalDate.getWeekByDate`):
  it takes the row's **last** day and applies the **locale's** CLDR rule (first day + minimal days, or
  `calendarWeekNumbering`). The first-day override only moves the grid columns; it never changes the week rule.
  en-US also uses a split week (`isSplitWeek`: week 1 always contains Jan 1). This model reproduces all 594 UI5 rows
  except 3 en-US split-week rows.

  So we have three defects, and none of them is the clean "ISO vs not" question first assumed:
  1. `calendar.tsx`: passing `firstDayOfWeek` forces minimal days to 1. UI5 keeps the locale's minimal days. Every
     DatePicker / DateRangePicker / DateTimePicker hits this, because they always pass the first day.
  2. `fiori-dates.ts:getWeekInfo`: Chromium's `Intl.Locale#getWeekInfo` omits `minimalDays`, and the fallback guesses
     4 for every Monday-first locale. UI5's CLDR says zh-CN is 1 (de 4, en_GB 4, en 1, ar_EG 6/1). Take minimal days
     from CLDR data (E5's locale packs, or UI5's `generated/assets/cldr/*.json` values) instead of guessing.
  3. en-US split week at year end: covered once 1 is fixed only if `weekNumber` also ports `isSplitWeek`.

  Fix path for that card: port UI5's model (row's last day, locale rule, split week for en-US), then optionally add
  `calendarWeekNumbering`. Add fixtures for zh-CN and for de-DE with an explicit first day, and add a year-boundary
  week-number test. All of this changes `defaultNumber` only, so the API in this card stays as it is. The comparison
  harness lived in a git-ignored scratch folder; rebuild it from this description if needed.
- Fiscal paging in the header, special periods 13–16 and a period grid. These belong to a separate
  `FiscalPeriodPicker`, not to `Calendar` (see the spike README).

## Acceptance

- AGENTS.md definition of done (rules 9 and 10).
- Zero pixel or tree changes in existing fixtures.
- With both hooks, the spike's `GAP` comments for G3 and G4 are gone and its suite passes.
- The final message lists the two new APIs with one-line descriptions.
