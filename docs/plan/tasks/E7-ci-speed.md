# E7 — CI back under 12 minutes as the suites grow

**Goal:** every CI run finishes in about 12 minutes again, and stays there as S2, S5 and the P/H/X waves add tests.
Owner's decision, 2026-11-19. Follows E6 (`tasks/E6-verification-budget.md`), which reached 9m46s; after S3/S4 grew
Storybook from 1,280 to 3,193 tests, main's CI takes about 19 minutes and three jobs were once cancelled at the old
12-minute limit with no failing test (`87adba6` raised the hard kill to 20 minutes as a stopgap).

Run in one Codex session on branch `codex/E7`, in its own worktree (`.worktrees/E7`). Tooling only: no `registry/`,
`docs/stories/`, component or test-assertion edits.

## Measured on main (run 44477319958, 2026-11-19)

| Job | Total | `playwright install --with-deps chromium` | Tests |
|---|---:|---:|---:|
| storybook (2) | 18m39s | 4m59s | 12m47s |
| storybook (1) | 13m44s | — | — |
| test (1, visual-phone) | 9m31s | — | — |
| Earlier run 44475465099 | — | **8m07s** on one runner | — |

Two causes: (1) installing Chromium's system packages through apt on every job (3–8 min, varies by runner);
(2) the Storybook suite (3,193 tests) split into only 3 shards (≈1,065 tests and up to 13 min each).

## 0. Preflight (stop and report if it fails)

```bash
git switch main && git status --short           # empty
gh run list -R snest007/petalo --workflow CI --branch main -L 1   # latest main CI: success
```

## 1. Stop installing browser system packages on every job

Pick one, measure, and say which you chose and why:
- **A — run the test jobs in the Playwright container** `mcr.microsoft.com/playwright:v<version>-noble` (version must
  equal `@playwright/test` in `package.json`; today 1.64.1, as in `scripts/ci-local.sh`). The image has Chromium and
  its system packages; Node 24 still comes from `actions/setup-node` or the image's equivalent. Keep `--ipc=host` /
  the options Playwright documents for CI containers. Check that the pixel comparisons still pass in the container
  (the fonts and the `--disable-lcd-text --font-render-hinting=none` launch flags from PR #3 must still hold).
- **B — cache the apt packages** as well as `~/.cache/ms-playwright`, so `install --with-deps` only verifies.

A is preferred if pixel tests pass unchanged: it also matches `scripts/ci-local.sh`, so a Linux failure reproduced
locally is the same environment as CI. If A changes any pixel result, don't adjust tolerances: fall back to B.

## 2. Shard by measured time, not by count

- Storybook: pick the shard count from measured per-shard test time so the slowest Storybook job is ≤ 9 min of tests
  (likely 4–5 shards). Keep `--retries=0`.
- Playwright: keep the four non-visual shards and the serial visual phases (E6/PR #3 rules: reference passes never
  overlap on one runner). Rebalance only if a job is over target.
- Put the shard counts in one place in `ci.yml` with a comment that states the measured times, so the next card that
  adds tests knows when to add a shard.

## 3. Keep the timeout honest

- Target: slowest job ≤ **12 min**, whole run ≤ **14 min**.
- After the target is met, lower `timeout-minutes` from 20 to **15** (headroom for a slow runner, still catching a
  real hang) and update the comment `87adba6` added.

## 4. A guard so this doesn't silently regress

Add a short step at the end of each test job (or a final `timing` job) that prints the job's own test duration and
writes a GitHub `::warning::` when the tests alone exceed 10 minutes. A warning only — never fail CI on timing.
Mention it in AGENTS.md "Verification budget" rule 3 in one line: when a card adds many tests, check the CI timing
warning and add a shard in the same card.

## Files

`.github/workflows/ci.yml`, `scripts/ci-local.sh` (only if option A needs it to stay identical to CI), `AGENTS.md`
(the one line in section 4), `docs/plan/README.md`. Nothing else.

## Budget (hard)

- **At most 2 CI rounds** (push `codex/E7` and use the PR or `workflow_dispatch`; never push main). This card's
  acceptance is a CI timing, so pushing its own branch is allowed.
- No local full suites needed unless you change something outside `ci.yml`; if you change `ci-local.sh`, reproduce
  one spec in Docker (`scripts/ci-local.sh tests/toolbar.spec.ts`).
- About 1.5 hours. If still over target after round 2: commit, write `docs/plan/returns/E7.md` with the per-job
  timings of both rounds and what to try next, and stop.

## Acceptance

1. The latest CI run on `codex/E7` is green: every job, 0 failed, 0 flaky. Test counts unchanged (1,418 Playwright,
   3,193 Storybook, summed over shards).
2. Slowest job ≤ 12 min; whole run ≤ 14 min. Copy the per-job durations into the final message, before and after.
3. No browser-system-package install longer than 30 s in any job (option A or B).
4. `timeout-minutes: 15`, the timing warning step, and the AGENTS.md line are in place.
5. Tick E7 in `docs/plan/README.md`. Open a PR from `codex/E7`; don't merge it.

## Final message

Option chosen (A/B) and why, the per-job timing table before/after, shard counts, CI rounds used, and files changed.
