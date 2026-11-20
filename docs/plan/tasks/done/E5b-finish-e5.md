# E5b — Finish E5: the phone time-view hang, the Select Open marker, then E5's acceptance

**Goal:** close card E5. Its fourth attempt (returned 2026-11-18) finished the named repairs, the i18n ratchet
(1,359 gaps, all P-owned) and the German consumer proof, but acceptance failed. The owner's review (2026-11-20)
re-ran the failures on an idle machine: **only two are real**. Owner's decision, 2026-11-20.

Read first: `AGENTS.md` (Verification budget, tiered verification), `docs/plan/tasks/done/E5-l10n-parity.md`, and the
"Fourth-attempt outcome — RETURN, 2026-11-18" section of `docs/plan/returns/done/E5.md` **on branch `codex/E5`**.

## Where

Run **after E4b is merged into main.** Continue on **`codex/E5`** in `.worktrees/E5` (head `856f7f4`). Merge main
first (it includes E4 and S2–S4, E6–E8). Expect conflicts in `tests-storybook/known-issues.ts`, `.storybook/preview.tsx`
(keep main's Docs-child rerender/story-globals logic **and** E5's Locale toolbar/provider), `docs/plan/README.md` and
`registry/items/*.json`: keep both sides; main's blocks stay byte-for-byte. Leave the main checkout untouched.

## What the owner's review found (idle machine, E5 worktree, ports 4360/4361)

- `a11y.spec.ts` "docs page has no axe violations" ×4: **4 passed** alone. Load-related, not a defect.
- `color-palette-popover: outside pointer dismisses without selection`: **passed** alone. Load-related.
- `visual-phone.spec.ts` ×8: **8 failed** alone (main: 8 passed in 1.2 min). Real.
- Storybook `Forms/Select/Open` axe ×2: real (classifier shape no longer matches). Not re-run.

## 1. The phone time-view hang (real defect, E5's)

A per-fixture probe found one case: `date-time-picker-phone-time` (`docs/src/fixtures-phone/d1b-popups.tsx`). Its
React page never reaches `data-ready`; **the main thread is blocked** (a 3 s `page.evaluate` never returns). The
fixture's `MutationObserver` clicks the phone toggle's "Time" button on every DOM mutation; since E5's
`date-time-picker.tsx` changes (`accf70b`, `useFioriLocale` in `DateTimeSelection`, localized date/time labels), that
click evidently causes a mutation that triggers the click again: an infinite loop.

- Find the exact cycle (which render or state update the click causes) with a headless probe; don't guess.
- Fix the **cause**. If the component re-renders or changes DOM on every click of an already-selected view, that is a
  component bug (UI5's `DateTimePicker` doesn't re-render when the same view is pressed). Fix it in
  `date-time-picker.tsx`. If the component is correct and only the fixture's observer is unsafe, make the fixture
  click once (disconnect after the first successful switch), not on every mutation.
- Add a regression: the phone time-view fixture reaches `data-ready` within its normal time, and pressing the active
  view button again causes no further render loop.

## 2. Select Open Storybook marker (classifier shape)

`Forms/Select/Open` axe (Morning + HCB) fails because the E4-owned classifier in `tests-storybook/known-issues.ts`
expects `aria-hidden-focus` on the whole `#storybook-root` scope, while E5's tree reports it on the focusable trigger
itself, plus `page-has-heading-one`. Decide with evidence which is right:
- If E5's Locale provider/live region changes what Radix `hideOthers` hides (the trigger is no longer inside the
  hidden scope), that is an E5 regression: fix the provider placement, not the marker.
- If the new shape is the correct current behaviour, update the marker to match exactly that node and rule, with a
  negative case. Don't widen it.

## 3. Convergence left from E4

E4 kept ComboBox `LIST_ITEM_POSITION` as a `texts` default because E5 was unmerged. Route it through the locale
provider like the other texts (a prop still wins).

## Files

`registry/ui/date-time-picker.tsx` (only if item 1 proves it), `docs/src/fixtures-phone/d1b-popups.tsx`, `registry/ui/combobox.tsx`
(item 3), the relevant `tests/*.spec.ts` / `tests-storybook/*.spec.ts` regressions, `tests-storybook/known-issues.ts`
(E4/E5 classifier entries only), the Locale provider placement if item 2 proves it, `docs/plan/returns/done/E5.md`,
`docs/plan/README.md`, plus whatever the main merge requires.

## Budget (hard)

About 2 hours. **0 CI pushes.** At most **2 hypotheses per item**. Shared-file card: at the end run the full main suite
once and the full Storybook suite once (fresh build), plus the localized de-DE / zh-CN / ar-EG matrices and the i18n
ratchet. **Don't run the full suites concurrently with another heavy job** (they share the machine): if a timing test
fails, re-run that spec alone once before treating it as a defect, and record both results. Browsers headless. At a
limit: commit, add a short "E5b result" section at the top of `docs/plan/returns/done/E5.md` and stop.

## Acceptance

1. `visual-phone.spec.ts`: 8 passed. The new regression passes.
2. `Forms/Select/Open` axe passes in both themes, by fix or by an exact marker with a negative case.
3. ComboBox position text comes from the provider; its existing tests still pass.
4. Full main ×1 and Storybook ×1: 0 failed, 0 flaky; i18n ratchet passes; localized matrices pass. Copy the summary lines.
5. Tick **E5 and E5b** in `docs/plan/README.md`. Don't push or merge.

## Final message

Changed files, the cause of the hang (file:line), each item's fix and hypotheses used, summary lines, CI rounds (0),
full-suite runs used, merge conflicts and how they were resolved.
