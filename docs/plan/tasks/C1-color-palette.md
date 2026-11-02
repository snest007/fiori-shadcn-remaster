# C1 — ColorPalette and ColorPalettePopover

**Goal:** new components `color-palette` and `color-palette-popover` matching `ui5-color-palette` /
`ui5-color-palette-popover` 2.28.

## Read first

- `node_modules/@ui5/webcomponents/dist/ColorPalette.js` (777 lines), `ColorPaletteItem.js`, `ColorPalettePopover.js`,
  their `*Template.js`; CSS `generated/themes/ColorPalette*.css.js`; params `grep -- '--fiori-color-palette\|--fiori-x-color'`.
- "More Colors…" is a UI5 feature module: `dist/features/ColorPaletteMoreColors.js` + `ColorPaletteMoreColorsTemplate.js`,
  opened by `ColorPalette._openMoreColorsDialog` (CSS `generated/themes/ColorPaletteDialog.css.js`). Implement the dialog
  only after C2; until then `showMoreColors` renders nothing.

## Files

New: `registry/ui/color-palette.tsx`, `registry/ui/color-palette-popover.tsx`, items json, CSS, fixtures (+ .ui5.ts),
demos, specs. New shared helper `registry/lib/fiori-color.ts` (CSS color parsing/normalising, contrast for the
selected marker, recent colors storage) — C2 will extend it.

## Behaviour

- `ColorPalette`: items (`ColorPaletteItem value`), `showDefaultColor` + `defaultColor`, `showRecentColors` (5 recent,
  persisted only in component state unless UI5 persists — check), `showMoreColors` (see above), `onItemClick({ color })`,
  selected marker, keyboard grid navigation exactly as UI5 (rows of 5/7?, check `rowSize`), Home/End, wrap rules,
  default color button and recent row reachable by keyboard as UI5.
- `ColorPalettePopover`: `open`, `opener`, `onOpenChange`, same palette props; closes on select.

## Fixtures

Palette default, with default color + recent colors, selected item, popover surface in place.

## Tests

Keyboard grid navigation (all arrows, edges), selection fires `onItemClick`, recent colors update, popover close/focus.

## Acceptance

Pixel diff; AGENTS.md definition of done.
