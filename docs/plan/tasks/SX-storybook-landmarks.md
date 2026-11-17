# SX — Storybook shared setup: no landmark wrapper around full-page stories

**Goal:** fix the shared-setup defect that blocks S4. `.storybook/preview.tsx` (decorator, ~line 40) renders the story
canvas as `<main>` in story view mode. Full-page blocks and layouts (AppShell, EmptyStates, Launchpad, ListReport,
ObjectPageFloorplan, and any component that renders its own `main`) then produce nested/duplicate `main` landmarks, and
the generic story tests correctly fail `landmark-main-is-top-level` / `landmark-no-duplicate-main`. Small card; run
before S4's third attempt. Independent of E4/E5/P*.

## Change

- The canvas is a `div`, not a landmark. Keep `data-fiori-story`, `data-fiori-args`, `data-theme`, `data-density`,
  `dir` and the visually hidden story heading.
- Stories that **aren't** full-page still need a `main` landmark for axe's `region` / `landmark-one-main` rules:
  give the canvas `role="main"` only when the story does not opt out — opt-out via
  `parameters.fiori.ownsLandmarks: true`, which `fioriMeta` sets for `registry:block` items and S4 sets for full-page
  layouts. Don't relax or disable any axe rule; don't touch block or component ARIA.
- Update `tests-storybook/` helpers if they locate the canvas by tag name (`main`) — use `[data-fiori-story]`.
- Add a test: a block story has exactly one `main` (the block's own) and passes both landmark rules; an ordinary story
  has exactly one `main` (the canvas).

## Files

`.storybook/preview.tsx`, `docs/stories/_lib/meta.ts`, `tests-storybook/*.ts` (locator updates + the new test).
Nothing else.

## Acceptance

AGENTS.md definition of done; `pnpm storybook:build && pnpm test:storybook` passes twice; no story's axe result gets
worse (compare violation counts before/after in the final message).
