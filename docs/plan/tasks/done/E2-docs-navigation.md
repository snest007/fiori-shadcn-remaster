# E2 — Docs site navigation

**Goal:** the docs page is one long scroll of ~75 demos. Make it browsable like a component library site.

## Scope

- Left side navigation (use our own `SideNavigation` and `NavigationLayout`) grouped by category (Actions, Forms, Dates,
  Data, Overlays, Display, Navigation, Layout, Floorplans) with one page per component: `/#/button` hash routing (no new
  dependency), each page showing the demo, an install snippet (`npx shadcn add @fiori/<name>`), a props table generated
  from a small hand-written `docs` field, and links "Fixtures" (`/?fixtures&only=<name>`) and "UI5 reference"
  (`/ui5.html?only=<name>`).
- Add `category` and `docs` (short description + main props) to each `docs/src/demos/<name>.tsx` via `defineDemo`
  (extend the `Demo` type in `docs/src/demos/types.ts`).
- Shell: our `ShellBar` with theme select and density toggle (replace the current Toolbar header).
- Floorplans section links to `block.html?name=<block>`.
- Keep `?fixtures` and `ui5.html` exactly as they are (tests rely on them).
- Tests that load `/index.html` and look for demos must keep working: either render all demos on a hidden "all" route
  used by tests (`/#/all`) or update those specs' `goto` to the component route. Prefer updating specs: each spec goes to
  `/index.html#/<name>`. List all spec edits.

## Files

Shared (allowed): `docs/src/main.tsx`, `docs/src/demos/*.tsx` (add metadata only), `docs/src/demos/types.ts`, `tests/*.spec.ts`
(`goto` lines only), `tests/a11y.spec.ts` (axe over every route — loop over routes).

## Acceptance

Every component reachable from the nav; axe clean on every route in Morning Horizon and HCB; full suite green;
AGENTS.md definition of done.
