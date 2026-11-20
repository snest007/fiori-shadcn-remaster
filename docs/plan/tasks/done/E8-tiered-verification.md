# E8 — Tiered verification: per-card tests in minutes, full suites at milestones

**Goal:** a card's own verification takes about 5 minutes instead of about 30, without losing coverage. Heavy full
suites move to milestones (end of a wave, about every 3–5 merged cards, or a release), where the owner's reviewer
runs them once together with CI. Owner's decision, 2026-11-20.

Run in one Codex session on branch `codex/E8`, in its own worktree (`.worktrees/E8`). Tooling and docs only: no
`registry/`, `docs/stories/`, component, fixture or test-assertion changes.

## Why (measured on main, 2026-11-19)

| Suite | Tests | One run | Where the time goes |
|---|---:|---:|---|
| main (`tests/`) | 1,418 | ~7 min | `a11y.spec.ts` docs-route axe 17%, phone/popover behaviour, visual specs 25% |
| Storybook (`tests-storybook/`) | 4,073 | ~9–12 min | **95% is `storybook.spec.ts`'s generic per-story loop**: Morning axe, HCB axe, named controls, for every story |

Today's definition of done runs both suites twice per card (~30 min), although a card usually touches 1–3 components
and every untouched test was verified at the last merge.

## The three tiers (write these into AGENTS.md)

| Tier | When | What | Target |
|---|---|---|---|
| **1 — inner loop** | while working | `pnpm test:changed` for the changed components (main specs + visual fixtures + their stories) | 1–3 min |
| **2 — card done** | before handing back; reviewer re-runs it | `pnpm test:changed` **twice** + `pnpm test:smoke` once | ~5 min |
| **3 — milestone** | end of a wave / every 3–5 merged cards / release; run by the reviewer, not the card | `pnpm test:milestone` once + push + CI | ~20 min local, ~12 min CI |

**Shared-file cards** (anything `test:changed` reports as shared: `.storybook/**`, `tests-storybook/*.ts` helpers,
`registry/styles/fiori.css`, `registry/lib/**`, Playwright configs, `docs/src/main.tsx` / `ui5-main.ts`, CI) run the
full main and Storybook suites **once** at card done; the second run is the milestone/CI.

## 1. `pnpm test:changed` also covers Storybook

Extend `scripts/test-changed.mjs`:
- For each changed component name, also run its Storybook checks: the generic `storybook.spec.ts` tests whose story
  id belongs to that component (`<category>-<name>--*`), plus any `tests-storybook/*.spec.ts` the branch changed
  (e.g. a card's own `sN-*.spec.ts` regressions). Add a `STORYBOOK_ONLY=<name>[,<name>…]` filter to
  `storybook.spec.ts` (same contract as `VISUAL_ONLY`: unset = all stories; set = only matching ids; fail clearly if
  nothing matches). Match whole story-id segments (no suffix matching; see `562a4dc`).
- A changed story file (`docs/stories/<cat>/<name>.stories.tsx`) maps to the same component name.
- It needs a fresh `storybook-static/`: rebuild it when any `docs/stories/**`, `.storybook/**` or `registry/**` file is
  newer than `storybook-static/index.json`, and say so.
- Keep today's behaviour: shared files → print "shared file changed: run the full suite" and exit non-zero; a component
  without its own spec runs its visual fixtures and prints a notice.
- `--repeat-each=N` passes through, so tier 2 can be one command: `pnpm test:changed --repeat-each=2`.

## 2. `pnpm test:smoke` (one run, ≤ 3 min)

A fixed, small set that catches breakage in shared paths a component-scoped run can't see:
- the docs site builds and one docs route renders without console errors;
- one `visual.spec.ts` pass filtered to a few stable fixtures (e.g. `VISUAL_ONLY=button,input`);
- `tests-storybook/docs-globals.spec.ts`, `named-controls.spec.ts`, `pilots.spec.ts`;
- the registry payload / install-shape tests that run without a network.
Put the list in one place (`scripts/test-smoke.mjs`) with a comment saying why each entry is there.

## 3. `pnpm test:milestone`

Runs `pnpm generate && pnpm typecheck && pnpm registry:build`, the full main suite once and the full Storybook suite
once (fresh build), through `test:summary`, and writes `.integration/milestone-<date>/REPORT.md` with the summary
lines, durations and the 10 slowest spec files of each suite. Exit non-zero on any failure or flaky test.
`--runs=2` is available for a release; default 1.

## 4. Rules and docs

- **AGENTS.md**
  - Definition of done: replace "run it twice" with tier 2 (and the shared-file rule).
  - Verification budget rule 3: describe tiers 1–3 and say tier 3 is the reviewer's job at milestones.
  - Commands: add `test:smoke`, `test:milestone`, `STORYBOOK_ONLY`.
- **`docs/plan/RUN.md`, `docs/plan/INTEGRATION.md`, `docs/plan/README.md` "How to run a card":** same change.
  `integrate.mjs verify` becomes the milestone entry point: `--runs` defaults to 1.
- **Card templates:** where task cards say "main ×2, Storybook ×2", README's "How to run a card" now states that this
  means tier 2 unless the card touches shared files. Don't rewrite old cards.

## Files

`scripts/test-changed.mjs`, `scripts/test-smoke.mjs` (new), `scripts/test-milestone.mjs` (new),
`scripts/integrate.mjs`, `package.json` (`scripts` only), `tests-storybook/storybook.spec.ts` (the `STORYBOOK_ONLY`
filter and its no-match guard only), `AGENTS.md`, `docs/plan/RUN.md`, `docs/plan/INTEGRATION.md`,
`docs/plan/README.md`. Nothing else. No dependency changes.

## Budget (hard)

About 1.5 hours. **0 CI pushes** (this card doesn't change CI). This card touches shared files, so at card done run
the full main suite once and the full Storybook suite once, plus the acceptance commands below. At most 2 hypotheses
per failing check; at the limit, commit, write `docs/plan/returns/E8.md`, and stop.

## Acceptance

1. On a scratch branch that only touches `registry/ui/toolbar.tsx` (don't commit it), `pnpm test:changed` runs the
   toolbar main spec, its visual fixtures and only the `*-toolbar--*` Storybook stories, and finishes in under
   3 minutes. Copy its summary line.
2. On a scratch branch that touches `registry/styles/fiori.css`, it prints "run the full suite" and exits non-zero.
3. `STORYBOOK_ONLY=doesnotexist` fails with a clear message; unset, `storybook.spec.ts` still has the same test count
   as before (4,073 in the full suite).
4. `pnpm test:smoke` passes in ≤ 3 minutes; `pnpm test:milestone` passes and writes the report (this is your one full
   run of each suite).
5. AGENTS.md, RUN.md, INTEGRATION.md and README describe the same three tiers and the shared-file rule.
6. Tick E8 in `docs/plan/README.md`. Don't push or merge.

## Final message

Changed files, the summary lines from acceptance 1, 4 (smoke and milestone), the measured time of tier 2 for the
toolbar example, CI rounds (0), full-suite runs used, and any shared file touched.
