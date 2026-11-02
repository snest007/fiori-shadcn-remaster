# F3 — Variants wired to the FilterBar and List Report (after F1 and F2)

**Goal:** the SAPUI5 behaviour where the FilterBar's state (filter values, visible filters and their order, search term)
belongs to the selected **view (variant)**: changing anything marks the view modified ("*"), Save / Save As stores the
state, selecting a view restores it, "Apply Automatically" runs Go after selection, Reset in Adapt Filters returns to the
saved state of the current view.

## Read first (OpenUI5 1.154)

- `sap/ui/fl/variants/VariantManagement.js` and `sap/ui/fl/variants/VariantModel.js` / `VariantManager.js` — only to copy
  the **behavioural contract** (when `modified` flips, what Standard means, execute-on-select, default view on load);
  we do **not** port sap.ui.fl's persistence/LRep.
- `sap/ui/mdc/filterbar/FilterBarBase.js` — `variantBackreference`, how p13n changes and value changes mark the variant
  dirty, `getCurrentState` / `applyState` style APIs (`sap/ui/mdc/p13n/StateUtil.js`), and `_handleAssignedFilterNames`.

## Files

New: `registry/lib/fiori-variants.ts` — `useVariantState({ initialVariants, storage? })`: holds variants
`{ key, title, …VariantItem fields, state: FilterBarState }`, the standard variant, default key, selected key, modified flag;
`storage` adapter interface `{ load(): Promise<Variant[]>; save(variants): Promise<void> }` with a `localStorageAdapter(key)`
implementation (the only persistence we ship). Registry item `variants` (registry:lib).
Edit (allowed): `registry/ui/filter-bar.tsx` (`state` / `onStateChange` props; `variantManagement` slot),
`registry/blocks/list-report.tsx` (real VariantManagement + Adapt Filters + localStorage persistence), their specs.

## Behaviour

- `FilterBarState = { values, visibleKeys, search }` (+ table personalization later). Any change vs the selected view's
  saved state sets `modified`. Selecting a view applies its state; if `executeOnSelect`, Go fires.
- Save overwrites the selected (changeable) view; Save As creates one with the dialog's options; Manage applies renames,
  deletes (selection falls back to Standard/default as SAPUI5), favorites, default, execute flags.
- Default view is applied on mount. Standard view always exists, isn't removable/renamable.
- Adapt Filters Reset → saved state of the selected view.

## Tests (`tests/list-report.spec.ts` + `tests/variants.spec.ts`)

End-to-end in the List Report block: change a filter → "*"; Save As "My View" (default + apply automatically) → reload
the page → My View is selected, its values are applied and Go ran; Manage: rename, delete, change default; Reset in Adapt
Filters returns to the saved view.

## Acceptance

AGENTS.md definition of done; no SAPUI5 pixel fixtures needed beyond F1/F2 (behaviour card).
