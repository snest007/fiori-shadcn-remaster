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
You implement ONE task card of the shadcn-fiori repo.
Work ONLY in <path> (a git worktree on branch <branch>). First `cd "<path>"`; never cd into or edit any other
checkout, never switch branches, never merge or push.
Read <path>/AGENTS.md, then implement <path>/<card>. Follow its acceptance checks exactly.
For Playwright always use PORT=<PORT> SAPUI5_PORT=<SAPUI5_PORT> (other agents use other ports).
Commit your work on <branch> (small commits, messages ending with the Co-Authored-By line from AGENTS.md).
Final message: changed files, the two full-suite summary lines, shared files touched and why, anything deferred.
```

Wait for all workers (`wait_agent`), then `close_agent` each. A worker that fails or stops early: read its last
message, check `git -C <path> log main..<branch>`; resume it once (`resume_agent`/`send_input`) with what is missing.
If it fails twice, mark the card "returned" and continue with the others.

## 3. Review — one fresh **reviewer** sub-agent per finished card

The author can't review itself, so never reuse the worker. `spawn_agent` with `agent_type: "worker"` (it must run
commands), `fork_context: false`, message:

```text
You review ONE finished task-card branch of the shadcn-fiori repo. Do NOT edit, commit, merge or switch branches.
Repo: <main checkout path>. Branch: <branch>. Card: <card>. Worktree with the code: <path>.
Read AGENTS.md, then docs/plan/INTEGRATION.md section 1 ("Review each branch") and do exactly that for this branch:
1. `node scripts/integrate.mjs scope <branch>` and judge every UNLISTED file (justified or not, why).
2. Fidelity review against the reference source the card names (node_modules/@ui5/… or OpenUI5 1.154 — get it with
   `npm pack @openui5/<lib>@1.154.0` into /tmp if it isn't in node_modules): at least 5 behaviours, every number /
   limit / text the card mentions, and that each Behaviour bullet has a test.
3. Forbidden shortcuts (raised tolerance, skipCompare without a concrete reason, retries, waitForTimeout/sleeps,
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
delete `docs/plan/returns/<id>.md` in the integration commit.

**Agent limit.** The host allows only a few open agent threads: close each worker/reviewer as soon as you have its final
message, before spawning the next. Never reuse a reviewer across cards (it has seen another card's code); if you can't
open a new thread, finish the current ones first.

## 4. Integrate (you)

Follow `docs/plan/INTEGRATION.md` sections 2–4 for the cards whose verdict is MERGE / MERGE-WITH-NOTES:

```bash
node scripts/integrate.mjs merge <branches in backlog order>   # add --accept-scope only for files a reviewer justified
node scripts/integrate.mjs verify                               # 3 full runs, retries off, + smoke install
node scripts/integrate.mjs cleanup
```

Post-merge failures: use the six causes in INTEGRATION.md. You may spawn a worker sub-agent for a fix (give it the
failing test names, the run log path in `.integration/`, and the six causes), but run `verify` yourself afterwards.
Returned cards keep their branch and worktree for the owner to look at — `cleanup` skips unmerged branches.

## 5. Report (your final message)

Paste `.integration/REPORT.md` with its Notes section filled in, plus one line per card:
`<id>: merged | merged with notes | returned — <reviewer verdict summary>`.
Close any sub-agent still open. Keep it short; the owner reads the report, not your process.
