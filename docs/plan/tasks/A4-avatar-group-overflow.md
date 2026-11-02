# A4 — AvatarGroup overflow "+N"

**Goal:** `AvatarGroup` hides avatars that don't fit and shows a "+N" overflow button, as `ui5-avatar-group` 2.28.

## Read first

- `node_modules/@ui5/webcomponents/dist/AvatarGroup.js` — `_overflowItems`, `_onResize`, `_getWidthToItem`,
  `_overflowButtonText`, `hiddenItems`, `overflowButton` slot, `_fireGroupEvent` (`overflowButtonClicked`),
  `click` detail, `_ariaLabelText`.
- `AvatarGroupTemplate.js`; CSS `generated/themes/AvatarGroup.css.js`; params `grep -- '--fiori-avatar-group'`.

## Files

Own: `registry/ui/avatar.tsx` (AvatarGroup lives there), `registry/styles/components/avatar.css`, avatar fixtures/demo/spec.

## Behaviour

- Props: `overflowButton?: ReactNode` (custom), `onOverflowClick?(hiddenItems)`, `onGroupClick?({ targetRef,
  overflowButtonClicked })` matching UI5's `click` event, texts.
- Measure available width; hide trailing avatars; "+N" button uses the next accent colour/size as UI5; in `group` type
  the whole group (incl. overflow) is one button; in `individual` type the overflow button is its own tab stop in the
  roving set.
- The demo opens a Popover listing hidden avatars when "+N" is clicked (caller-side, like UI5 samples).

## Fixtures

`avatar-group-overflow-group`, `avatar-group-overflow-individual` at a fixed narrow width, sizes S and L.

## Tests

Resize changes N; click/Enter/Space on "+N" fires `onOverflowClick` with the hidden items; keyboard in individual mode.

## Acceptance

Pixel diff; AGENTS.md definition of done.
