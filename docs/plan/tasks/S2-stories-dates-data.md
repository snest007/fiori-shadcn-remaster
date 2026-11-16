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

## Files

`docs/stories/<category>/<item>.stories.tsx` for the items above (new) and, if needed, JSDoc comments in their
`registry/ui/<name>.tsx` prop types. Nothing else.

## Acceptance

AGENTS.md definition of done; `pnpm storybook:build && pnpm test:storybook` passes twice with 0 failed / 0 flaky
(the S0 tests cover every story automatically); final message lists the stories per item and attaches screenshots of
three docs pages of your choice in Evening Horizon.
