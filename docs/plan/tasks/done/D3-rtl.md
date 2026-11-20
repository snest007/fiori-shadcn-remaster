# D3 — RTL verification (after waves A–C)

**Goal:** prove right-to-left works. Many components contain RTL code paths that were never tested.

## Scope

1. **Visual:** extend the harness with a `dir` option. In `docs/src/fixture-types.ts` `readPageOptions()` add
   `dir: "ltr" | "rtl"` from `?dir=rtl`; both `docs/src/main.tsx` (fixtures page) and `docs/src/ui5-main.ts` set
   `document.documentElement.dir`. UI5 reads `dir` from the DOM (check `@ui5/webcomponents-base` `directionChange` /
   `getEffectiveDir`). In `tests/visual.spec.ts` add an RTL pass for **Morning Horizon cozy only** (one extra test) to keep
   the suite fast.
2. **Behavioural:** for every component with direction-dependent keys (grep `rtl` in `registry/ui`: tabs, toolbar,
   breadcrumbs, radio-group, segmented-button, slider, side-navigation, table, multi-combobox, tokenizer, carousel,
   flexible-column-layout, calendar, avatar group), add one RTL test in its spec: arrows are mirrored where UI5 mirrors them.
3. **Icons:** icons with `ltr: false` must mirror (`registry/ui/icon.tsx` already does `rtl:-scale-x-100`); add a fixture
   with a navigation arrow icon in RTL.

## Files

Shared (allowed for this card): `docs/src/fixture-types.ts`, `docs/src/main.tsx`, `docs/src/ui5-main.ts`,
`tests/visual.spec.ts`. Component files only to fix RTL bugs found. List every component fix in the commit message.

## Acceptance

RTL visual pass green (fix components; only skipCompare with a concrete reason); new RTL tests green; LTR suite unchanged;
AGENTS.md definition of done.
