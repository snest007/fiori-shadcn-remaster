# B5 — NotificationList growing

**Goal:** "More" button / scroll growing for NotificationList (and in groups) as UI5 2.28 does.

## Read first

- `node_modules/@ui5/webcomponents-fiori/dist/NotificationList.js`, `NotificationListGroupItem.js`
  (`growing`, `getGrowingButton`, `load-more` event, `loading`), `NotificationListInternal.js` (`growingButton`,
  `_isGrowingButton`), and how List growing is delegated. Check whether UI5 has a button-text property; if not, add an
  overridable `texts.growingButton` prop.
- Our `registry/ui/list.tsx` growing implementation (reuse its approach/markup).

## Files

Own: `registry/ui/notification-list.tsx`, its CSS, fixtures, demo, spec.

## Behaviour

`growing?: "none" | "button" | "scroll"` on `NotificationListGroupItem` (and list if UI5 has it), `onLoadMore`,
`texts.growingButton` (if UI5 has no text property), `loading`; focus moves to the first new item after loading (as List does).

## Fixtures

`notification-list-growing-button`.

## Tests

Button and scroll growing fire `onLoadMore`; new items focused; `loading` shows busy state.

## Acceptance

Pixel diff; AGENTS.md definition of done; app-shell block notification popover still works.
