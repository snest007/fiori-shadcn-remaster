# Integration card (for Codex)

Merge finished task-card branches into `main`, prove the result works, clean up, and hand back one report.
Run this in a **fresh Codex session** in the main checkout (not in a card's worktree). Read `/AGENTS.md` first.

Prompt: `Read AGENTS.md and docs/plan/INTEGRATION.md, then integrate the pending codex/* branches.`

## 0. Preconditions

```bash
git switch main && git status --short          # must be empty; if not, stop and report what is there
node scripts/integrate.mjs status              # lists codex/* branches, their worktrees, merged or PENDING
```

If a card's branch has uncommitted work in its worktree, **don't touch it** — report it and integrate the others.
Branches that aren't `codex/*` are not yours: report them, don't delete them.

## 1. Review each branch (before merging)

For every pending branch, in backlog order (A1, A2, … see `docs/plan/README.md`):

1. `node scripts/integrate.mjs scope <branch>` — every file must be `ok` (listed in the card / owned by the card's
   component) or `called-out` (named in a commit message). For each `UNLISTED` file decide:
   - justified (e.g. a needed export from a shared component, a fixture index line) → keep, explain in the report;
   - not justified (unrelated edits, reformatting, scratch files, generated files) → **don't merge** the branch; list
     the files in the report as "returned to the card author".
2. **Fidelity review** (this is the step Claude used to do — be skeptical, the author can't review itself):
   read the card's "Behaviour" section and, for each bullet, find the code that implements it and the reference source
   it ports (`node_modules/@ui5/...` or OpenUI5 1.154, see the card). Check constants, defaults, keyboard keys, texts and
   edge cases against the reference, not against the card's wording. Spot-check at least 5 behaviours per card,
   including every number/limit/text the card mentions. Also check that each bullet has a test.
   Record mismatches in the report as `mismatch: <behaviour> — ours <x>, reference <y> (<file>:<line>)`.
   A mismatch that changes behaviour blocks the merge of that branch; cosmetic ones go in the report.
3. Look for forbidden shortcuts: `tolerance` raised, `skipCompare` without a concrete reason comment, `retries`,
   `waitForTimeout`/sleeps in tests, `test.skip`, `!important` added outside harness files, hard-coded colours/sizes that
   have a `--sap*`/`--fiori-*` variable (`grep -nE '#[0-9a-f]{3,6}\b|[0-9]+px' <changed files>`).

## 2. Merge

```bash
node scripts/integrate.mjs merge <branch…>       # in backlog order; refuses on UNLISTED files unless --accept-scope
```

### Conflicts

They are almost always index/registry files several cards append to. Keep **both** sides:
- `docs/plan/README.md`: tick every merged card.
- `sapui5/webapp/fixtures.js`, `docs/src/fixtures*/index.ts`, `registry/items/*.json` dependency lists: union of entries.
- A real code conflict in a component file means two cards touched the same component: resolve by keeping both
  behaviours, then make sure both cards' tests pass; explain it in the report.

Then `git add <files> && git commit --no-edit` and re-run `merge` for the remaining branches.

## 3. Verify

Follow AGENTS.md's verification budget: at most two local fix hypotheses per failing test, two CI pushes if
authorized, and about two hours per task. Stop and write `docs/plan/returns/<card>.md` when a limit is reached.
Keep logs on disk and report compact summaries; background long runs and notify only on completion.

```bash
node scripts/integrate.mjs verify                # install, generate, typecheck, registry, 2 full runs (retries off), smoke install
```

It writes `.integration/REPORT.md` and per-run logs (`run-N.log`). PASS requires both runs green and the
smoke install green. Run it with the **default workers** (no `--workers` flag). `--workers=1` is only a diagnostic for
cause 6 — a final PASS obtained with `--workers=1` doesn't count, because parallel runs are what the owner uses (the
suite takes ~3 min in parallel, ~13 min with one worker).

### When something fails after merging (it passed on each branch alone)

The cause is almost always one of these. Check them in this order, fix the **cause**, commit with a message that says
which one it was, and re-run `verify`:

1. **Over-broad locator** in a test now that more demos are on the page (`getByRole("listbox")`, `getByText("Save")`,
   duplicate demo ids). Fix: scope to the component's demo (`#<name>-demo …`, `[data-slot=…]`), rename duplicate ids.
2. **A popup painted outside its fixture cell** covering another cell (look at `test-results/visual*/…-ours.png` /
   `-ui5.png` / `-sapui5.png` / `-diff.png` with an image viewer). Fix in the fixture/harness: hide replaced parents,
   pin placement (`sapui5/webapp/popup-in-place.js`, `docs/src/fixtures/ui5-popup-in-place.ts`).
3. **Focus stolen by another fixture** closing a dialog/popover or changing a field's look (`:focus-visible`). Fix the
   component if the reference doesn't close on focus-out (e.g. message boxes), otherwise the fixture.
4. **Test acting before async state settled** (focus moving into a list, value re-formatting, listeners attaching):
   wait for the state (`expect.poll`, `toBeFocused`, a page round-trip) — never `waitForTimeout`, never retries.
5. **Fractional layout** shifting later cells (sizes off by 1px): cells must sit in whole-pixel slots (`snapSlots`).
6. **Load-dependent reference rendering** (only fails with several workers): confirm by running the spec with
   `--workers=1` several times; if it's the reference (not ours) that varies, run that spec serially and say so.

**Known intermittent reference artifact** (seen once, 2026-11-11, not reproduced in 3+3 later full runs):
`visual-sapui5` cell `variant-management-error-open`, where the **SAPUI5 reference** PNG shows an empty white popover body
(ours is correct). Diagnosis is archived in `.integration/run-C1-E1-20261111-180213/integration-diagnosis/DIAGNOSIS.md`.
If it is the only failure and the reference image (not ours) is the blank one: re-run `verify` once; if it passes, note
"known reference artifact recurred" in the report and continue. If it recurs twice in a row, stop and report — then it
needs a real fix in `sapui5/fixtures/variant-management.js` readiness.

If after two honest attempts a failure is still unexplained, stop: leave the branch merged if it was clean before,
otherwise roll back with the command `merge` printed first (`git reset --hard <main before merging>`, also in
`.integration/main-before.txt` and the report), and describe the failure in the report.

## 4. Clean up

```bash
node scripts/integrate.mjs cleanup               # deletes merged codex/* branches and their clean worktrees
```

Also delete temp files you created. Don't push.

## 5. Report (paste this back to the owner)

Fill the "Notes" section at the end of `.integration/REPORT.md`:

- per branch: merged / returned (why), scope exceptions accepted (file → reason), fidelity mismatches found,
  forbidden shortcuts found;
- conflicts and how they were resolved;
- fixes made after merging: file → which of the six causes → one line;
- anything that needs the owner's decision.

Then print the whole report as your final message. Keep it short; the owner reviews it, not your process.
