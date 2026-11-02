# A5 — SideNavigation overflow item

**Goal:** in collapsed mode, when items don't fit vertically, SideNavigation shows an overflow ("…") item that opens a
menu of the hidden items, as `ui5-side-navigation` 2.28.

## Read first

- `node_modules/@ui5/webcomponents-fiori/dist/SideNavigation.js` — search for `overflow` (≈57 hits): `_updateOverflowItems`,
  `_getOverflowItems`, `handleResize`, `_handleOverflowClick`, `_overflowItem`, `isOverflow`, `overflowItems`,
  `getOverflowPopover`, `openOverflowMenu`, `overflowAccessibleName`.
- `SideNavigationTemplate.js`, `SideNavigationItem*.js`; CSS `generated/themes/SideNavigation*.css.js`.

## Files

Own: `registry/ui/side-navigation.tsx`, `registry/styles/components/side-navigation.css`, side-navigation
fixtures/demo/spec. Reuse `@/components/ui/menu` (don't edit it).

## Behaviour

- Only in collapsed mode. Measure the flexible area height (ResizeObserver); move trailing items into the overflow item.
- Overflow opens a Menu with the hidden items (sub-items as submenus, as UI5); selecting selects the item and closes.
- Selected item stays reachable (UI5 behaviour when the selected item is hidden: check and match).
- Keyboard: overflow item is part of the menubar navigation; Enter/Space/↓ open the menu.

## Fixtures

`side-navigation-collapsed-overflow` at a fixed short height (e.g. 18rem) with 10 items.

## Tests

Shrinking height adds the overflow item; menu lists the hidden items; selecting from it updates `value` and the page in
`registry/blocks/launchpad.tsx` (add a check in `tests/launchpad.spec.ts` at a small viewport height).

## Acceptance

Pixel diff; AGENTS.md definition of done.
