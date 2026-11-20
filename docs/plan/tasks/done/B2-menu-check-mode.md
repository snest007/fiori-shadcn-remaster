# B2 — Menu checkable items and groups

**Goal:** support UI5 2.28's `ui5-menu-item-group` with `checkMode` `None | Single | Multiple` and checked items.

## Read first

- `node_modules/@ui5/webcomponents/dist/MenuItemGroup.js`, `MenuItemGroupTemplate.js`, `MenuItem.js` (`checked`,
  `_checkMode`, `_markChecked`, `_updateCheckedState`, aria `menuitemcheckbox` / `menuitemradio`), `Menu.js` (group handling, `checkMode` keyboard),
  `types/MenuItemGroupCheckMode.js`; CSS `generated/themes/MenuItem.css.js`.

## Files

Own: `registry/ui/menu.tsx`, `registry/styles/components/menu.css`, menu fixtures/demo/spec.

## Behaviour

- New `MenuGroup` props: `checkMode?: "none" | "single" | "multiple"`. `MenuItem` gets `checked` /
  `defaultChecked` / `onCheckedChange`. Use Radix `DropdownMenu.RadioGroup/RadioItem` for single and
  `CheckboxItem` for multiple, or the existing primitives — but render UI5's markup/look (check mark at the end, as UI5).
- Single: selecting checks it and unchecks siblings; Multiple: toggles. Whether the menu closes after a check toggle must
  match UI5.
- aria roles `menuitemradio` / `menuitemcheckbox`, `aria-checked`.
- Groups render separators like UI5 (check whether UI5 draws them for groups).

## Fixtures

`menu-check-single`, `menu-check-multiple` (with icons and without), surface in place like existing menu fixtures.

## Tests

Single/multiple semantics, aria-checked, keyboard Space/Enter toggling, close-on-select behaviour per UI5.

## Acceptance

Pixel diff; AGENTS.md definition of done; existing menu tests unchanged.
