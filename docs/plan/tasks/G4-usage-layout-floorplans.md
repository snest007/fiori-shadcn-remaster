# G4-usage-layout-floorplans — Usage guidance: layouts and floorplans

**Goal:** add the `usage` object (schema, writing rules and source defined in
[G0](G0-usage-guidance-pipeline.md)) to every item listed below, then regenerate the skill. Content only: no component,
style, demo or test-fixture changes. Depends on G0 (merged).

## Items

Components: `dynamic-page`, `dynamic-side-content`, `flexible-column-layout`, `navigation-layout`, `object-page`, `page`.

Blocks (each needs `layout` and, where useful, `variations`): `app-shell`, `empty-states`, `launchpad`,
`master-detail`, `object-page-floorplan`, `wizard-page`.

Floorplan rules: read each block's `registry/blocks/<name>.tsx` and write `layout` from what it actually renders (outer →
inner, regions named). `avoidWhen` across floorplans must form a consistent picker together with the pilot
`list-report`: find/filter many objects → list-report; one object's details/edit → object-page-floorplan;
browse list + details side by side → master-detail (flexible-column-layout); guided, linear creation →
wizard-page; entry point with app tiles → launchpad; app frame → app-shell; nothing to show → empty-states.
Distinguish the `object-page` component from the `object-page-floorplan` block, and `dynamic-page` vs `page`.

## How

1. Re-read G0 "Writing rules" and the pilot items (`table`, `select`, `list-report`, …) — match their tone and length.
2. Per item: read `registry/ui/<name>.tsx` (or the block source) for what it really supports, then the SAP guidance
   in `.ref/ai-skills-library/skills/sap-fiori-guidelines/references/` (`page-types.md`, `foundations-best-practices.md`, `ui-containers.md`). If SAP has no chapter for it, use the
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
