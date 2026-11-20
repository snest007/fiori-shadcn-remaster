# B4 — Drag & drop reordering for Table and List

**Goal:** `movable` rows/items with mouse drag & drop and keyboard (Ctrl+↑/↓ etc.) as UI5 2.28 `ui5-table`
(`TableDragAndDrop`) and `ui5-list` (`movable` list items).

## Read first

- `node_modules/@ui5/webcomponents/dist/Table.js` (`TableDragAndDrop` feature, `move-over`, `move` events),
  `TableRow.js` (`movable`), `ListItemBase.js` / `List.js` (`movable`, `_ondragstart`, `move-over`, `move`),
  `DropIndicator.js` + `generated/themes/DropIndicator.css.js`, `node_modules/@ui5/webcomponents-base/dist/util/dragAndDrop/` (`DragRegistry.js`, `findClosestPosition.js`,
  `handleDragOver.js`, `handleDrop.js`, `longDragOverHandler.js`; placement Before/On/After), keyboard Ctrl+Arrow moves
  in `List.js` / `Table.js`.

## Files

Own: `registry/ui/table.tsx`, `registry/ui/list.tsx`, `registry/ui/data-table.tsx` (wire-through only), their CSS,
fixtures, demos, specs. New shared helper allowed: `registry/lib/fiori-drag-and-drop.ts` (add it to both items' `files`).

## Behaviour

- Props: rows/items `movable`; containers fire `onMoveOver({ source, destination: { element, placement } })` (call
  `preventDefault()` to allow, like UI5) and `onMove(...)`. The library does not reorder data itself (same as UI5);
  demos reorder their state.
- Drop indicator rendered like UI5 (line before/after, highlight for "On").
- Keyboard: Ctrl+↑/↓ (Cmd on macOS), Ctrl+Home/End moves the focused movable row/item, firing the same events.
- Works with the virtualized DataTable (rows outside the viewport: document what UI5 does and follow it).

## Fixtures

Drop indicator states rendered statically (`table-drop-indicator-before`, `list-drop-indicator-on`) if the indicator can
be shown deterministically on both sides; otherwise test-only with a comment.

## Tests

Mouse drag (Playwright `dragTo`) fires move-over/move with the right placement; demo reorders; keyboard moves; non-movable
rows don't start drags; DataTable passes through.

## Acceptance

AGENTS.md definition of done; List Report block still works.
