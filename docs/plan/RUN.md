# Run cards with sub-agents (one Codex session does everything)

You are the **orchestrator**. You don't write component code yourself: you start one sub-agent per card, one fresh
reviewer sub-agent per finished card, then integrate and report. Read `/AGENTS.md` and `docs/plan/INTEGRATION.md` first.

Prompt the owner uses: `Read AGENTS.md and docs/plan/RUN.md, then run cards <ids>.`
(e.g. `run cards F3` or `run cards A1 A2 A3 B2`). If no ids are given, take the first unchecked cards in
`docs/plan/README.md` whose dependencies are met, at most 4.

## 1. Prepare (you)

```bash
git switch main && git status --short            # must be empty — otherwise stop and report
node scripts/integrate.mjs prepare <ids…>         # one worktree + branch + ports per card, deps installed
```

`prepare` prints one JSON line per card: `{ card, branch, path, PORT, SAPUI5_PORT }`. Keep them.
Only run cards in parallel if the backlog says they're independent (same wave, disjoint files).

## 2. Implement — one **worker** sub-agent per card, in parallel

`spawn_agent` with `agent_type: "worker"`, `fork_context: false`, and this message (fill in the values):

```text
You implement ONE task card of the petalo repo.
Work ONLY in <path> (a git worktree on branch <branch>). First `cd "<path>"`; never cd into or edit any other
checkout, never switch branches, never merge or push.
Read <path>/AGENTS.md, then implement <path>/<card>. Follow its acceptance checks exactly.
For Playwright always use PORT=<PORT> SAPUI5_PORT=<SAPUI5_PORT> (other agents use other ports).
Commit your work on <branch> (small commits, messages ending with the Co-Authored-By line from AGENTS.md).
Use tier 1 while working: `pnpm test:changed` (changed main specs, visual fixtures and stories).
Tier 2 at card done: `pnpm test:changed --repeat-each=2` + `pnpm test:smoke` once (about 5 minutes).
Shared-file cards (anything test:changed reports as shared, including .storybook, Storybook helpers, shared
styles/libs, Playwright configs, docs entry points or CI) run full main + Storybook once through test:summary instead.
The second full verification is the milestone/CI. Old "main ×2, Storybook ×2" card text means tier 2 under this rule.
test:changed ignores only docs/plan/README.md and docs/plan/{tasks,returns,handoff}/** bookkeeping; a bookkeeping-only
branch prints "bookkeeping only: no tests needed" and exits 0. Other docs/plan files (e.g. a11y-audit.md and
i18n-audit.md, read by Storybook) stay shared.
Tier 3 is the reviewer's job at milestones (end of wave / every 3–5 merged cards / release):
`pnpm test:milestone` once + push + CI when authorized; --runs=2 for a release (about 20 minutes local / 12 minutes CI).
Follow AGENTS.md verification budget: at most 2 CI pushes (only if the card authorizes them), at most 2 local fix
hypotheses per failing test, about 2 hours total. If a limit is reached, commit work in progress, write
docs/plan/returns/<id>.md with failing tests, each round's change/reason, remaining hypotheses and next steps,
then end the run. Never print whole logs: at most about 50 summary/failure lines. Use `gh run watch` once,
then `gh run view --log-failed | grep` for failing tests only. Background long runs; notify only on completion.
Final message: changed files, tier 2 summary lines, CI round/full-suite run counts, shared files
touched and why, anything deferred.
```

Wait for all workers (`wait_agent`), then `close_agent` each. A worker that fails or stops early: read its last
message, check `git -C <path> log main..<branch>`; resume it once (`resume_agent`/`send_input`) with what is missing.
If it fails twice, mark the card "returned" and continue with the others.

## 3. Review — one fresh **reviewer** sub-agent per finished card

The author can't review itself, so never reuse the worker. `spawn_agent` with `agent_type: "worker"` (it must run
commands), `fork_context: false`, message:

```text
You review ONE finished task-card branch of the petalo repo. Do NOT edit, commit, merge or switch branches.
Repo: <main checkout path>. Branch: <branch>. Card: <card>. Worktree with the code: <path>.
Read AGENTS.md, then docs/plan/INTEGRATION.md section 1 ("Review each branch") and do exactly that for this branch:
1. `node scripts/integrate.mjs scope <branch>` and judge every UNLISTED file (justified or not, why).
2. Fidelity review against the reference source the card names (node_modules/@ui5/… or OpenUI5 1.154 — get it with
   `npm pack @openui5/<lib>@1.154.0` into /tmp if it isn't in node_modules): at least 5 behaviours, every number /
   limit / text the card mentions, and that each Behaviour bullet has a test.
3. Re-run tier 2 in the card worktree: pnpm test:changed --repeat-each=2 + pnpm test:smoke once, or full main and
   Storybook once for a shared-file card (through test:summary). Tier 1 targets 1–3 minutes; tier 2 about 5 minutes.
4. Forbidden shortcuts (raised tolerance, skipCompare without a concrete reason, retries, waitForTimeout/sleeps,
   test.skip, hard-coded colours/sizes that have a --sap*/--fiori-* variable).
Reply with exactly:
VERDICT: MERGE | MERGE-WITH-NOTES | RETURN
SCOPE: <UNLISTED file → justified/not, one line each, or "clean">
MISMATCHES: <one line each: behaviour — ours x, reference y (file:line)>, or "none"
SHORTCUTS: <one line each>, or "none"
NOTES: <anything else, max 5 lines>
```

Reviewers can run in parallel. RETURN when a behaviour mismatch changes behaviour, an unjustified UNLISTED file exists,
or a forbidden shortcut was used. For a RETURN you may send the reviewer's findings to the original worker once
(`resume_agent` + `send_input`: "fix these, keep the same rules") and re-review with a **new** reviewer.

**Returned cards.** If `docs/plan/returns/<id>.md` exists, the card was returned earlier and its branch/worktree still exist:
don't `prepare` it. Start the worker in the existing `.worktrees/<id>` with this message instead:
"Read AGENTS.md, then fix exactly what docs/plan/returns/<id>.md lists, on the existing branch, with the tests it asks for."
Review it with a new reviewer as usual (the reviewer also checks every item of the return note). When the card merges,
move `docs/plan/returns/<id>.md` to `docs/plan/returns/done/` and the card to `docs/plan/tasks/done/` in the
integration commit, then run `node scripts/plan-check.mjs`.

**Agent limit.** The host allows only a few open agent threads: close each worker/reviewer as soon as you have its final
message, before spawning the next. Never reuse a reviewer across cards (it has seen another card's code); if you can't
open a new thread, finish the current ones first.

## 4. Integrate (you)

Follow `docs/plan/INTEGRATION.md` sections 2–4 for the cards whose verdict is MERGE / MERGE-WITH-NOTES:

```bash
node scripts/integrate.mjs merge <branches in backlog order>   # add --accept-scope only for files a reviewer justified
node scripts/integrate.mjs verify                               # tier 3 milestone: main + Storybook once, retries off, default workers, + consumer checks
node scripts/integrate.mjs cleanup
```

Run tier 3 at the end of a wave, every 3–5 merged cards, or a release; `verify` delegates to `pnpm test:milestone`
and defaults to one run of each full suite. `--runs=2` is available for a release. Then push + CI when authorized.

Post-merge failures: use the six causes in INTEGRATION.md. You may spawn a worker sub-agent for a fix (give it the
failing test names, the run log path in `.integration/`, and the six causes), but run `verify` yourself afterwards.
Returned cards keep their branch and worktree for the owner to look at — `cleanup` skips unmerged branches.

## 5. Report (your final message)

Paste `.integration/REPORT.md` with its Notes section filled in, plus one line per card:
`<id>: merged | merged with notes | returned — <reviewer verdict summary>`.
Close any sub-agent still open. Keep it short; the owner reads the report, not your process.
