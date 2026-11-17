# H6c — Calendar week numbers: match ui5-calendar 2.28 (+ `calendarWeekNumbering`)

**Goal:** the week-number column shows the same numbers as UI5 2.28 for every locale, with or without
`firstDayOfWeek`, in `Calendar` and in the calendars that `DatePicker`, `DateRangePicker` and `DateTimePicker` embed.
Also port UI5's `calendarWeekNumbering` property, which sets the first day of the week and the week-1 rule together.
This is a bug fix: the API changes are additive (rule 7) and only the computed week numbers change.

Depends on **E5 (merged)**, which adds the locale fixtures `calendar-l10n-de-DE/zh-CN/ar-EG`. Order: after H6 and
H6b. All three cards edit `calendar.tsx`, so never run this one in parallel with them. H6b's
`getWeekNumber({ defaultNumber })` receives the corrected number automatically. If H6b is merged, its API doesn't
change; if not, this card doesn't depend on it.

## Evidence (measured 2026-11-17)

Our Calendar and ui5-calendar were rendered side by side over 11 year-boundary months (2020–2028), 66 week rows per
configuration. The full table is in `docs/plan/tasks/H6b-calendar-selection-detail-week-numbers.md` → "Out of scope".
Summary:

- Without `firstDayOfWeek`, de-DE, en-US, en-GB and ar-EG match UI5. zh-CN differs in 34 of 66 rows.
- With `firstDayOfWeek`, every Monday-first locale differs at year boundaries (de-DE 34/66), and en-US
  `firstDayOfWeek={1}` is off by one all year (60/66). The date pickers always pass `firstDayOfWeek`, so **every
  date-picker popover is affected**.

## UI5 behaviour to port (rule 1 — read these, quote them in comments)

- `DayPicker.js:_buildWeeks` → `_calculateWeekNumber(date)`: the number of a row is the week of the row's **last**
  day (the date after `dayOfTheWeek === DAYS_IN_WEEK - 1`), formatted with pattern `"w"` and `calendarWeekNumbering`.
- `DayPicker.js:_getFirstDayOfWeek`: the grid's first column comes from `calendarWeekNumbering` (if not `Default`),
  else the `formatSettings.firstDayOfWeek` config, else the locale. This first-day override moves **columns only**;
  `_calculateWeekNumber` never receives it.
- `@ui5/webcomponents-localization` → `sap/ui/core/date/UniversalDate.js:getWeekByDate`, `getFirstDayOfFirstWeek`,
  `isSplitWeek`, `calculateWeeks`; `CalendarUtils.js:getWeekConfigurationValues`;
  `sap/base/i18n/date/CalendarWeekNumbering.js` (`ISO_8601` 1/4, `MiddleEastern` 6/1, `WesternTraditional` 0/1);
  `LocaleData.js:firstDayStartsFirstWeek` (true only for `en-US`).
  - Week 1 starts on the `firstDayOfWeek` on or before Jan 1, moved a week later if fewer than
    `minimalDaysInFirstWeek` days of it fall in January.
  - Split week: in `en-US` with `Default` / `WesternTraditional`, the week count runs from that year's own first week
    without rolling into the next year. The last row of December can be week 53 while UI5 shows the week containing
    Jan 1 as week 1.
- Week data: UI5's CLDR files
  (`@ui5/webcomponents-localization/dist/generated/assets/cldr/<locale>.json`, keys `weekData-firstDay`,
  `weekData-minDays`).

## Defects to fix

1. **`calendar.tsx` week number rule.** `weekNumber(week[6], firstDay, firstDayOfWeek === undefined ?
   weekInfo.minimalDays : 1)` couples the week rule to the first-day override. Instead, compute the week of the row's
   last day with the **locale's** week configuration (or `calendarWeekNumbering`'s). The `firstDayOfWeek` prop keeps
   moving the columns only. Keep the prop and its meaning (rule 7). Fix its JSDoc, which today implies it is the full
   week setting.
2. **`fiori-dates.ts:getWeekInfo` minimal days.** Chromium's `Intl.Locale#getWeekInfo` returns no `minimalDays`. The
   fallback (`firstDay === 1 ? 4 : 1`) is wrong for zh-CN and about 20 other Monday-first locales that use 1
   (e.g. `hr`, `ro`, `tr`, `uk`, `vi`, `ru_UA`, `es_AR`, `en_AU`), and for `pt_PT` (Sunday-first, 4). Replace the guess
   with a generated table of `minimalDays` (and `firstDay`) per locale, built from UI5's 78 CLDR JSON files.
   - New `scripts/generate-week-data.mjs` writes `registry/lib/fiori-week-data.ts` (committed, deterministic, run by
     `pnpm generate`).
   - Lookup order: exact tag, then language + region, then language, then CLDR's `001` default (1/1).
   - Prefer `Intl` only where it actually supplies a field and agrees with CLDR. Add a test that the table and UI5 agree.
   - Register the new file in the items that ship `fiori-dates.ts`.
3. **Split week (en-US).** Port `isSplitWeek` / the split-week branch of `getWeekByDate` into `weekNumber` (or a new
   `weekOfYear(date, config, locale)` in `fiori-dates.ts`). Keep `weekNumber`'s exported signature working: it is
   public through the registry; add a new function rather than change its parameters.

## New prop: `calendarWeekNumbering`

- `calendarWeekNumbering?: "Default" | "ISO_8601" | "MiddleEastern" | "WesternTraditional"` on `Calendar`,
  `DatePicker`, `DateRangePicker` and `DateTimePicker`. All four forward it to the embedded Calendar, as UI5's
  `DatePickerPopoverTemplate.js` / `DateRangePickerTemplate.js` / `DateTimePickerTemplate.js` do.
- Default `"Default"` (locale data). A non-`Default` value sets both the first column and the week-1 rule, and it beats
  `firstDayOfWeek` for the first column (UI5 `_getFirstDayOfWeek` order). Document the precedence in the JSDoc.
- Export the type `CalendarWeekNumbering`.
- Date pickers: stop passing `firstDayOfWeek ?? getWeekInfo(locale).firstDay`. Pass `firstDayOfWeek` (possibly
  undefined) and `calendarWeekNumbering` through, so a picker's popover numbers weeks exactly like a standalone
  `Calendar` with the same props.

## Fixtures (both sides) and tests

- UI5 fixture renderers: `calendarWeekNumbering` maps to the `calendar-week-numbering` attribute. A UI5
  `firstDayOfWeek` case needs the global `formatSettings` config, which applies to the whole reference page. Do
  **not** add such a case to the shared `/ui5.html`. Cover explicit `firstDayOfWeek` with behaviour tests against
  numbers from UI5's algorithm instead, and say so in a comment.
- New pixel + tree fixtures (React + `.ui5.ts`), each showing a year-boundary month (focused 2027-01-15 and 2020-12-15):
  - `calendar-weeks-de-DE`, `calendar-weeks-zh-CN`, `calendar-weeks-en-US`, `calendar-weeks-ar-EG`;
  - `calendar-weeks-iso` (`calendarWeekNumbering="ISO_8601"` in `en-US`);
  - `calendar-weeks-middle-eastern` (`MiddleEastern` in `de-DE`).
  - Add an RTL variant of `ar-EG` if the existing l10n fixture doesn't already cover direction.
- `tests/calendar.spec.ts` — a week-number table test with expectations written as literals (taken from the UI5
  reference, never computed with our function):
  - locales `de-DE`, `en-US`, `en-GB`, `zh-CN`, `ar-EG`, `pt-PT`;
  - × `firstDayOfWeek` undefined / 0 / 1;
  - × months 2020-12, 2021-01, 2024-12, 2026-12, 2027-01;
  - and the four `calendarWeekNumbering` values.
  - Include the three en-US split-week rows (weeks starting 2020-12-21, 2024-12-23, 2026-12-21 → 53 with
    `firstDayOfWeek={1}`).
- `tests/date-picker.spec.ts` (and range / time): the popover's week column equals a standalone `Calendar`'s for
  de-DE year-boundary months.
- Row header accessible names (`labels.calendarWeek(n)`) follow the new numbers. The accessibility baseline doesn't
  grow.
- If wave S is merged: add a "Week numbering" story in `docs/stories/dates/calendar.stories.tsx` with a control for
  `calendarWeekNumbering`.

## Files

Component-owned (rule 3): `calendar`, `date-picker`, `date-range-picker`, `date-time-picker` (ui, items, fixtures,
demos, specs, stories).

Shared, listed here so the card may touch them:
- `registry/lib/fiori-dates.ts`;
- `registry/lib/fiori-week-data.ts` (new, generated);
- `scripts/generate-week-data.mjs` (new);
- `package.json` (`generate` script only);
- the registry items that list `fiori-dates.ts` as a file.

Call out each shared edit in the commit message.

## Acceptance

- AGENTS.md definition of done (rules 9 and 10).
- Every week row in the new fixtures matches UI5 (pixel and tree).
- The literal table test passes for all locales × first-day settings × months.
- Existing calendar and date-picker fixtures: no pixel changes except week-number digits in year-boundary months.
  List any such fixture by id in the final message.
- A date picker's popover and a standalone `Calendar` with the same props show the same week numbers.
- The final message lists `calendarWeekNumbering` (with precedence over `firstDayOfWeek`), the generated week-data
  file, and the corrected locales.
