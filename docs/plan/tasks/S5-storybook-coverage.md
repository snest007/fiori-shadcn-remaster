# S5 — Storybook coverage gate and docs-site handover

**Goal:** make Storybook complete and keep it complete. Depends on S1–S4 (merged).

## Scope

1. **Coverage gate** — `tests-storybook/coverage.spec.ts` (new): every `registry:ui` and `registry:block` item in
   `registry/items/` and `registry/block-items/` has a Storybook entry (a CSF file with `parameters.fiori.name` equal to
   the item name, or an MDX page for `registry:lib`); fail with the list of missing names. Every story file has a
   `Playground` story (blocks excepted).
2. **State coverage check** — for each component, every value of a union-typed prop named `variant`, `design`,
   `valueState`, `size`, `selectionMode` or `layout` in its docgen output appears in at least one story's `args` (or the
   Playground's `options`). Report the gaps; fix them in the stories.
3. **Docs-site handover** — the docs site's component pages (`/#/<name>`) get a prominent "Open in Storybook" link to
   the matching docs page (`./storybook/?path=/docs/<category>-<name>--docs`). The docs site keeps its fixtures, UI5
   reference and floorplan pages unchanged.
4. **Locale toolbar** — if `.storybook/preview.tsx` has no Locale menu yet (E5 ran before S0 was merged, so it skipped
   its section 6), add the Locale toolbar and its test as described in E5 section 6. Skip if E5 isn't merged.
5. **AGENTS.md** — rule: a PR that adds a component or a visual state must add/extend its stories; the coverage gate
   enforces the first half.
6. **README** — make the Storybook URL the first "browse components" link.

## Files

`tests-storybook/coverage.spec.ts` (new), any `docs/stories/**` file (gap fixes), `docs/src/main.tsx` (the link
only), `.storybook/preview.tsx` (Locale toolbar only), `tests-storybook/storybook.spec.ts`, `AGENTS.md`, `README.md`.

## Acceptance

AGENTS.md definition of done; `pnpm storybook:build && pnpm test:storybook` passes twice with 0 failed / 0 flaky,
including the coverage gate; final message lists any gaps that were found and fixed.
