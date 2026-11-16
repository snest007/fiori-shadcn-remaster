# G5 — Usage guidance: coverage gate + agent eval

**Goal:** make missing guidance a build error, merge the G1–G4 outputs cleanly, and check that the generated skill
actually helps an agent pick the right component and floorplan. Depends on G0–G4 (merged).

## Scope

1. **Integration of the generated skill.** If merging G1–G4 left conflicts or stale output in `skills/shadcn-fiori/`,
   discard it and run `pnpm skill:build`; commit only generated output. Never hand-edit generated files.
2. **Coverage gate.** Turn on `--require-usage` in `registry:build`. Every `registry:ui` and `registry:block` item must
   have `usage`. `registry:lib` items (`f6-navigation`, `use-is-phone`, `variants`) and the script-emitted items
   (`fiori-theme`, `icons`, illustrations, `fiori`) stay exempt — list the exemption in the script with the reason.
3. **Consistency review** (read the generated `skills/shadcn-fiori/references/*.md` end to end):
   - every look-alike pair points at each other in the right direction (A says "use B when …", B says "use A when …"
     with complementary conditions, not contradictory ones);
   - no mention of controls this registry doesn't have;
   - the floorplan picker in `SKILL.md` covers all 7 blocks with non-overlapping "use when".
   - every item follows the G0 addendum (source thresholds kept, first `useWhen` bullet is a user task, at most one
     prop-centred bullet).
   Fix wording in the item JSON (not in generated files). List every fix in the final message.
   **Rewrite the G0 pilot to the addendum**: `table`, `data-table`, `list`, `tree`, `select`, `combobox`,
   `multi-combobox`, `multi-input`, `value-help-dialog`, `list-report`. They were written before it and lead with
   props (e.g. combobox's three `useWhen` bullets are all API). Keep their routing; add the select 2–12 / sort above 8
   and table ~200 / 1,000 thresholds on both sides of each pair.
3b. **Main exports filter — `scripts/build-skill.mjs` / `scripts/skill/usage.mjs`.** "Main exports" currently lists
   every runtime export (e.g. list shows `handleNavigationKey`, `isSingle`, `navItems`, `useListCoreValue`), which
   invites agents to use internals. List only the components a consumer composes: names from the item's demo
   `docs[].name`/props prefixes plus PascalCase exports, excluding `*Context`, `use*` hooks and lower-case helpers
   unless the item's docs name them (e.g. `createDataTableColumnHelper`, `formatCondition`, `sliderValueAt` may stay if
   documented). Put the rule in a comment; regenerate; spot-check `list`, `data-table`, `value-help-dialog`, `input`.
4. **Eval set — `skills/shadcn-fiori/evals/evals.json`** (hand-written, committed; same shape as the SAP/shadcn skill
   evals: `{ prompt, expect: { components?: string[], block?: string, notComponents?: string[] } }`), ~20 cases, e.g.:
   - "A page where buyers search and filter purchase orders and approve several at once" → block `list-report`.
   - "Show one supplier with general data, contacts and documents, editable" → `object-page-floorplan`.
   - "Let the user pick a country (about 200 options) with type-ahead" → `combobox`, not `select`.
   - "Pick one of three shipping speeds" → `radio-group` or `segmented-button`, not `combobox`.
   - "Sort and filter 5 000 rows by column" → `data-table`, not `table`.
   - "Tell the user the save worked" → `toast`, not `message-strip`/`dialog`.
   Cover every block at least once and every look-alike group from G0–G4.
5. **Eval runner — `scripts/eval-skill.mjs`.** Offline and deterministic (no model calls). It does not try to
   understand the prompt; it checks that the guidance graph supports the expected answer: (a) every expected and
   `notComponents` name is a registry item; (b) for each `notComponents` item, its `avoidWhen` has an entry whose
   `use` includes the expected item; (c) for an expected block, the `SKILL.md` floorplan picker has a row for it.
   Print a table; exit non-zero on failure. Wire it into `pnpm check`.
   Then, **once, manually**: run each prompt through yourself with only `skills/shadcn-fiori/` as context and record
   picked vs expected in the final message (this is a sanity read, not a CI gate).

## Files

`scripts/build-registry-json.mjs` (flag only), `scripts/build-skill.mjs` + `scripts/skill/usage.mjs` (exports filter), `scripts/eval-skill.mjs` (new), `skills/shadcn-fiori/**`,
`package.json` (scripts only), `usage` fields in any `registry/items/*.json` / `registry/block-items/*.json`
(wording fixes from the review), `docs/plan/README.md` (tick G5).

## Acceptance

AGENTS.md definition of done; `pnpm registry:build` fails if any usage is removed (prove it once on a temp copy);
`node scripts/eval-skill.mjs` passes; manual eval results in the final message.
