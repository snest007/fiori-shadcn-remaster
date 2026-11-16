# H10 — Low-priority items: NavigationMenu, AnalyticalCardHeader, ActionSheet, UserSettingsDialog, TableHeaderCellActionAI

**Goal:** add the components below from issue #1's list. Depends on: H0, E4 and E5 (merged). Can run in parallel with H1–H6 and with
the other H7+ cards (disjoint files), except where a component edits an existing component's file — then don't run
it at the same time as another card that edits that file: `input.tsx` (H7), `button.tsx` (H8), `menu.tsx` and
`table.tsx` (H10).

## Components (do them in this order; stop and report if the card grows past L — the rest becomes H11)

1. **NavigationMenu** — check whether our `Menu` + `href`/`target` on items covers UI5's `NavigationMenu` /
   `NavigationMenuItem`; if yes, add the props to `menu.tsx` additively and a fixture pair; else a thin component.
   Reference: UI5 Web Components 2.28 in `node_modules` (rule 1) — read `dist/<Name>.js`, `dist/<Name>Template.js`,
`dist/generated/themes/<Name>.css.js` for each. Fixtures `<name>.tsx` + `<name>.ui5.ts`.
2. **AnalyticalCardHeader** + **NumericSideIndicator** — KPI header for `Card` (title, subtitle, unit, main number
   with state/trend arrow, side indicators). Reference: `@ui5/webcomponents-react` 2.28.2 (H0) — read `dist/components/<Name>/**`. Fixtures `<name>.tsx` +
`<name>.wcr.tsx` (`reference: "wcr"`).
3. **ActionSheet** — mobile bottom sheet of actions (WCR), built on `ResponsivePopover`. Reference: `@ui5/webcomponents-react` 2.28.2 (H0) — read `dist/components/<Name>/**`. Fixtures `<name>.tsx` +
`<name>.wcr.tsx` (`reference: "wcr"`).
4. **UserSettingsDialog** (fiori 2.8+: `UserSettingsDialog`, `UserSettingsItem`, `UserSettingsView`,
   `UserSettingsAccountView`, `UserSettingsAppearanceView*`, `UserSettingsNotificationsView*`) — opened from our
   `UserMenu`. Large: if it alone is L, split it into its own card and say so. Reference: UI5 (`-fiori`
   `Assets.js` import, gotcha in AGENTS.md).
5. **TableHeaderCellActionAI** — AI action button in `Table` header cells (UI5 2.8+); additive to `table.tsx`.

## For every component in this card

- Parity with the reference, plus extension points per H1's contract where the component renders consumer content
  (render slots render content only; owned ARIA can't be overridden; `data-slot` + `data-*` state; `classNames`).
- Rules 9 and 10 in full: every role/aria/announcement/keyboard path from the reference; every reference i18n key as an
  overridable text with its key named, resolved through `FioriLocaleProvider`; numbers/dates via `Intl`; RTL fixture.
- Registry item + `usage` (G0 schema; route look-alikes both ways), demo, spec, fixtures on both sides for each visual
  state (popups in place), axe + accessibility tree + pixel parity. If wave S is merged, add the stories too (S0 rules).
- Each component is its own commit (`<card>: <component>`).

## Files

Component-owned files (rule 3) of the new components; `docs/src/fixtures/index.ts` (register); README component count;
`usage` blocks of the look-alike items you route to (only the `usage` object of their `registry/items/*.json`).

## Acceptance

AGENTS.md definition of done; every listed component passes pixel, tree and axe checks in all themes, densities and RTL;
final message lists each component with its reference and any `skipCompare`/`a11yDiff` with reasons.
