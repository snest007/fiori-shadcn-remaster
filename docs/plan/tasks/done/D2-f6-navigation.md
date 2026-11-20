# D2 — F6 fast navigation (after waves A–C)

**Goal:** F6 / Shift+F6 move focus between page groups, as UI5's `F6Navigation` feature.

## Read first

- `node_modules/@ui5/webcomponents-base/dist/features/F6Navigation.js` — groups are elements with
  `data-sap-ui-fastnavgroup="true"`; how the next/previous group and the first focusable element inside it are found
  (including shadow roots), wrap-around, Ctrl+Alt+F6 variants if present.
- Which UI5 components set the attribute: `grep -l fastnavgroup node_modules/@ui5/webcomponents*/dist/*.js` gives only
  `Form.js`, `Popup.js` and the UserSettings dialog in 2.28 — so UI5 Web Components themselves mark few groups; apps mark
  the rest. Follow SAPUI5's launchpad convention for the blocks (shell bar, side navigation, page title, header, content,
  footer) and document it. Our `dynamic-page.tsx` and `shell-bar.tsx` already set the attribute.

## Files

New: `registry/lib/fiori-f6.ts` (a `useF6Navigation()` hook / `installF6Navigation(root = document)` installer) and a
registry item `f6-navigation` (registry:lib). Edit components that UI5 marks as groups to add
`data-sap-ui-fastnavgroup="true"` on the same elements (some — DynamicPage, ShellBar — already do: verify).
Add the installer to the blocks (`app-shell`, `launchpad`, `list-report`, `object-page-floorplan`, `master-detail`).
Tests: `tests/f6-navigation.spec.ts`.

## Behaviour

Port the algorithm, not just "next element": first focusable inside the group, skip hidden/inert groups, wrap,
Shift+F6 backwards, ignore when focus is in a modal dialog (check UI5). No global listener unless the app installs it.

## Tests

In `launchpad` and `list-report` blocks: F6 cycles ShellBar → side navigation → page title → filter bar → table → footer
(whatever UI5's order is for the equivalent UI5 page); Shift+F6 reverse; nothing happens when not installed.

## Acceptance

AGENTS.md definition of done.
