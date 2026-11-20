# D1 — Phone layouts for popups (after waves A–C)

**Goal:** on phone-sized viewports, popup-based fields open full-screen dialogs instead of popovers, as UI5 does through
`ResponsivePopover` (`isPhone()`), for: Select, ComboBox, MultiComboBox, MultiInput suggestions, DatePicker,
DateRangePicker, TimePicker, DateTimePicker, ValueHelpDialog (stretch), Menu (UI5 phone menu), Search.

## Read first

- `node_modules/@ui5/webcomponents/dist/ResponsivePopover.js` (11 `isPhone` uses), `ResponsivePopoverTemplate.js`,
  `generated/themes/ResponsivePopover.css.js`; the phone branches in `Select.js`, `ComboBox.js`, `MultiComboBox.js`,
  `DatePicker.js`, `TimePicker.js`, `Menu.js` (search `isPhone()`), and how the phone dialog header shows the field
  (e.g. ComboBox puts an input in the dialog header; DateTimePicker shows Date/Time toggle).
- `node_modules/@ui5/webcomponents-base/dist/Device.js` exports `isPhone`, `isTablet`, `isDesktop`, `supportsTouch` and an
  `internals` object — read how `isPhone` is computed and whether `internals` can be overridden for the UI5 fixture page.

## Files

New shared primitive: `registry/ui/responsive-popover.tsx` (+ items json, CSS, spec): renders Popover normally and a
full-screen Dialog with UI5's header (title + close button) when `useIsPhone()` is true. New hook
`registry/lib/use-is-phone.ts` — match UI5's detection as closely as a browser allows (touch + small viewport via
`matchMedia`), overridable by a `data-fiori-device="phone"` attribute on `<html>` for tests and demos.
Then edit each listed component to use it. This card is large: implement and merge in two steps if needed
(D1a: ResponsivePopover + Select/ComboBox/MultiComboBox/MultiInput; D1b: pickers, ValueHelpDialog, Menu, Search).

## Behaviour

Per component, match UI5's phone template: dialog header content, OK/Cancel footers where UI5 has them (MultiComboBox,
DateTimePicker), focus handling, value-state header. Desktop behaviour must stay byte-identical (existing fixtures prove it).

## Fixtures

Phone dialog surfaces for Select, ComboBox, DatePicker, DateTimePicker at a 375×667 cell: UI5 side needs
`isPhone` forced — check `@ui5/webcomponents-base/dist/Device.js` for a supported override (e.g. `setDevice` / test hooks);
if UI5 can't be forced deterministically, screenshot-compare manually and skipCompare with that reason.

## Tests

With `data-fiori-device="phone"` (and the mobile viewport preset): each component opens a full-screen dialog, keyboard and
close/cancel/OK behave as UI5; without it, popovers as before.

## Acceptance

AGENTS.md definition of done; all existing desktop fixtures unchanged (0 regressions in visual.spec).
