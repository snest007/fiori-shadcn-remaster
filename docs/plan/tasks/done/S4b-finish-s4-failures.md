# S4b — Finish S4: the last 11 Storybook failures, then S4's acceptance

**Goal:** close card S4. Its fifth (final) attempt classified all 33 Storybook failures, fixed or marked 22, and
stopped at the hypothesis limit with 11 left. This small card finishes those 11 and runs S4's remaining acceptance,
so S4 can be merged and ticked. Owner's decision, 2026-11-19.

Read first: `AGENTS.md` (especially "Verification budget"), `docs/plan/tasks/done/S4-stories-navigation-layout-floorplans.md`
("Component defects you find"), the top two sections of `docs/plan/returns/done/S4.md`, and
`docs/plan/handoff/S4-a11y-candidates/FIFTH-ATTEMPT.md` (on `codex/S4`).

## Where

Continue on the existing branch **`codex/S4`** in `.worktrees/S4` (head `9fef30c`). Don't create a new branch.
Merge main first. Leave the main checkout untouched.

## The 11 failures (from S4's fifth attempt)

| # | Failing check | Classification | What S4 already tried | What to do |
|---|---|---|---|---|
| 1–4 | SideNavigation **Flat** and **Parent Selected**, axe (Morning + HCB): `label-content-name-mismatch` | Component defect (default name omits the visible "New" tag; React and UI5 both); candidate `0004` | (a) a story-supplied name — reverted; (b) an owned-node marker — still fails | Inspect the real tag host, its children and the computed name (`axe` node target + `page.accessibility`), then write the marker against exactly that node. Don't change story data to hide the defect. |
| 5–6 | SideNavigation **Open**, axe (Morning + HCB) | Component defect (focus boundaries inside the menu); candidate `0004` | one marker — still fails | Compare the exact role-bearing menu descendants axe reports with the marker's selector and rule ids. |
| 7–8 | VariantManagement **Empty List**, axe (Morning + HCB): empty heading | Component defect (empty H2; React and OpenUI5); candidate `0005` | one marker that assumed no inner element — wrong | Allow exactly Title's own empty inner `span`, nothing else. |
| 9 | Tabs **Open**, named controls without errors | Story mistake | one `waitFor` — still logs a missing "Hidden tabs" listbox | Find why the story's play/render looks up the listbox before the overflow popover renders it; fix the story to wait for that real open state. Not a sleep. |
| 10–11 | S4's own new tag/heading adversarial regressions in `tests-storybook/s4-regressions.spec.ts` | Follows 1–4 and 7–8 | — | They pass once the markers above are exact; keep them as strict as they are. |

Rules for every marker (unchanged from S4): one self-contained `// S4` block in `tests-storybook/known-issues.ts`;
match by story + rule + the component-owned node; comment
`component defect, fixed by E4 — see docs/plan/handoff/S4-a11y-candidates`; no rule disabling, no skipped stories,
no baselines, no edits to other cards' blocks or to S0's dispatcher logic. Don't change components, blocks,
stylesheets, fixtures or public APIs, and keep all candidate patches (0001–0006) unapplied.

## Files

`docs/stories/navigation/*.stories.tsx` and `docs/stories/floorplans/*.stories.tsx` owned by S4 (Tabs/Open only, unless a
marker proves a story mistake), `tests-storybook/known-issues.ts` (S4 block only), `tests-storybook/s4-regressions.spec.ts`,
`docs/plan/handoff/S4-a11y-candidates/**` (report updates only), `docs/plan/returns/done/S4.md`, `docs/plan/README.md`.
Nothing else. A defect that also breaks a story already on main is a shared-setup stop: report it, don't fix it.

## Budget (hard)

- **Each of the 11 gets at most 2 new hypotheses** in this card (S4's earlier attempts don't count against S4b).
- Inner loop: only the affected stories (`pnpm test:summary -c playwright.storybook.config.ts -g "<story names>"`).
- After all 11 pass: **Storybook full ×2** and **main full ×2** (main changed since S4's last accepted runs).
- **About 1.5 hours** of wall-clock time in total. **0 CI pushes.**
- Browsers headless or in a background tab group (budget rule 7); close everything you started.
- If anything is still red at the limit: commit, add a short "S4b result" section at the top of
  `docs/plan/returns/done/S4.md` (the failing checks, the hypotheses tried, what to try next) and stop.

## Acceptance

1. All 11 checks above pass; the 22 already fixed or marked still pass.
2. `pnpm generate && pnpm typecheck && pnpm registry:build` and a fresh `pnpm storybook:build` succeed.
3. Storybook full suite twice and main full suite twice: **0 failed, 0 flaky**. Copy the four summary lines.
4. Every marker added or changed in S4b has a matching negative case in `s4-regressions.spec.ts` (a different node,
   rule or story is still rejected).
5. `docs/plan/handoff/S4-a11y-candidates/FIFTH-ATTEMPT.md` lists every component defect with its marker, and the
   patches still pass `git apply --check`.
6. Tick **both S4 and S4b** in `docs/plan/README.md` in the final commit. Don't push or merge; the owner reviews and
   merges `codex/S4`.

## Final message

Changed files, the four suite summary lines, each of the 11 with its outcome (fixed story / exact marker), hypotheses
used per item, CI rounds (0) and full-suite runs used, and any shared file touched.
