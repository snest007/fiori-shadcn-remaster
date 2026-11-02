# C2 — ColorPicker (after C1)

**Goal:** `color-picker` matching `ui5-color-picker` 2.28, and wire ColorPalette's "More Colors…" to a dialog with it.

## Read first

- `node_modules/@ui5/webcomponents/dist/ColorPicker.js` (603 lines), `ColorPickerTemplate.js`,
  `dist/features/ColorPaletteMoreColors.js` + `ColorPaletteMoreColorsTemplate.js` (the palette's dialog);
  CSS `generated/themes/ColorPicker.css.js`, `ColorPaletteDialog.css.js`; params `grep -- '--fiori-color-picker\|--fiori-color-channel'`.
- Reuse `@/components/ui/slider` styles where UI5 uses its own slider markup only if identical; otherwise port UI5's.

## Files

New: `registry/ui/color-picker.tsx`, items json, CSS, fixtures, demo, spec. Edit: `registry/ui/color-palette.tsx`
(enable More Colors), `registry/lib/fiori-color.ts` (HSL/RGB/hex conversions).

## Behaviour

- Saturation/lightness area with draggable handle, hue slider, alpha slider (`simplified` mode hides inputs, as UI5),
  hex input and R/G/B/A (and H/S/L toggle if UI5 2.28 has it — check `_isHueValueChanged`, display mode toggle).
- `value` / `defaultValue` (CSS color string), `onValueChange`, `simplified`.
- Keyboard on the area and sliders as UI5 (arrows step, Shift faster?), inputs validate (value state negative on invalid).

## Fixtures

Default (fixed color), simplified, invalid hex input state.

## Tests

Pointer drag on area/hue/alpha changes value; keyboard; hex/RGB inputs round-trip; palette "More Colors…" opens the
dialog and applies the picked color.

## Acceptance

Pixel diff; AGENTS.md definition of done.
