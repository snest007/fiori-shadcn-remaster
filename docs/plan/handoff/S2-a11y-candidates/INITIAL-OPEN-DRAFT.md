# S2 — initial-open picker draft candidates

Owners: P2 (TimePicker), P2a (DateTimePicker). Discovered in the fifth-attempt Morning/HCB How screenshot review, 2026-11-19. The original six S2 patches and CANDIDATE-REPORT.md are unchanged.

## Defect and reproduction

An initially open TimePicker/DateTimePicker receives a valid text value, but its popup draft is initialized with new Date(). DateTimePicker additionally starts with previewDay=null, so the calendar shows today without the value's selected day and OK is disabled. Both components initialize correctly when opened through their field handler; the initial open/defaultOpen or an external controlled open transition bypasses that handler. This is component state, not a Storybook hook or caller-data defect.

The existing docs popover fixtures compose TimeSelectionClocks/DateTimeSelection directly with fixed values; they do not mount an initially open picker. Consequently their pixel comparisons do not exercise this path.

A separate headless consumer fixture mounts the unmodified registry components through the docs Vite server, outside Storybook. With a fixed UTC clock at 2026-11-19 08:10:20:

- React TimePicker with value='3:25:40 PM', formatPattern='h:mm:ss a', open=true: clock ARIA values 8 / 10 / 20.
- UI5 2.28 TimePicker with the same value, format-pattern='h:mm:ss a', value-format='h:mm:ss a', open=true: 3 / 25 / 40.
- React DateTimePicker with value='Mar 12, 2024, 3:25:40 PM', default medium format, open=true: 8 / 10 / 20, November 2026, no selected day.
- UI5 2.28 DateTimePicker with the same value/default medium format/open=true: 3 / 25 / 40 and March 12, 2024 selected.

TimePicker reference detail: UI5 has a separate valueFormat (default HH:mm:ss), unlike this registry's text-value API. The probe explicitly aligns its valueFormat and display pattern for a valid equivalent comparison. Earlier default-pattern probes are retained: UI5's initial tempValue also fell back to now after normalizing its value to 15:25:40. They are not evidence of a default-pattern parity difference. The explicit valid-format probe and the registry's successful trigger-opening path establish the registry draft defect.

Evidence: .integration/S2-evidence/fifth-20261119/picker-draft-probe.{html,tsx,mjs,json}, picker-draft-probe-explicit-pattern.log and *-initial-open.png; the plain-space/default-pattern probe JSONs retain the reference-format distinction.

## Source and proposed repair

- UI5 TimePicker.js/onBeforeRendering seeds tempValue from a valid value. TimePickerPopoverTemplate.js passes that tempValue to TimeSelectionClocks.
- UI5 DateTimePicker.js/_calendarSelectedDates and _timeSelectionValue read the valid value; its template feeds those into Calendar/TimeSelectionClocks.
- Registry time-picker.tsx initializes temp to new Date(); only setOpen(true) resets it from validate(s.text).
- Registry date-time-picker.tsx initializes previewDay=null and previewTime=new Date(); only setOpen(true) seeds the draft from the text/last valid value.

Candidate patches add a layout effect on a closed-to-open transition, including the first render, so public open/defaultOpen paths initialize the draft. An already-open draft is preserved while the user edits it. The patches are unapplied proposals; P2/P2a must validate them, including controlled open transitions, defaultOpen, invalid/empty values, cancel/submit, phone paths and localized formats, then add paired fixtures and run their acceptance.

## Narrow regression marker

The S2-only classifyS2InitialPickerDraft function in tests-storybook/known-issues.ts marks only rule 'initial-open-draft', five enumerated standalone Open stories, Morning/HCB, their exact public args and their component-owned hours spinbutton. It verifies all three current-time ARIA values, the selected AM/PM state, the unique visible picker dialog/clock, the linked canvas's open field/value, and DateTimePicker's absent selected day/disabled OK. No axe rule, strict-name helper, accessibility baseline or i18n baseline changes.

The dedicated s2-picker-draft.spec.ts fixes the clock deterministically, records the actual defect, and rejects other story/rule/primary contexts, a foreign duplicate hour button and changed owned ARIA values. P2/P2a remove this marker/test expectation as the repair lands and replace it with assertions for the supplied date/time.
