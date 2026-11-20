# F2 — Adapt Filters dialog (after F0)

**Goal:** a complete port of SAPUI5's **Adapt Filters** personalization dialog for the FilterBar
(OpenUI5 1.154 `sap.ui.mdc.p13n.panels.AdaptFiltersPanel` / `AdaptFiltersPanelContent` / `GroupView` inside
`sap.m.p13n.Popup`), wired into our `registry/ui/filter-bar.tsx`.

## Read first (OpenUI5 1.154)

- `sap/ui/mdc/p13n/panels/AdaptFiltersPanel.js` (view switch List ↔ Group, header toolbar, search, `_filterByModeAndSearch`,
  `switchView`, `restoreDefaults`, `getSelectedFields`).
- `sap/ui/mdc/p13n/panels/AdaptFiltersPanelContent.js` (1577 lines): the List view — `_createItemGrid`,
  `_createFilterLabel`, `_createFilterControl` (the live filter field editor in each row), `_createVisibilityAction`
  (eye toggle), `_createDeleteAction`, `_createSortAction` / `_moveListItem` / `_handleReorder` (Edit vs Sort mode via
  `_getModeButton` / `_onModeChange`), `_getAddFilterSection` + `_createKeySelect` ("Add Filter: Select or Type Name"),
  `_onRemoveRow`, `_focusNewlyAddedItem`, `_announceReorder`, `_announceSearchUpdate`, `_groupComparator`,
  `_groupHeaderFactory`, the CHANGE_REASON_* constants.
- `sap/ui/mdc/p13n/panels/GroupView.js` (Group view: panels per group with select-all, quick filter modes
  Visible/Active/Visible and Active/All/Mandatory — `p13nDialog.GROUPMODE_*` texts).
- `sap/m/p13n/Popup.js` (dialog with Reset in the header, OK/Cancel footer, reset confirmation
  `filterbar.ADAPT_RESET_WARNING`, `POPUP_ANNOUNCEMENT_RESET`), `sap/m/p13n/Container.js`, `BasePanel.js` (keyboard:
  Ctrl+↑/↓/Home/End reorder), `SelectionPanel.js`.
- `sap/ui/mdc/filterbar/p13n/AdaptationFilterBar.js` (the dialog's inner filter bar), `GroupContainer.js`,
  `TableContainer.js`; `sap/ui/mdc/filterbar/FilterBarBase.js` (how the dialog is opened, OK applies vs Cancel reverts,
  the "Adapt Filters (n)" count, `ADAPT_FILTERS_*` summary texts, required-filter validation
  `REQUIRED_FILTER_VALUE_MISSING`).
- Texts: `sap/ui/mdc/messagebundle.properties` keys `filterbar.ADAPT_*`, `p13nDialog.*`; `sap/m/messagebundle.properties`
  `p13n.*`. Themes: `themelib_sap_horizon/src/sap/m/themes/sap_horizon/` `p13n.Container.less`, `p13n.SelectionPanel.less`,
  `p13n.QueryPanel.less`, `P13nDialog.less` (and their `sap/m/themes/base/` counterparts).

## Files

New: `registry/ui/adapt-filters-dialog.tsx` (+ items json, CSS), SAPUI5-referenced fixtures
(`docs/src/fixtures-sapui5/adapt-filters-dialog.tsx` + `sapui5/fixtures/adapt-filters-dialog.js`), demo, spec.
Edit (allowed): `registry/ui/filter-bar.tsx`, its CSS/demo/spec — replace the current `onAdaptFilters` callback-only
button with the built-in dialog (keep `onAdaptFilters` as an override hook), `registry/blocks/list-report.tsx`.

## Data model (React)

FilterBar gets a declarative model so the dialog can work without app glue:
`filters: { key, label, group?, groupLabel?, required?, visibleInFilterBar?, render(props) }[]`, `values` / `onValuesChange`
(conditions per key, as today), `visibleKeys` + `onVisibleKeysChange` (order matters), `p13nMode: ("item" | "value")[]`.
Field rendering inside the dialog reuses each filter's `render` (the same editor as in the bar).

## Behaviour (port, don't reinvent)

- Dialog: title "Adapt Filters", Reset (enabled only when state differs from the initial/variant state; confirmation
  message box), OK (applies items + values; triggers Go when the bar is in live mode? — check FilterBarBase), Cancel
  (reverts everything). Resizable/draggable as SAPUI5's p13n Popup.
- List view: toolbar "Filter Values and Visibility", search "Search for Filters", Edit/Sort segmented mode; Edit rows =
  label + live editor + eye (show/hide in bar) + remove; Sort rows = reorder with buttons and Ctrl+arrows;
  "Add Filter" combobox listing hidden filters.
- Group view: one panel per group, select-all per group, quick filter select (Visible / Active / Visible and Active /
  All / Mandatory), required fields can't be hidden, show values toggle (`ADAPT_SHOW_VALUE` / `ADAPT_HIDE_VALUE`).
- Live announcements (aria-live) for add/remove/show/hide/reorder/search, as the CHANGE_REASON handling does.
- FilterBar summary texts and "Adapt Filters (n)" count exactly as `FilterBarBase` computes them (hidden vs visible active
  filters).

## Fixtures (SAPUI5-referenced, 4 themes × 2 densities)

Dialog List view (Edit mode), List view (Sort mode), Group view with two groups, search with no results, Reset confirmation.

## Tests

Show/hide/reorder/add/remove/search; OK applies and Cancel reverts; Reset confirmation; required filters; counts and
summary texts in the bar; keyboard reorder; announcements present; List Report block uses the dialog end-to-end.

## Acceptance

Pixel diff vs SAPUI5 green; AGENTS.md definition of done.
