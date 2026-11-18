# Spike: fiscal calendar on Calendar's public API

**Question.** Can a consumer support SAP S/4 fiscal year variants with `Calendar` as it is today, without editing
`registry/ui/calendar.tsx`? Which extension points are missing (input for cards H6 and X0)?

**Answer.** About half. Period *selection* and *validation* work today; period *display* in the day grid does not.
Fiscal *paging* and *special periods* need structural extension points (replaceable parts, overridable paging, a
generic grid picker). Card X0 designs them; the library itself doesn't get a fiscal component.

This spike is throw-away code: not a registry item, not in `pnpm test`, no edits outside this folder.

## Run it

```bash
pnpm exec vite --port 5181
```

Open `http://localhost:5181/spikes/fiscal-calendar/index.html?variant=Z445&date=2026-03-10`.
Query options: `variant=K4|V3|Z445`, `date=YYYY-MM-DD`, `locale=de-DE`, `dir=rtl`, `theme=…`, `density=compact`.

```bash
pnpm exec playwright test -c docs/spikes/fiscal-calendar/playwright.config.ts
```

Uses a running server on `PORT` if there is one (e.g. `PORT=5181`); otherwise it starts its own on 5182.

## Files

| File | Role |
|---|---|
| `fiscal-variants.ts` | The answer key: K4, V3 (April–March, year shift), Z445 (4-4-5 weeks, 53-week FY2026). Period boundaries are written out as literal rows, as an S/4 `I_FiscalYearPeriod` read would return them, never computed. |
| `fiscal-adapter.ts` | Consumer logic: date → regular period, period number → range (special periods 13–16 carry the last regular period's dates), next/previous period, fiscal week. Knows nothing about Calendar. |
| `fiscal-calendar.tsx` | The consumer component. It uses only `Calendar`'s public props. Each `GAP` comment marks a place the API fell short. |
| `fiscal-calendar.spec.ts` | 22 tests. The adapter is checked against the literal table. The UI tests cover click/keyboard selection, V3 year labels, paging across a fiscal year, special periods, variant switching, accessible names, de-DE + RTL, and axe in 4 themes. |

## What works with today's API

| Need | How | Prop(s) |
|---|---|---|
| Click / Enter / Space on a day selects its whole period | `selectionMode="range"`, controlled `selectedDates`; `onSelectedDatesChange` re-expands the chosen day to `[period.start, period.end]` | `selectionMode`, `selectedDates`, `onSelectedDatesChange` |
| Periods that start mid-month or span calendar years (Z445) | The range is just two dates; Calendar draws it across months | same |
| Screen readers hear the range ends | Calendar already adds "First / Last date of range" | built in |
| Limit to the variant's table | `minDate` / `maxDate` from the table's coverage | `minDate`, `maxDate` |
| Mark period boundaries | A special date (Type01 bar) on each period's first day; its `tooltip` also goes into that cell's `aria-label` | `specialDates`, `legend` |
| Calendar follows external period paging | Controlled `focusedDate` | `focusedDate`, `onFocusedDateChange` |
| Locale, RTL, themes, keyboard model, single roving tab stop | Unchanged; the consumer adds nothing | `locale` |

## Gaps → card H6 (extension points on Calendar)

| # | Gap seen in the spike | H6 item that would close it |
|---|---|---|
| G1 | A day cell can't show its period ("P03"), period colour band or boundary line. The only visual hook is the special-day bar. | 1 `renderDay` (+ 3 `data-*` states / `classNames` / `getDayProps` for a period band) |
| G2 | Only boundary days carry fiscal text in their accessible name. An ordinary day says nothing about its period (test `screen reader name …` documents this). | 1 `getDayLabel` |
| G3 | The week-number column shows calendar weeks. For 4-4-5 it should show fiscal weeks; the consumer can only hide it. | **Not in H6.** Add `getWeekNumber?(weekStart) => number \| string` or include the week column in `renderDay`'s slot model. |
| G4 | "Select the whole period" relies on range-mode internals (a click on a full range restarts with `[clicked]`). There is no "day activated" event and no way to say "this click selects span X". | **Not in H6.** Add `onDayActivate?(date, event)` (fires on click / Enter / Space before selection, preventable), or a `getSelectionRange?(date) => [start, end]`. |
| G5 | DatePicker / DateRangePicker don't forward any of this. A fiscal date *field* would need its own popover. | 6 passthrough (`calendarProps`) |
| G6 | `CalendarLegendItem` takes only `text`; no custom marker for "period band". | 4 legend `children` / marker slot |

## Structural gaps → card X0 (extension architecture)

The library won't ship a fiscal component (owner's decision, 2026-11-17: features are endless; the library provides
extension points). These needs show which **structural** points Calendar lacks. X0 designs them library-wide.

| Need | Structural point it requires |
|---|---|
| Page by fiscal period (header arrows, PageUp/PageDown) | Overridable paging step (default: UI5's Gregorian month) and a replaceable header. Defaults keep UI5 parity; overriding is the consumer's choice. |
| Special periods 13–16 | They have no days, so they can't be day cells. The consumer needs a **generic grid picker** (consumer-defined items, count, row size) with Calendar's keyboard model and ARIA, the same part the month/year pickers use. |
| A period grid (P01…P16 by fiscal year) | The same generic grid picker, plus a replaceable header that pages by fiscal year. |

## Suggested acceptance line for H6

> Without editing `calendar.tsx`, the fiscal spike replaces its `specialDates` boundary workaround with `renderDay`
> (period label in each cell) and `getDayLabel` (period in every cell's accessible name). All 22 spike tests still
> pass, plus one new assertion: every in-month cell's name contains its period. Default rendering, pixel fixtures and
> the accessibility tree stay unchanged.

G3 and G4 need a decision from the owner: extend H6, or open a small follow-up card.

## Notes

- Other-month cells are `aria-disabled` (UI5 parity), so a period that starts in the previous month can't be
  clicked from this month's grid. The user pages first. That is correct behaviour, not a gap.
- The visible range text goes through `Intl.DateTimeFormat#formatRange`, which follows the page locale. For de-DE it
  renders `30.03. – 26.04.2026`.
