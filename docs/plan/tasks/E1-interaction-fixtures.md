# E1 — Interaction-state visual fixtures (hover / active / keyboard focus)

**Goal:** today only static states are pixel-compared; hover, pressed and keyboard-focus looks were checked by eye.
Add an automated pass that compares them against UI5.

## Approach

- New spec `tests/visual-interaction.spec.ts` (keep `tests/visual.spec.ts` unchanged). For a curated list of cases,
  open `/index.html?fixtures&only=<id>` and `/ui5.html?only=<id>`, then drive the same interaction on both:
  `hover` (mouse over the cell's first interactive element — on the UI5 side the host element), `active` (mouse down,
  screenshot, mouse up), `focus` (Tab into the cell so `:focus-visible` applies on both sides).
- Interaction targets: add an optional `interact?: { selector?: string; ui5Selector?: string }` to `FixtureCase` in
  `docs/src/fixture-types.ts` so cases can say which element to hover/press/focus; default = first focusable.
- Cases (start with these; each in Morning Horizon + HCB, cozy): button (all designs), toggle-button, segmented-button
  item, checkbox, radio, switch, input, select, combobox, link, tabs tab, list item, table row, side-navigation item,
  shell-bar item, menu item (open surface), card header (interactive), panel header.
- Known difference: UI5 shows a focus ring after mouse press on some components, we don't (by design). Only compare
  `focus` via keyboard.

## Files

Shared (allowed): `docs/src/fixture-types.ts`, `docs/src/main.tsx`, `docs/src/ui5-main.ts` (honour `only=` exactly).
New: `tests/visual-interaction.spec.ts`. Component fixes as needed (list them in the commit message).

## Acceptance

New spec green with the default 2% tolerance (fix components; skipCompare with a concrete reason only); runtime of the new
spec under 60 s; AGENTS.md definition of done.
