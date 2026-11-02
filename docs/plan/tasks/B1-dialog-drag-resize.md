# B1 — Dialog draggable / resizable

**Goal:** add `draggable` and `resizable` to `DialogContent`, matching `ui5-dialog` 2.28 (mouse and keyboard).

## Read first

- `node_modules/@ui5/webcomponents/dist/Dialog.js` — `draggable`, `resizable`, `_onDragMouseDown`, `_onDragMouseMove`,
  `_onDragMouseUp`, `_onResizeMouseDown/Move/Up`, `_onDragOrResizeKeyDown` (arrow keys move by step; Shift+arrow
  resizes; check `isUp/isDown/isLeft/isRight` usage), `_center`, `_revertSize`, `_minWidth`/`_minHeight`, RTL handling,
  `_ariaDescribedByIds` / "resizable/draggable" accessibility text.
- `DialogTemplate.js` (resize handle markup, icon), CSS `generated/themes/Dialog.css.js`;
  params `grep -- '--fiori-dialog' registry/styles/fiori.css` (e.g. `--fiori-dialog-resize-cursor`,
  `--fiori-dialog-resizable-bottom-right-radius`).

## Files

Own: `registry/ui/dialog.tsx`, `registry/styles/components/dialog.css`, dialog fixtures/demo/spec.

## Behaviour

- `draggable`: drag by the header bar (not by header buttons); dialog stays within the viewport; keyboard on the focused
  header: arrows move by UI5's step.
- `resizable`: bottom-end corner handle (start corner in RTL) with UI5's icon; min size as UI5; Shift+arrows on the
  header resize by step.
- Closing and reopening re-centers (UI5 behaviour). Window resize keeps it inside the viewport.
- Accessible description announces draggable/resizable as UI5 (overridable texts).
- Disabled automatically on phone-sized viewports if UI5 does so (check `isPhone` usage) — keep consistent with D1.

## Fixtures

`dialog-resizable` (shows the handle; surface in place), `dialog-draggable` (header cursor/focus look if visible).

## Tests

Mouse drag moves by the drag delta and clamps to the viewport; resize grows/shrinks and respects the minimum;
keyboard move/resize steps; reopen re-centers; RTL handle position (set `dir="rtl"` on the demo wrapper).

## Acceptance

Pixel diff for new fixtures; AGENTS.md definition of done; ValueHelpDialog and ViewSettingsDialog unaffected.
