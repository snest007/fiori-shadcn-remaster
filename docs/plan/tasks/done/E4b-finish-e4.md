# E4b — Finish E4: two own acceptance failures, then E4's acceptance

**Goal:** close card E4. Its fourth attempt (returned 2026-11-18) finished the five approved repairs and the initial
tree/audit baselines (977 records, 0 unlisted / 0 stale differences in two tree runs), but whole-card acceptance
failed on two checks. The owner's review (2026-11-20) found that **both failures come from E4's own changes**, so they
are E4's to finish, not P1's/P3's. Owner's decision, 2026-11-20.

Read first: `AGENTS.md` (Verification budget, tiered verification), `docs/plan/tasks/done/E4-a11y-parity.md`, and the
"Fourth-attempt result — 2026-11-18" section of `docs/plan/returns/done/E4.md` **on branch `codex/E4`**.

## Where

Continue on **`codex/E4`** in `.worktrees/E4` (head `6692dcd`). Merge main first: it is 90 commits ahead (S2–S4
stories, E6–E8 tooling, shared Storybook fixes, plan reorganization with cards in `tasks/done/`). Expect conflicts in
`tests-storybook/known-issues.ts`, `tests-storybook/accessibility.ts`, `docs/plan/README.md` and `registry/items/*.json`:
keep both sides; main's S2/S3/S4 blocks stay byte-for-byte. Leave the main checkout untouched.

## The two failures

| # | Check | What the owner's review found | What to do |
|---|---|---|---|
| 1 | `tests/visual.spec.ts`, all 9 passes: `label-custom-host` size mismatch (UI5 218 px wide, React 170–178 px) | The fixture is **new in E4** (`be3da07`). The UI5 side renders a bare `ui5-input` whose default width is 218 px (UI5 `Input.css` host width); the React side renders `Input` without a matching width. The two sides of the fixture don't compose the same layout. | Make both sides of the fixture lay out the same way (e.g. give both fields the same explicit width, or match UI5's host width on the React fixture wrapper). Change the **fixture**, not `Label`/`Input` sizing, unless the installed UI5 CSS proves the component itself is wrong. Keep the fixture's purpose (custom host keeps the label↔field association). |
| 2 | `tests-storybook/html-context.spec.ts:41`, Morning compact RTL `listbox`: axe `nested-interactive` on three options (Apples, Bananas, Cherries) | E4 changed List's multi-selection control from `aria-hidden` to `role="checkbox" tabindex=-1` inside `role="option"`, matching UI5 `ListItemTemplate.js:selectionElement`. UI5 has the same structure, so this is a known UI5-parity deviation from axe, introduced by E4's port. | Add a narrow marker in the **E4-owned** classifier (`tests-storybook/known-issues.ts`): this story/fixture, rule `nested-interactive`, only a `role=checkbox` that is the List-owned selection element directly inside its `role=option`, comment citing `ListItemTemplate.js:selectionElement`. Add a negative case (a different nested control, or a checkbox outside the selection slot, still fails). Don't change List, the decorator or the assertion. |

Rules: no tolerance, `skipCompare`, retries, sleeps, rule disabling or skipped stories. At most **2 hypotheses per
failure**. Remove the P1/P3 handoff text that the fourth attempt wrote for these two items (they are E4's now).

## Out of scope

- Main's S2/S3/S4 candidate patches (`docs/plan/handoff/S2-*`, `S3-*`, `S4-*`) and their `// S2`, `// S3`, `// S4`
  markers: leave them untouched and unapplied. After E4 merges, the owner reassigns them to their P cards.
- E5 convergence (ComboBox `LIST_ITEM_POSITION` through the locale provider): E5b does it.
- No new baseline entries beyond what fixing the two items requires; the ratchet only shrinks.

## Files

`docs/src/fixtures/label.tsx`, `docs/src/fixtures/label.ui5.ts`, `tests-storybook/known-issues.ts` (E4's classifier
only), `tests-storybook/known-issues.spec.ts` or `tests-storybook/html-context.spec.ts` (the negative case only),
`docs/plan/tasks/P1-parity-actions-fields.md` / `P3-parity-data.md` (remove the two handoff notes), `docs/plan/returns/done/E4.md`,
`docs/plan/README.md`, plus whatever the main merge requires. Nothing else.

## Budget (hard)

About 2 hours. **0 CI pushes.** E4 touches shared files, so card-done verification is the shared-file rule: after the
two fixes, `tests/a11y-tree.spec.ts` with the baseline **twice**, then the **full main suite once** and the **full
Storybook suite once** (fresh build). Browsers headless. At a limit: commit, add a short "E4b result" section at the
top of `docs/plan/returns/done/E4.md` and stop.

## Acceptance

1. Both failures pass; the five fourth-attempt repairs and their tests still pass.
2. Tree runs ×2: 0 unlisted / 0 stale differences, 0 capture failures. `pnpm test:summary` main ×1 and Storybook ×1:
   0 failed, 0 flaky. Copy the four summary lines.
3. `git diff main...HEAD -- tests-storybook/known-issues.ts` shows main's S2/S3/S4 blocks unchanged.
4. Tick **E4 and E4b** in `docs/plan/README.md`; move the return note out of the way per AGENTS.md (leave card files
   where they are; the reviewer moves them). Don't push or merge.

## Final message

Changed files, the four summary lines, each failure's fix and hypotheses used, CI rounds (0) and full-suite runs used,
merge conflicts and how they were resolved.

## Addendum — 2026-11-20: the ViewSettingsDialog marker (owner's decision)

E4b's run fixed both items and the tree/main acceptance, then stopped with 34 Storybook failures (all
ViewSettingsDialog). The owner's review: **E4 is right, the S3 marker's precondition is stale.** E4's SegmentedButton
puts the Tab stop on the selected option and leaves the `role=listbox` without `tabindex`, exactly as UI5
`SegmentedButtonItemTemplate.js` (`tabindex` on the `li role=option`). The S3 marker (unnamed mode listbox,
`aria-input-field-name`, owner P4) still requires `list.getAttribute("tabindex") === "0"`, so it no longer matches and
the known violation surfaces.

Continue on `codex/E4` (`dfae058`). **E4b may edit the S3 block for this one condition** (an exception to "main's S3
blocks stay byte-for-byte"):
- In the four places in `tests-storybook/known-issues.ts` that check the ViewSettingsDialog mode listbox (the S3
  `classifyS3UnnamedModeControl` path and the story/primary-docs guards), replace `list.getAttribute("tabindex") === "0"`
  with: the listbox has **no** `tabindex`, and exactly one option has `tabindex="0"` and it is the selected one
  (`aria-selected="true"`); the other options have `tabindex="-1"`. Cite `SegmentedButtonItemTemplate.js`.
- Change nothing else in those guards (names, option labels, orientation, multiselectable, story list, rule, owner P4).
- Update the matching negative cases in `tests-storybook/known-issues.spec.ts` so a listbox **with** `tabindex="0"` (the
  old shape) and an option-less or wrongly-focused list are both rejected.

Budget for this addendum: **one hypothesis**. Verify with the affected Storybook checks first
(`STORYBOOK_ONLY=view-settings-dialog`, plus `tests-storybook/known-issues.spec.ts`), then **one** full Storybook run
(main and tree acceptance from E4b's run stand; re-run main only if you change anything outside `tests-storybook/`).
0 CI pushes. Then tick E4 and E4b as the card says. If anything else fails, stop and report it.
