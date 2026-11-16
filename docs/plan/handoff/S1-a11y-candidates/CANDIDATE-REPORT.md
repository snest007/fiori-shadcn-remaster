# S1 accessibility candidate for E4

S1 adds stories and JSDoc only. This patch is an unapplied proposal for E4; canonical component behavior and CSS remain unchanged.

> component defect, fixed by E4 — see docs/plan/handoff/S1-a11y-candidates

## MultiComboBox nested interactive selection indicator

The unchanged React `registry/ui/multi-combobox.tsx` `renderItem` puts a `Checkbox` button (`role=checkbox`, `tabindex=-1`, `aria-hidden=true`) inside every focusable `role=option`. A negative tabindex and aria-hidden do not remove its native focusability, so axe reports `nested-interactive` on every option.

UI5 Web Components **2.28.1** has a different structure. `node_modules/@ui5/webcomponents/dist/MultiComboBoxItem.js`, `checkBoxAccInfo`, returns `{ role: "presentation" }`. `MultiComboBoxItemTemplate.js` passes that `_accInfo` into CheckBox. `CheckBoxTemplate.js` uses a nonfocusable presentation root and only renders its native hidden checkbox input when the role is `checkbox`. UI5's option therefore owns both focus and selection without an inner focusable control.

Reproduced in the existing **`multi-combobox-list` fixture** on both sides, in Morning Horizon and High Contrast Black: unchanged React has six nested-interactive nodes and six inner checkbox buttons; native UI5 has no axe violation and no inner checkbox role. The fixture comparison waits for each page's `html[data-ready=true]` and fonts; no new fixture, baseline or suppressed native rule is introduced.

Reproduce using the repository's frozen dependencies and `pnpm generate`:

```sh
pnpm dev -- --port 4320 --strictPort
# React: http://localhost:4320/?fixtures&only=multi-combobox-list&theme=sap_horizon
# UI5:   http://localhost:4320/ui5.html?only=multi-combobox-list&theme=sap_horizon
# Repeat with theme=sap_horizon_hcb.
pnpm storybook:build
PORT=4320 pnpm test:storybook --grep 'Forms/MultiComboBox/(Open|Item Groups|Select All|Grouped Select All) has no unexpected axe'
```

`multi-combobox-presentational-selection.patch` replaces only the option's decorative Checkbox with a nonfocusable, aria-hidden span containing the same token-backed checkbox icon markup. It preserves the pointer-only checkbox-area click behavior (toggle without closing, return focus to the option), option roles/states, keyboard handlers, select-all control and disabled/read-only styling. The existing icon dependency already supplies `accept`; no dependency is added.

E4 should apply and validate it in an isolated checkout, then add regressions proving: (1) the open native/React option trees have no nested focusable controls; (2) clicking the checkbox indicator still toggles and keeps the list open; (3) Space/Enter and select-all behavior and phone commit/cancel stay intact; (4) the existing open-list pixel fixtures still pass in all themes/densities. `tests/multi-combobox.spec.ts` already exercises option/checkbox-area selection; `tests-storybook/storybook.spec.ts` supplies the strict axe check for each authored story. This report does not claim the unapplied patch passes those checks.

## Narrow story boundary

The S1 block in `tests-storybook/known-issues.ts` classifies only `nested-interactive` in `forms-multi-combobox--open`, `--item-groups`, `--select-all` and `--grouped-select-all`, in the two audited themes. It requires the named expanded field, one visible named popup/listbox, the exact six country options and the specific direct child hidden checkbox button; a new rule, node, interactive child or story still fails. No story or accessibility rule is skipped or disabled.

E4 remains unchecked in the backlog. The wording names its owning follow-up; it does not mean the defect is fixed already. The existing S0 attachment helper labels all known records with S0's report path; the source S1 block and this report carry the correct S1 ownership without modifying shared helpers.
