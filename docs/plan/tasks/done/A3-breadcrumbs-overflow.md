# A3 — Breadcrumbs overflow

**Goal:** when breadcrumbs don't fit, the leading items collapse into a dropdown arrow button that opens a list,
as `ui5-breadcrumbs` 2.28 does.

## Read first

- `node_modules/@ui5/webcomponents/dist/Breadcrumbs.js` — `_updateOverflow`, `_overflowSize`, `_maxAllowedOverflowSize`,
  `_visibleItems`, `_overflowItemsData`, `hasOverflow`, `_openRespPopover`, `_onOverflowListItemSelect`,
  `_dropdownArrowLink`, `_dropdownArrowAccessibleNameText`.
- `BreadcrumbsTemplate.js`, `BreadcrumbsPopoverTemplate.js`; CSS `generated/themes/Breadcrumbs.css.js`,
  `BreadcrumbsPopover.css.js`.

## Files

Own: `registry/ui/breadcrumbs.tsx`, `registry/styles/components/breadcrumbs.css`, breadcrumbs fixtures/demo/spec.
Reuse popover/list styles without editing them.

## Behaviour

- Measure widths (ResizeObserver); hide items from the start, keeping the current location visible; show the dropdown
  arrow link first; its popover lists the hidden items (and only those) in order; selecting navigates like a link
  (fires the item's onClick / follows href) and closes the popover.
- Keyboard and aria as UI5 (arrow link has `aria-haspopup`, `aria-expanded`, label "Children").
- Works with `design="no-current-page"` and all separator styles.

## Fixtures

`breadcrumbs-overflow` (narrow), `breadcrumbs-overflow-no-current-page`, popover in place if feasible.

## Tests

Overflow appears/disappears with width; popover lists exactly the hidden items; selecting fires navigation; keyboard.

## Acceptance

Pixel diff for new fixtures; AGENTS.md definition of done; `registry/blocks/object-page-floorplan.tsx` still renders.
