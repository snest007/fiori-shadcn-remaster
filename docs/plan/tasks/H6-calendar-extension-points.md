# H6 — Calendar extension points (and the date pickers that embed it)

> **On hold until X0 is approved (owner's decision, 2026-11-17).** The library follows one extension contract
> (`docs/plan/tasks/X0-extension-architecture.md` → `docs/extension-contract.md`), including a structural tier
> (`components` replacement + a context hook with prop getters). X0 rewrites this card to implement the approved
> Calendar design; the points below are the starting list, not the final API. Don't run H6 before that rewrite.

**Goal:** `Calendar` already has feature parity with ui5-calendar 2.28 (single/multiple/range, special dates,
`CalendarLegend`, month/year/year-range pickers, full keyboard model). What it lacks is **room to customise** — the
issue #1 reporter's point: consumers will want their own day content (prices, dots, badges, availability), styling per
state, and their own legend content, without forking the file. Add extension points following H1's extension
contract, without changing default rendering (pixel fixtures must stay identical) and without letting customisation
drop ARIA (rule 9) or locale behaviour (rule 10). Depends on E4 and E5 (merged); independent of H1–H5 (different files),
but reuse H1's contract wording — if H1 isn't merged yet, the contract text is in `docs/plan/tasks/H1-*.md`.

## Extension points

1. **Day content slot** — `renderDay?: (day: CalendarDayInfo) => React.ReactNode` rendering **inside** the
   component-owned day cell. `CalendarDayInfo`: `{ date, isToday, isSelected, isRangeStart, isRangeEnd, isInRange,
   isOtherMonth, isWeekend, isDisabled, isFocused, specialDate?, locale, defaultContent }` (`defaultContent` is the
   default number element so consumers can wrap it). The cell keeps `role="gridcell"`, `aria-selected`,
   `aria-disabled`, `aria-label` (formatted long date + special-day text, as today), `data-date`, and the roving
   `tabindex`; `renderDay` can't override them. Add `getDayLabel?: (day) => string` to append consumer text to the
   accessible name (e.g. "3 slots free") — content a sighted user sees must be in the name too.
2. **Same for the other pickers** — `renderMonth?`, `renderYear?` with matching info objects.
3. **Styling hooks** — stable `data-slot` on every part (`calendar-header`, `-day-picker`, `-week-number`,
   `-day-name`, `-day`, `-month`, `-year`, `-legend`, …; keep existing ones), state as `data-*` on day cells
   (`data-today`, `data-selected`, `data-range-start`, `data-range-end`, `data-in-range`, `data-other-month`,
   `data-weekend`, `data-disabled`, `data-special-type`), `classNames?: Partial<Record<CalendarSlot, string>>`, and
   `getDayProps?: (day) => React.HTMLAttributes<HTMLElement>` merged like H1's `getCellProps` (owned ARIA/tabindex
   filtered out with a dev warning).
4. **Legend** — `CalendarLegendItem` accepts `children` to replace its text and an `icon`/`marker` render slot; legend
   items keep their current ARIA.
5. **Texts and locale** — audit with E5's `i18n-audit.md` that every ui5-calendar / DayPicker / MonthPicker /
   YearPicker key has a `labels` entry (the existing prop stays the API; add `texts` as an alias only if E5 made that
   the convention); `locale` already exists — make sure `renderDay` info and `getDayLabel` receive it.
6. **Pickers** — `DatePicker`, `DateRangePicker`, `DateTimePicker` forward `renderDay`, `getDayLabel`, `getDayProps`,
   `classNames.calendar*` to their embedded Calendar (one `calendarProps?: Partial<CalendarProps>` passthrough is
   enough if that's simpler — pick one and document it).

## Fixtures and tests

- Fixtures stay identical by default. Add React-only demo examples (not pixel-compared — UI5 has no equivalent; say so
  in a comment) for: price per day, availability dots + custom legend, styled weekends via `classNames`.
- `tests/calendar.spec.ts`: `renderDay` content renders in every cell; owned attributes survive a `getDayProps` that
  tries to set `role`/`aria-selected`/`tabindex` (+ warning); `getDayLabel` text is in the accessible name;
  keyboard model unchanged with custom content (focusable children inside a day don't break roving focus —
  they get `tabindex=-1`); `data-*` states correct for range selection; DatePicker forwards the props; RTL and `de-DE`.
- Accessibility tree (E4) unchanged for all existing calendar fixtures.

## Files

Component-owned (rule 3) for `calendar`, `date-picker`, `date-range-picker`, `date-time-picker`: their
`registry/ui/*.tsx`, styles, demos, specs. Shared: none.

## Acceptance

AGENTS.md definition of done (rules 9 and 10); zero pixel or tree changes in existing calendar/picker fixtures; the
three demo examples work in all 4 themes and RTL; final message lists the new props with one-line descriptions.
