# S2 — Storybook stories: dates and data

**Goal:** write the Storybook stories for every item listed below, following the setup and the binding
**story-writing rules** of [S0](S0-storybook-setup.md). Stories only: no component, style, fixture or demo changes
(JSDoc-only prop comments are allowed, as S0 says). Depends on S0 (merged).

## Items

`date-picker`, `date-range-picker`, `date-time-picker`, `time-picker`, `picker-field`, `table`, `list`, `tree`, `timeline`, `upload-collection`, `object-status`, `object-number`, `object-identifier`.

Category = the item's `category` in `docs/src/demos/*.tsx` (via `fioriMeta`).

## Specific asks

Pickers: closed + `Open` story each, min/max, value states, formats. `table`: selection modes, popin vs scroll overflow, growing, group rows, row actions, drag & drop, a composition with a Toolbar above. `list`/`tree`: selection modes, item types, growing. `object-status`: all states and `indication1`–`indication10`, inverted, with icon.

## How

1. Re-read S0 "Story-writing rules" and the pilot stories (`button`, `input`, `select`, `calendar`, `data-table`,
   `dialog`): match their structure, naming and depth.
2. Per item: read `registry/ui/<name>.tsx` (props and their JSDoc), `docs/src/fixtures/<name>.tsx` (the list of
   states) and `docs/src/demos/<name>.tsx` (a realistic starting example), then write
   `docs/stories/<category>/<name>.stories.tsx`.
3. Open each docs page in `pnpm storybook` in Morning Horizon and High Contrast Black and check that it reads well
   (Controls change the component; "Show code" is copy-pasteable; no story overlaps another), and use it with the keyboard
   only: every control is reachable, named, and behaves as in the component's spec (S0 "Accessibility is part of
   every example").

## Component defects you find

Stories are docs, not component fixes (S0 rule). When a strict check fails because of the **component** (axe violation,
unnamed control, focus ring on pointer, wrong role — not a mistake in your story):

1. Confirm it's the component: reproduce it on the docs site demo or a fixture, and compare with UI5 2.28 (note whether
   UI5 has the same problem).
2. Don't change the component. Write a candidate fix as a patch plus a short report (defect, UI5 behaviour, proposed
   change, which test proves it) into `docs/plan/handoff/<card-id>-a11y-candidates/` — same layout as
   `docs/plan/handoff/S0-a11y-candidates/`.
3. In `tests-storybook/`, mark the failing check as narrowly as S0 did (`tests-storybook/known-issues.ts`: specific
   story, axe rule, node selector or focus assertion) with the comment
   `component defect, fixed by E4 — see docs/plan/handoff/<card-id>-a11y-candidates`. No global rule disabling, no
   baselines, no skipped stories.
4. List the defects in your final message.

S1–S4 run in parallel and may all touch `tests-storybook/known-issues.ts`: add your entries as one self-contained block
headed `// <card-id>` (no edits to other cards' blocks or to S0's), so merges stay mechanical.

If E4 is already merged when you find a defect, do the same, but write `fixed by E4-followup` instead of `fixed by E4`;
S5 collects those into a follow-up card.

## Files

`docs/stories/<category>/<item>.stories.tsx` for the items above (new), if needed JSDoc comments in their
`registry/ui/<name>.tsx` prop types, and for component defects `tests-storybook/known-issues.ts` (narrow markers) and
`docs/plan/handoff/<card-id>-a11y-candidates/**` (new). Nothing else.

## Acceptance

AGENTS.md definition of done; `pnpm storybook:build && pnpm test:storybook` passes twice with 0 failed / 0 flaky
(the S0 tests cover every story automatically); final message lists the stories per item and attaches screenshots of
three docs pages of your choice in Evening Horizon.
