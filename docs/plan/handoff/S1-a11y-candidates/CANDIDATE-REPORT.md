# S1 accessibility candidates for E4

S1 adds stories and JSDoc only. These patches are unapplied proposals for E4; canonical component behavior and CSS remain unchanged.

> component defect, fixed by E4 — see docs/plan/handoff/S1-a11y-candidates

## MultiComboBox nested interactive selection indicator

The unchanged React `registry/ui/multi-combobox.tsx` `renderItem` puts a `Checkbox` button (`role=checkbox`, `tabindex=-1`, `aria-hidden=true`) inside every focusable `role=option`. A negative tabindex and aria-hidden do not remove its native focusability, so axe reports `nested-interactive` on every option.

UI5 Web Components **2.28.1** has a different structure. `node_modules/@ui5/webcomponents/dist/MultiComboBoxItem.js`, `checkBoxAccInfo`, returns `{ role: "presentation" }`. `MultiComboBoxItemTemplate.js` passes that `_accInfo` into CheckBox. `CheckBoxTemplate.js` uses a nonfocusable presentation root and only renders its native hidden checkbox input when the role is `checkbox`. UI5's option therefore owns both focus and selection without an inner focusable control.

Reproduced in the existing **`multi-combobox-list` fixture** on both sides, in Morning Horizon and High Contrast Black: unchanged React has six nested-interactive nodes and six inner checkbox buttons; native UI5 has no axe violation and no inner checkbox role. The fixture comparison waits for each page's `html[data-ready=true]` and fonts; no new fixture, baseline or suppressed native rule is introduced.

Reproduce using the repository's frozen dependencies and `pnpm generate`:

```sh
pnpm exec vite --port 4320 --strictPort
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

## Pointer focus indicators

Existing fixtures reproduce pointer rings in **TextArea, StepInput, ComboBox, MultiComboBox, MultiInput, FileUploader and Token**. In Morning Horizon and High Contrast Black, React and UI5 2.28.1 both paint their owning indicators after a real pointerdown. Keyboard entry paints them too. This follows native UI5 but conflicts with repository rule 5's keyboard-origin-only policy.

The comparison uses the existing `textarea-value`, `step-input`, `combobox-value`, `multi-combobox-empty`, `multi-input-empty`, `file-uploader` and `token` fixtures. It waits for actual focus, UI5's owning `Render.js.renderFinished()` and fonts. StepInput's ring is on the nested `ui5-input.ui5-numeric-input-input` host, rather than its shadow input wrapper. FileUploader's transparent native input is reached through the visible field using real mouse coordinates, with the native file chooser intercepted. No fixture or component change is needed to reproduce.

Owning UI5 sources: `TextArea.js:_onfocusin` and `generated/themes/TextArea.css.js`; `StepInputTemplate.js`, `NumericInputTemplate.js` and `generated/themes/NumericInput.css.js`; `ComboBox.js` / `generated/themes/ComboBox.css.js`; `MultiComboBox.js` / `generated/themes/MultiComboBox.css.js`; `MultiInputTemplate.js` / `Input.js` / `generated/themes/MultiInput.css.js`; `FileUploader.js:_onfocusin` / `generated/themes/FileUploader.css.js`; `TokenTemplate.js` / `generated/themes/Token.css.js` (desktop `:focus` selectors).

- **`field-pointer-focus-indicators.patch`** adds private document-modality capture to the six independent field owners. It gates only the existing field, TextArea and NumericInput focus-ring selectors; backgrounds, value-state behavior, roles, labels and keyboard models stay intact. FileUploader preserves caller capture handlers. The shared `field.css` selector is the same guard proposed by S0's Input candidate, so E4 should merge that selector once and consolidate document-modality handling when adopting both proposals.
- **`token-keyboard-focus-indicator.patch`** replaces the three existing Token `:focus` indicator selectors with `:focus-visible`. Tokenizer inherits Token's repair. The patch retains token focus, selection, deletion and all parameter-backed design values.

Label and Form's edit field compose the shared Input and inherit the already documented **S0 Input** proposal. ColorPicker's channel/hex Inputs inherit it as well; they need no duplicate component patch. FileUploader owns its field independently and is therefore included here.

The supplementary S1 focus audit calls `classifyS1PointerFocus()` in the S1 known-issues module. Its approved boundary is pointer phase only, Morning/HCB only, the exact current target and unchanged painted wrapper in `forms-textarea--playground`, `forms-step-input--playground`, `forms-combobox--playground`, `forms-multi-combobox--playground`, `forms-multi-input--playground`, `forms-file-uploader--playground`, `forms-form--edit`, `forms-label--playground`, `forms-token--playground` and `forms-tokenizer--playground`. Any other story, phase, control, value state, ring or theme stays unexpected. Keyboard-origin assertions still run. The shared generated focus tests currently cover only S0 pilots; S5 should extend that owner rather than treating the supplemental script as permanent generic coverage.

Both proposals passed `git apply --check`, and an independent source/config/assets copy (only dependencies symlinked) passed typecheck and **14 live checks**: seven widgets in both themes, pointer indicator absent and keyboard indicator present. The canonical component/CSS sources remain untouched. Candidate evaluation did not run the full regression or pixel suites, so adoption still requires E4's own checks, both-side fixtures and a documented accessibility-tree deviation from native pointer behavior. Existing owning specs and all-theme visual fixtures should verify selection, typing, focus return, file choosing, keyboard reentry and unchanged geometry; also test pointer-opened/programmatic focus, canceled pointer followed by Tab, and caller capture handlers.
