# G2-usage-data-display — Usage guidance: data and display

**Goal:** add the `usage` object (schema, writing rules and source defined in
[G0](G0-usage-guidance-pipeline.md)) to every item listed below, then regenerate the skill. Content only: no component,
style, demo or test-fixture changes. Depends on G0 (merged).

## Items

`object-status`, `object-number`, `object-identifier`, `timeline`, `upload-collection`, `avatar`, `card`,
`carousel`, `expandable-text`, `hero-banner`, `illustrated-message`, `media-gallery`, `message-strip`, `panel`,
`progress-indicator`, `busy-indicator`, `tag`, `title`, `text`.

Distinguish: tag vs object-status; message-strip vs toast vs illustrated-message (and when the empty-states block
fits); busy-indicator vs progress-indicator; card vs panel; text vs expandable-text vs title.

## How

1. Re-read G0 "Writing rules" **including the addendum** (thresholds from the source, user task first, symmetric pairs). The pilot items predate the addendum: match their length and routing, not their API-heavy `useWhen`.
2. Per item: read `registry/ui/<name>.tsx` (or the block source) for what it really supports, then the SAP guidance
   in `.ref/ai-skills-library/skills/sap-fiori-guidelines/references/` (`ui-display.md`, `ui-containers.md`, `ui-messages.md`, `ui-lists-tables.md`, `ui-upload.md`, `ui-ai.md` (home page banner only)). If SAP has no chapter for it, use the
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
