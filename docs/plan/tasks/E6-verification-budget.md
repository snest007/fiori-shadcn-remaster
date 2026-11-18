# E6 — Fast, bounded verification (CI time, test loops, agent budget)

**Goal:** verifying a change should cost minutes and few tokens, not hours. Make CI faster, give agents a fast inner
test loop and compact output, and write a hard **round budget** into `AGENTS.md` so no run can keep pushing
"one more fix" without a limit. Owner's decision, 2026-11-18.

Run in one Codex session on branch `codex/E6`, in its own worktree (`.worktrees/E6`). This card is about the
repository's tooling, not a component: no `registry/` edits.

## Why (measured 2026-11-17)

- CI `check` job is one serial job: Playwright **21.9 min** (1418 tests, 3 workers), then Storybook **15.3 min**
  (1278 tests). About 38 min per push. Locally the same suite takes about 6 min.
- The definition of done runs the full suite twice per card, and `integrate.mjs verify` runs it three more times.
  Every small fix during a card is also usually checked with the full suite.
- The session that fixed Linux CI (PR snest007/petalo#3) pushed **4 rounds over about 4.5 h** and reached a context of
  about 400k tokens, mostly from waiting on runs and reading long logs. Nothing stopped it after round 2.

## 0. Preflight: stop and report if this fails

```bash
git switch main && git status --short   # empty
gh run list -R snest007/petalo --workflow CI --branch main -L 1   # latest main CI must be "success"
```

This card builds on PR #3 (the Linux CI fixes: `--disable-lcd-text`, serial visual passes, closing reference pages).
If the latest main CI isn't green, PR #3 isn't merged yet: stop and say so. Don't fix CI failures in this card.

## 1. Round budget in `AGENTS.md` (new section "Verification budget", placed before "Definition of done")

Write these as hard rules. They apply to every card and every agent (Codex and Claude):

1. **CI rounds: at most 2 pushes per task.** If CI is still red after the second push, stop. Commit the work in
   progress and write `docs/plan/returns/<card>.md` with:
   - the failing test names,
   - what each round changed and why,
   - your hypotheses for what's left,
   - what you would try next.
   Then end the run. The owner decides whether a third round happens.
2. **Local fix attempts: at most 2 per failing test.** Two hypotheses tried and it still fails → report it the same
   way. Don't widen the search in the same run.
3. **Inner loop = affected specs only.** While working, run only the specs your change can affect
   (`tests/<name>.spec.ts`, visual filtered to your fixtures — section 2). Run the full suite only at the end, for
   the definition of done.
4. **Compact output.** Never print a whole Playwright or CI log into the conversation. Use `pnpm test:summary`
   (section 2) or grep for summary and failing lines, at most about 50 lines. For CI, `gh run watch` once (no
   polling loops), then `gh run view --log-failed | grep` for the failing tests only.
5. **Long runs go in the background** with a single completion notification. Don't check on them in between.
6. **Time box:** if a task has used about 2 h of wall-clock time, or its own stated round limit, stop and report,
   even if the round limits above aren't reached yet.

Also add one line to the "Definition of done": the final message states how many CI rounds and how many full-suite
runs the task used.

## 2. Tooling (no new npm dependencies)

- **`pnpm test:summary [playwright args…]`** → `scripts/test-summary.mjs`. It runs Playwright with the given args,
  writes the full log to `test-results/summary-<timestamp>.log` and prints only:
  - the passed / failed / flaky / skipped counts and the duration,
  - each failing test's title with the first line of its error,
  - the log path.
  Exit code is Playwright's. On a green run it prints at most 5 lines.
- **Visual filter for the inner loop:** `VISUAL_ONLY=<prefix>[,<prefix>…]` restricts `tests/visual.spec.ts`,
  `visual-sapui5.spec.ts`, `visual-phone.spec.ts` and `visual-interaction.spec.ts` to fixtures whose id starts with a
  prefix. Fixture ids are already prefixed with the component name (AGENTS.md). Unset means everything, as today.
  - The filter must not weaken the full run.
  - When set, each spec also asserts that at least one fixture matched, so a typo can't pass silently.
- **`pnpm test:changed`** → `scripts/test-changed.mjs`. It maps `git diff --name-only main...HEAD` to specs using the
  ownership list in AGENTS.md rule 3:
  - `registry/ui/<name>.tsx` → `tests/<name>.spec.ts` + `VISUAL_ONLY=<name>`;
  - shared files (`registry/styles/fiori.css`, `registry/lib/*`, `playwright.config.ts`, `docs/src/main.tsx`,
    `docs/src/ui5-main.ts`, …) → it says "shared file changed: run the full suite" and exits non-zero.
  It runs through `test:summary`.
- **`scripts/ci-local.sh [playwright args…]`** runs the given specs inside `mcr.microsoft.com/playwright:v1.64.1-noble`
  (the version in `package.json`), the same way CI does: install, generate, build, `PORT`/`SAPUI5_PORT`,
  `--retries=0`. Use it to reproduce a Linux-only failure **before** spending a CI round.
  - Document it in AGENTS.md "Commands".
  - If Docker isn't available, the script says so and exits non-zero.

## 3. Faster CI (`.github/workflows/ci.yml`)

- Split the single job into parallel jobs:
  - `build` runs generate, typecheck, registry:build and build once, and uploads `dist/` plus the generated files as
    an artifact. If uploading costs more than it saves, each job may rebuild; say which you chose and why.
  - `test` is a matrix of Playwright `--shard=i/N`. Pick N (3–4) from measured shard times.
    - The visual specs stay serial within their own shard (PR #3's `mode: "default"`): don't run two UI5 reference
      passes at once on one runner.
    - The visual specs may get their own shard if that balances better.
  - `storybook` runs `storybook:build` and `test:storybook` in parallel with `test`, not after it.
- Cache Playwright's Chromium (`~/.cache/ms-playwright`, keyed on the Playwright version) and keep the `~/.ui5` cache.
- Upload `test-results/` on failure per shard, under distinct artifact names.
- Keep `--retries=0` and every test. Don't skip, filter or raise a tolerance in CI to make it faster.
- **Target:** the slowest job finishes in **≤ 12 min**. The whole run, from first job start to last job end, takes
  **≤ 15 min** (from about 38 min today).

## 4. Fewer redundant full runs

- `scripts/integrate.mjs verify`: default `--runs=2` (was 3). Update `INTEGRATION.md` and `RUN.md` to match.
- `RUN.md` worker prompt: add the budget (section 1) and "use `pnpm test:changed` while working, the full suite twice
  only at the end".
- `docs/plan/README.md` "How to run a card": same change.

## Files

- `AGENTS.md` (sections 1 and 2 only, plus the "Commands" lines)
- `docs/plan/README.md`, `docs/plan/RUN.md`, `docs/plan/INTEGRATION.md`
- `.github/workflows/ci.yml`
- `package.json` (`scripts` only; no dependency changes)
- `scripts/test-summary.mjs`, `scripts/test-changed.mjs`, `scripts/ci-local.sh`, `scripts/integrate.mjs`
- `tests/visual.spec.ts`, `tests/visual-sapui5.spec.ts`, `tests/visual-phone.spec.ts`,
  `tests/visual-interaction.spec.ts` (the `VISUAL_ONLY` filter and its guard only)

Nothing else. Don't change components, fixtures, tolerances, retries or test assertions.

## Budget for this card (it must follow its own rule)

- **At most 2 CI rounds.** Push `codex/E6` and open a PR (or use `workflow_dispatch` on the branch) to measure CI.
  Exception to AGENTS.md "Don't push": this card's acceptance is a CI timing, and it pushes only its own branch,
  never main.
- If CI isn't green with the timing target after round 2: stop, commit, write `docs/plan/returns/E6.md` as in
  section 1, and end the run.
- Local: `pnpm test:changed` / targeted specs while working; the full suite twice only at the end.

## Acceptance

1. The latest CI run on `codex/E6` is green.
   - Slowest job ≤ 12 min, total ≤ 15 min.
   - Total test count is unchanged: 1418 Playwright + 1278 Storybook, summed over shards.
2. `pnpm test:summary tests/button.spec.ts` prints ≤ 5 lines when green.
   - With one failure injected locally (not committed), it prints that test's title and first error line.
3. `VISUAL_ONLY=button PORT=4310 pnpm exec playwright test tests/visual.spec.ts` finishes in under 2 min locally.
   - `VISUAL_ONLY=doesnotexist` fails with a clear message.
4. `pnpm test:changed`:
   - on a branch that only touches `registry/ui/button.tsx`, it runs just the button spec and the button visual
     fixtures;
   - on a branch that touches `registry/styles/fiori.css`, it says "run the full suite".
5. `scripts/ci-local.sh tests/toolbar.spec.ts` passes in Docker (or the final message says Docker was unavailable).
6. AGENTS.md has the "Verification budget" section with the six rules; RUN.md, INTEGRATION.md and README match.
7. Full local suite twice at the end: 0 failed, 0 flaky.

## Final message

- Changed files.
- CI timing before and after (per job).
- The two local summary lines.
- How many CI rounds and full local runs you used.
- Anything skipped and why.
