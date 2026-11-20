# B3 — ComboBox and MultiComboBox item groups

**Goal:** grouped items with group headers in ComboBox and MultiComboBox lists, as `ui5-cb-item-group` /
`ui5-mcb-item-group` 2.28.

## Read first

- `node_modules/@ui5/webcomponents/dist/ComboBoxItemGroup.js`, `ComboBoxItemGroupTemplate.js`,
  `MultiComboBoxItemGroup.js`, `MultiComboBoxItemGroupTemplate.js`, `ListBoxItemGroupTemplate.js`,
  and the group handling in `ComboBox.js` / `MultiComboBox.js` (filtering keeps headers of groups with matches,
  keyboard skips headers, autocomplete ignores headers, "Select All" interaction in MCB).
- CSS: `generated/themes/ListItemGroupHeader.css.js` and the combobox popover CSS.

## Files

Own: `registry/ui/combobox.tsx`, `registry/ui/multi-combobox.tsx`, their CSS, fixtures, demos, specs.

## Behaviour

- New exports `ComboBoxItemGroup` (`headerText`, children items) and `MultiComboBoxItemGroup`.
- Group header rows: not focusable/selectable, announced as group (role `group` + `aria-label`, or what UI5 renders).
- Filtering hides empty groups; ↑/↓ and PageUp/PageDown skip headers; typeahead/autocomplete only on items.
- MCB "Select All" and Ctrl+A count only items.

## Fixtures

`combobox-groups-open` and `multi-combobox-groups-open` (list in place, as existing open-list fixtures do).

## Tests

Filtering with groups, keyboard skipping headers, selection, ARIA.

## Acceptance

Pixel diff; AGENTS.md definition of done; existing combobox/multi-combobox tests unchanged.
