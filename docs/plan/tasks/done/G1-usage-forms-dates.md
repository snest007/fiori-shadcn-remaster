# G1-usage-forms-dates — Usage guidance: forms and dates

**Goal:** add the `usage` object (schema, writing rules and source defined in
[G0](G0-usage-guidance-pipeline.md)) to every item listed below, then regenerate the skill. Content only: no component,
style, demo or test-fixture changes. Depends on G0 (merged).

## Items

`button`, `segmented-button`, `toggle-button`, `link`, `input`, `textarea`, `step-input`, `checkbox`,
`radio-group`, `switch`, `slider`, `rating-indicator`, `token`, `tokenizer`, `file-uploader`, `label`, `form`,
`color-palette`, `color-palette-popover`, `color-picker`, `calendar`, `date-picker`, `date-range-picker`,
`date-time-picker`, `time-picker`, `picker-field`.

Button rules to carry over: one emphasized button per page/dialog; semantic (accept/reject) only for positive/negative
actions; icon-only buttons need a tooltip/label; imperative verb text. Distinguish: checkbox vs switch vs
toggle-button; radio-group vs segmented-button vs select; date-picker vs date-range-picker vs date-time-picker vs
calendar.

## How

1. Re-read G0 "Writing rules" **including the addendum** (thresholds from the source, user task first, symmetric pairs). The pilot items predate the addendum: match their length and routing, not their API-heavy `useWhen`.
2. Per item: read `registry/ui/<name>.tsx` (or the block source) for what it really supports, then the SAP guidance
   in `.ref/ai-skills-library/skills/sap-fiori-guidelines/references/` (`ui-actions.md`, `ui-inputs.md`, `ui-upload.md`, `foundations-best-practices.md`). If SAP has no chapter for it, use the
   UI5 apidoc `### Overview` text in `node_modules/@ui5/webcomponents*/dist/custom-elements.json` and set
   `"source": "ui5-apidoc"`.
3. Every `avoidWhen` alternative must exist in this registry (the build validates names; also check the meaning).
   Prefer pointing at look-alikes in this card's list, and at pilot items.
4. `pnpm registry:build` (regenerates `skills/shadcn-fiori/`), commit the generated files together with the JSON.

## Files

Only `usage` in the listed `registry/items/*.json` / `registry/block-items/*.json`, plus the regenerated
`skills/shadcn-fiori/**`. If two G-cards both regenerate `skills/`, the integrator re-runs `pnpm skill:build`
after merging instead of resolving conflicts by hand (see G5).

## Acceptance

AGENTS.md definition of done; every listed item has `usage`; no `use` name points outside the registry; the
docs page of each item shows the section (spot-check three in the browser and list them in the final message).
