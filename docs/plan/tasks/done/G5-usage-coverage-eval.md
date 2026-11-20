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

Added after the G1–G4 merge (main `00b3bac`):

6. **Slim SKILL.md — `scripts/build-skill.mjs`, `scripts/skill/SKILL.template.md`.** SKILL.md is loaded on every
   trigger and is now 20.5 KB (SAP's whole `sap-fiori-guidelines` SKILL.md is ~9 KB). Keep in SKILL.md only:
   frontmatter, install, Fiori rules, a **compact floorplan picker** (block → first `useWhen` bullet → the blocks named
   in `avoidWhen`; one line per block, no `<br>` lists), a **category index** (one line per reference: which kinds
   of decision it answers, e.g. "Forms — choosing between select, combobox, multi-combobox, multi-input, radio-group,
   segmented-button; text and numeric entry; files and colours"), and the Verify section from item 7.
   Move the per-category component picker tables to the top of each `references/<category>.md`.
   Fail the generator when SKILL.md exceeds **8 KB**, with the size in the message. Regenerate; record before/after
   sizes in the final message.
7. **Output loop — agents' pages must build.** The eval above proves routing, not code. Close the loop in two parts:
   - **In the skill:** a short "Verify" section in SKILL.md telling the agent to finish by running the app's
     typecheck and build, and to open the page and check the console, before reporting done; and to re-read the
     installed component source when a prop it used doesn't type-check.
   - **Recorded outputs + gate:** pick 6 cases from `evals.json` (at least 3 floorplans, e.g. list-report,
     object-page-floorplan, wizard-page, plus 3 component-choice cases embedded in a small page). For each, write
     the page **using only `skills/shadcn-fiori/` and the installed sources as context** (no reading of docs demos or
     tests), as `skills/shadcn-fiori/evals/outputs/<case-id>.tsx` (a default-exported React component, imports from
     `@/components/ui/*` and `@/components/*` like a consumer app). Add `"output": "<case-id>.tsx"` to those cases.
     New `scripts/eval-skill-build.mjs`: create a fresh consumer app the same way `scripts/smoke-install.mjs` does
     (extract its setup into exported helpers there without changing its own behaviour or output), `shadcn add` the
     items each output imports, copy the outputs in, then **typecheck, build and render each in Chromium**, failing
     on type errors, build errors, page errors or console errors. Also check each output imports the expected
     block/component of its case and none of its `notComponents`. Wire it into `node scripts/integrate.mjs verify`
     next to the smoke install (not into every Playwright run). Note in a comment that the outputs are re-recorded
     by hand when the skill changes materially; they are evidence, not snapshots to keep green by editing.
   In the final message: for each recorded output, what the first attempt got wrong (type errors, wrong prop, wrong
   component) before you fixed it, and whether the fix needed a skill wording change (then make that change in the
   item JSON).
8. **Small fixes seen in the G1–G4 merge review.** `app-shell` `useWhen` bullets 2–3 describe the sample, not a
   user task; move sample-adaptation notes to `variations`. Every floorplan's `avoidWhen` ends with a
   "favorite app tiles → launchpad" bullet; keep it only where a user could plausibly confuse the two
   (app-shell, empty-states), drop it elsewhere. Check `tag` ↔ `token` and other pairs added in G1–G4 for the
   symmetry rule.

## Files

`scripts/build-registry-json.mjs` (flag only), `scripts/build-skill.mjs` + `scripts/skill/**` (exports filter, slimming,
Verify section), `scripts/eval-skill.mjs` (new), `scripts/eval-skill-build.mjs` (new), `scripts/smoke-install.mjs`
(extract helpers only), `scripts/integrate.mjs` (add the eval build to `verify`), `skills/shadcn-fiori/**`,
`package.json` (scripts only), `usage` fields in any `registry/items/*.json` / `registry/block-items/*.json`
(wording fixes from the review), `docs/plan/README.md` (tick G5).

## Acceptance

AGENTS.md definition of done; `pnpm registry:build` fails if any usage is removed (prove it once on a temp copy);
`node scripts/eval-skill.mjs` and `node scripts/eval-skill-build.mjs` pass; SKILL.md ≤ 8 KB and the generator fails
above it; `node scripts/smoke-install.mjs` output unchanged; manual eval results and the first-attempt notes for
recorded outputs in the final message.
