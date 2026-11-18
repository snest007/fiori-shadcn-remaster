# P2a — Accessibility and localization parity: Calendar and date pickers

> **Split from P2 on 2026-11-17 (owner's decision, X0 approval amendment 2).** Calendar and the date pickers go first so
> the Calendar extension pilot (H6 → H6b → H6c) isn't blocked behind P2's other 11 components. Runs right after E4 and
> E5; may run in parallel with P1 and P3–P6 (different files), but never with P2, H6, H6b or H6c on these files.
> Known items for this group: the Calendar selection announcement (`returns/E4.md`, if E4 doesn't land it) and the
> day/month pickers' non-mirrored horizontal arrow keys in RTL (X0 spike README). Week-number defects stay in **H6c**.
>
> **Baseline owners.** E4 and E5 were scoped before the split, so their baselines may label these four components'
> entries `owner: "P2"`. As this card's first commit, re-label exactly those entries (`caseId` / component prefix
> `calendar`, `date-picker`, `date-range-picker`, `date-time-picker`) to `"P2a"` in `tests/a11y-tree-baseline.json`,
> `tests/a11y-audit-baseline.json`, `tests/i18n-audit-baseline.json` and the audit docs' owner columns. Change
> nothing else; if the ratchet scripts hard-code `P1`–`P6`, add `P2a` to their owner list in the same commit and name
> it as a shared edit.

**Goal:** shrink this group's share of the two ratchet baselines to zero: every `tests/a11y-tree-baseline.json`
entry with `owner: "P2a"`, every `tests/a11y-audit-baseline.json` gap/unverified count for these components, and
every `tests/i18n-audit-baseline.json` gap for them. Depends on **E4 and E5 merged** (they create the baselines and
the provider). P1–P6 touch disjoint component files and may run in parallel; run at most two at a time (they all
run the full tree matrix).

## Components

`calendar`, `date-picker`, `date-range-picker`, `date-time-picker`.

## How

1. Start from the data, not from memory: `node scripts/a11y-baseline.mjs --list P2a` (or filter the JSON by
   `owner`), the audit rows for these components in `docs/plan/a11y-audit.md` and `docs/plan/i18n-audit.md`
   (including their triage: `absent-feature`, `delegation`, `owner-review`, …), and the announcement inventory
   entries marked `owner: P2a`.
2. Work **one component at a time**, one commit each (`P2a: <component> — <what>`). For each entry, read the UI5
   source the entry cites (rule 1) and decide:
   - **Port it** — the usual case: make our tree / text / announcement match UI5 (rules 9 and 10), with a fixture on
     both sides if the state has none, and a behaviour test for keyboard paths and announcements.
   - **Permanent deviation** — only for a documented UI5 bug, an inert wrapper, or rule 5 over UI5: an `a11yDiff`
     entry with a concrete reason quoting the UI5 line. Never for "not ported yet".
   - **Absent feature** — UI5 has a feature we don't (e.g. a property we never built): don't build features here.
     Record it in the audit as `absent-feature` with the UI5 property, and list it in your final message so the owner
     can plan it. Its entries leave the baseline only if the component legitimately doesn't render that state.
3. After each component: `node scripts/a11y-baseline.mjs --prune P2a` and lower the i18n baseline counts, in the
   same commit as the fix (the ratchet fails otherwise).
4. Component defects that S-cards marked `fixed by E4-followup` for these components are yours too: fix them and
   remove the marker.

## Rules

- No new features, no API removals (rule 7); additive props only where UI5 has an equivalent property.
- Don't touch other groups' components, the baseline entries of other owners, or the comparison harness (changes to
  `tests/a11y-tree*.ts` or the normaliser need a concrete harness bug, called out in the commit message).
- Pixel parity still holds (rule 4): run `tests/visual.spec.ts` for every component you change.

## Files

The listed components' own files (rule 3); `tests/a11y-tree-baseline.json`, `tests/a11y-audit-baseline.json`,
`tests/i18n-audit-baseline.json` (only this card's entries); `docs/plan/a11y-audit.md`, `docs/plan/i18n-audit.md`
(only these components' rows); `tests-storybook/known-issues.ts` (remove markers only); and, for new text keys, the
generated language packs (`registry/i18n/**`, regenerate — don't hand-edit).

## Acceptance

AGENTS.md definition of done; `owner: "P2a"` entries in the tree baseline: **0**; audit/i18n gap counts for these
components: 0 except rows recorded as `absent-feature` (listed in the final message with their UI5 property) and
justified `a11yDiff`s; Storybook suite green twice. If the card turns out bigger than L, finish whole components,
stop, and report which components remain — the owner splits the rest into `P2a2`.
