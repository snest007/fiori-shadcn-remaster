# G0 — Usage guidance: schema, pipeline, docs, agent skill + pilot

**Goal:** give coding agents (and people) "when to use / when not to use / use X instead" guidance for every component,
and "use case + layout" for every floorplan block, kept in **one source** per item and emitted to three places:
the registry JSON, the docs site, and a generated agent skill (`skills/shadcn-fiori/`). This card builds the pipeline and
writes the guidance for a pilot set only; G1–G4 fill in the rest, G5 closes coverage.

## Content source

SAP's own design guidance, as packaged in `SAP/ai-skills-library` (Apache-2.0), skill `skills/sap-fiori-guidelines`
(`SKILL.md` + `references/*.md`, sections "When to Use", "Use X if", "Do not use X if", "… instead").
Pin commit `cd0bb455ec68db3f83db94b200546618c32f8ab2`:

```bash
git clone https://github.com/SAP/ai-skills-library.git .ref/ai-skills-library
git -C .ref/ai-skills-library checkout cd0bb455ec68db3f83db94b200546618c32f8ab2
```

Add `.ref/` to `.gitignore`. If the sandbox has no network, say so and fall back to the `### Overview` text in
`node_modules/@ui5/webcomponents*/dist/custom-elements.json` plus the component's own behaviour; mark such items
`"source": "ui5-apidoc"` instead of `"sap-fiori-guidelines"`.

Writing rules (apply to this card and G1–G4):

- Rewrite in your own words, short, imperative English. No copying of paragraphs. No links to sap.com.
- `useWhen`: 2–5 bullets. `avoidWhen`: 1–5 bullets; each names the alternative **from this registry** in `use`
  when one exists. Never mention controls this registry doesn't have (grid table, analytical table, tree table, charts,
  micro charts, AI button, Message Box, …): drop that bullet or map it to a real item only if the mapping is honest
  (e.g. "large or sortable data" → `data-table`).
- Distinguish look-alikes explicitly (select vs combobox vs multi-combobox vs multi-input vs value-help-dialog;
  table vs data-table vs list vs tree; dialog vs popover vs responsive-popover; message-strip vs toast vs
  illustrated-message; tag vs object-status; tabs vs segmented-button; …).
- Reflect our actual API: if a rule depends on a prop, name the prop (`selectionMode="Multiple"`, `growing`, …).

## Schema (in the item's own JSON — no new files per component)

`registry/items/<name>.json` and `registry/block-items/<name>.json` get an optional `usage` object:

```jsonc
"usage": {
  "summary": "One sentence: what it is for.",
  "useWhen": ["…", "…"],
  "avoidWhen": [{ "when": "Users pick one of fewer than ~8 fixed options", "use": ["select", "radio-group"] }],
  "source": "sap-fiori-guidelines",            // or "ui5-apidoc"
  // blocks only:
  "layout": [                                   // nesting, outer → inner, one line per region, component names
    "DynamicPage",
    "  header: VariantManagement title, FilterBar",
    "  content: Toolbar (actions) + DataTable",
    "  footer: Bar with mass actions (shown on selection)"
  ],
  "variations": ["…"]                           // optional: common adaptations that keep the floorplan valid
}
```

`use` entries are registry item names (components or blocks). `layout` names use the exported React names.

## Pipeline

1. **Validation + emit — `scripts/build-registry-json.mjs`.** Read `usage`; fail the build when: a `use` name is not a
   registry item; a block `layout` names a component whose registry item is not in that block's `registryDependencies`;
   `useWhen`/`avoidWhen` sizes are outside the limits above. Emit per item: `meta.usage` (the object) and `docs`
   (a short markdown string rendered from it). Check whether `shadcn build` keeps `docs`/`meta` in `public/r/<name>.json`
   (shadcn 4.23 schema); if it strips them, post-process `public/r` in the script and say so in a comment.
   Add a `--require-usage` flag that fails when any `registry:ui` / `registry:block` item lacks `usage`
   (`registry:lib` items are exempt). Not enabled yet (G5 enables it).
2. **Docs site — `docs/src/main.tsx`.** Component page: a "When to use" section above the props table
   (Use when / Don't use when, with each alternative linked to `#/<name>`). Floorplans page: per block, use case +
   layout (as a code block) + variations. Import the item JSON directly (Vite JSON import); don't duplicate text in demos.
   Items without `usage` render nothing extra.
3. **Agent skill — `scripts/build-skill.mjs` (new) → `skills/shadcn-fiori/` (committed).**
   - `SKILL.md`: frontmatter (`name: shadcn-fiori`, a `description` that triggers on Fiori/SAP/UI5 + shadcn, building
     enterprise pages, choosing components/floorplans); install line (`npx shadcn add @fiori/<name>`); hard rules
     (tokens only, value states, one emphasized button per page/dialog, …) kept short; a **floorplan picker** table
     (block → use when → don't use when → instead); a **component picker** table per category (name → summary);
     index of reference files.
   - `references/<category>.md` (Actions, Forms, Dates, Data, Overlays, Display, Navigation, Layout, Floorplans):
     per item: summary, use when, avoid when (→ alternative), main exports, install command.
     Categories and export names come from `docs/src/demos/*.tsx` (`category`, `docs[].name`) and
     `registry/ui/<name>.tsx` exports — parse, don't hand-maintain.
   - Static parts live in `scripts/skill/SKILL.template.md`; everything else is generated. Deterministic output
     (sorted, no timestamps).
   - `skills/shadcn-fiori/NOTICE`: guidance adapted from SAP/ai-skills-library (Apache-2.0), commit pinned above.
   - `package.json`: `"skill:build": "node scripts/build-skill.mjs"`, and run it at the end of `registry:build`.
4. **README:** a short "Use with coding agents" section: copy `skills/shadcn-fiori` into `.claude/skills/` or
   `.agents/skills/`.

## Pilot content (this card writes these, carefully — they set the bar for G1–G4)

Components: `table`, `data-table`, `list`, `tree`, `select`, `combobox`, `multi-combobox`, `multi-input`,
`value-help-dialog`. Block: `list-report`. Read each one's `registry/ui/<name>.tsx` (and the block source) so the
guidance matches what the code really does.

## Files

Shared (allowed): `scripts/build-registry-json.mjs`, `scripts/build-skill.mjs` (new), `scripts/skill/**` (new),
`skills/shadcn-fiori/**` (new, generated), `docs/src/main.tsx`, `package.json` (scripts only), `.gitignore`,
`README.md`, `tests/usage-guidance.spec.ts` (new), and the pilot items' `registry/items/*.json` /
`registry/block-items/list-report.json` (`usage` only).

## Tests — `tests/usage-guidance.spec.ts`

- Docs: `/#/table` shows "When to use" with the pilot bullets; the `data-table` link navigates; `/#/button`
  (no usage yet) shows no empty section; the Floorplans page shows the list-report layout.
- Registry: `public/r/table.json` contains the usage (in `docs` and/or `meta`, whichever survives).
- Skill: running `node scripts/build-skill.mjs` twice yields no diff (`git diff --exit-code skills/`).
- Validation: a fixture item with an unknown `use` name makes the build script exit non-zero (run the script on a temp
  copy; don't leave files behind).

## Acceptance

AGENTS.md definition of done; the pilot reads well to a human reviewer (paste the generated
`references/data.md` pilot section and the list-report floorplan entry into your final message); `skills/` is
up to date with the generator.
