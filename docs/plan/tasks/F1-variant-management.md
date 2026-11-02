# F1 — VariantManagement (after F0)

**Goal:** a complete port of **`sap.m.VariantManagement` (OpenUI5 1.154)**: the view selector with its popover list,
Save / Save As dialog, Manage Views dialog — every feature, keyboard and text of the original. Persistence stays
with the app (callbacks), exactly like sap.m.VariantManagement without sap.ui.fl.

## Read first (OpenUI5 1.154 source; get it with `npm pack @openui5/sap.m@1.154.0` or from node_modules after F0)

- `sap/m/VariantManagement.js` (3556 lines) — properties (`supportDefault`, `supportFavorites`,
  `supportApplyAutomatically`, `supportPublic`, `supportContexts`, `selectedKey`, `defaultKey`, `showSaveAs`,
  `creationAllowed`, `showFooter`, `modified`, `popoverTitle`, `inErrorState`, `level`, `titleStyle`, `maxWidth`),
  events (`select`, `save` {name, overwrite, key, execute, def, public/contexts, tile}, `cancel`, `manage`
  {renamed, deleted, exe, fav, def, contexts}, `manageCancel`), and the functions `_openVariantList`,
  `_createVariantList`, `_openSaveAsDialog`, `_createSaveAsDialog`, `_handleVariantSave`, `_handleVariantSaveAs`,
  `_openManagementDialog`, `_createManagementDialog`, `_handleManageSavePressed`, `_handleManageCancelPressed`,
  `_handleManageDeletePressed`, `_handleManageFavoriteChanged`, `_handleManageDefaultVariantChange`,
  `_handleManageTitleChange`, `_checkVariantNameConstraints`, `_checkIsDuplicate*`, `_handleManagementDialogKeydown`,
  `_openInErrorState`, `_createIllustratedMessages`, `_openRolesDialog` / `_createRolesDialog` (contexts).
- `sap/m/VariantItem.js` — `key`, `title`, `sharing` (Public/Private), `remove`, `rename`, `favorite`,
  `executeOnSelect`, `changeable`, `author`, `contexts`, `visible`.
- Rendering is inline in `sap/m/VariantManagement.js` (its `renderer` object, no separate Renderer file); styles in
  `sap/m/themes/base/VariantManagement.less` (Horizon has no override file — Horizon values come from the base LESS
  parameters). The rendered CSS to match is whatever the F0 reference page shows.
- Texts: `sap/m/messagebundle.properties` keys `VARIANT_MANAGEMENT_*` (e.g. "Save View", "Manage Views", "My Views",
  "Set as Default", "Apply Automatically", "Sharing", "Public/Private", "Created By", "No views found", duplicate/empty/
  not-allowed-char/max-length messages). Use the English texts as defaults; every one overridable via a `texts` prop.

## Files

New: `registry/ui/variant-management.tsx` (+ `registry/items/variant-management.json`,
`registry/styles/components/variant-management.css`), `docs/src/fixtures-sapui5/variant-management.tsx` + the SAPUI5 side
in `sapui5/fixtures/variant-management.js`, `docs/src/demos/variant-management.tsx`, `tests/variant-management.spec.ts`.
Build from our Dialog, Popover, List, Table, Input, Checkbox, Button, Toolbar, IllustratedMessage — don't edit them.

## Behaviour (port, don't reinvent)

- Trigger: title text (`level`/`titleStyle`) + modified indicator "*" + arrow; Ctrl+S (Cmd+S) saves when modified
  (check `_handleVariantSave` path), F4/Alt+↓ opens.
- Variant list popover: search field (shown above N items as SAPUI5), favorites-only list when `supportFavorites`,
  selected item, "No views found" illustrated message, footer Save / Save As / Manage (visibility rules from the source:
  Save only when modified and the variant is changeable, etc.).
- Save As dialog: name (validation: empty, duplicate, not-allowed characters, max length — use SAPUI5's exact limits),
  Set as Default, Public, Apply Automatically, (contexts/roles when `supportContexts`), Create Tile only if SAPUI5 shows it
  without sap.ui.fl (check), Ctrl+Enter saves.
- Manage dialog: table with Favorite (star toggle), View name (inline rename with validation), Sharing, Default (radio),
  Apply Automatically, Visibility/Roles (contexts), Created By, Delete; search; Standard variant rules (can't delete,
  rename, unfavourite); default variant can't be unfavourited; restricted (role-based) views can't be default; Save
  emits one `onManage` with all changes, Cancel discards and fires `onManageCancel`.
- `inErrorState`: trigger disabled-looking per SAPUI5 and selection blocked.
- Accessibility: SAPUI5's invisible texts ("View {0}." / "Modified view {0}."), roles, tooltips.

## Public API (React)

`<VariantManagement items selectedKey defaultKey modified onSelect onSave onManage onManageCancel onCancel
 supportDefault supportFavorites supportApplyAutomatically supportPublic supportContexts showSaveAs creationAllowed
 showFooter popoverTitle inErrorState level titleStyle maxWidth texts />` with `items: VariantItem[]`
(`{ key, title, sharing, remove, rename, favorite, executeOnSelect, changeable, author, contexts, visible }`).

## Fixtures (SAPUI5-referenced, 4 themes × 2 densities)

Trigger (plain, modified, error state), open variant list (with search, with no results), Save As dialog (with all
options, with a duplicate-name error), Manage dialog (several variants incl. Standard, a renamed row in error).

## Tests

Every bullet under Behaviour has a test: selection, keyboard (F4, ↑/↓ in list, Enter, Escape, Ctrl+S, Ctrl+Enter),
validation messages, manage-dialog aggregation of changes in the `onManage` payload, Standard/default/role rules.

## Acceptance

Pixel diff vs SAPUI5 green; AGENTS.md definition of done.
