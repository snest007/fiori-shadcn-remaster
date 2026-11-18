# X0 implementation validation

Goal: define the library extension contract and prove Calendar composition in an isolated spike, without changing
registry source, then prepare the implementation/rollout drafts for owner approval.

Reviewed with the `impl-validator` skill protocol. This is a
self-review record, not an independent external approval. Checks use the X0 card, current owning source and executed
evidence; no historical memory validation is reused.

| Check | Result | Evidence |
|---|---|---|
| Contract decisions 1–7 and rejected alternatives | PASS | `docs/extension-contract.md` has seven numbered decisions with recommendations, alternatives and draft rule 11. |
| Tiers and backwards-compatible ownership | PASS | T1/T2/T3 plus deferred T4; protected hosts/getters, shorthands, explicit stability and no experimental rule-7 waiver. |
| Exact component inventory | PASS | Checked 81 unique rows against all 81 registry/ui entries; library items f6-navigation/variants are explained separately. |
| Existing default fixture coverage | PASS | Actual fixture renderer/manifest reused; nine cases × four themes × two densities; equal trees and identical PNG bytes, no tolerance or skip. |
| Fiscal period identity | PASS | Keyed P01–P16, including four special items sharing dates; pointer/keyboard selection, names, roving focus and fiscal-year paging. |
| Fiscal day features | PASS | Public API only; per-cell period text/names, fiscal week policy, activation detail, whole-period selection and fiscal-period paging. |
| Owned props and structural wrappers | PASS | Hostile role/ARIA/id/tabindex props rejected with warnings; merged class/style/handlers; public Row classes survive GridPicker replacement. |
| Public facade | PASS | Implementation factories removed; read-only selected/model collections, scoped models, grid/row/row-header/cell/header getters documented. |
| No consumer internal imports | PASS | Fiscal consumer imports only the Calendar entry plus its own existing fiscal adapter/data; rebuilt GridPicker uses public model/Row/Cell. |
| Localisation and default limits stated | PASS | Consumer-overridable domain texts and Intl formats, including ar-EG day/period/week names and custom-week numbers; the copy preserves baseline English label resolution and day/month RTL navigation; production provider/full parity awaits E5/P2. |
| Axe and keyboard proof | PASS | Both consumers tested without axe exclusions in four themes; item RTL, row/page edges, Enter/Space and selection announcements. |
| Same-item packaging | PASS | Fresh installed Calendar item, prototype entry substitution, public imports, strict consumer build and both fiscal modes rendered. |
| Existing registry installation | PASS | Unmodified smoke installer built and rendered all 81 components / seven blocks. |
| H6/H6b mapping and H1 alignment | PASS | H6 rewritten; all content shorthands kept; H6b stays two additive policies; H1 differences listed; H6c unchanged. |
| Rollout collision/size policy | PASS | 40 S/M proposals, each after its P owner; Calendar/H1 serialization stated; full rollout cards remain pending approval. |
| File scope and Git | PASS | Only X0-allowed docs/spike files changed; registry/tests/docs/src/AGENTS untouched; main checkout remains clean/on main; no push or merge. |
| Repository definition of done | PASS | Generation/typecheck/registry build pass; full runs 3 and 5 each passed all 1,418 tests with zero failed/flaky/skipped and no runner errors. |

Review corrections: public row helpers now retain classNames; public day helpers retain day info; month/year
render info now includes resolved locale, state and defaultContent; custom pointer
selection updates keyed focus; internal context factories are private; keyed collections are read-only; core key
handlers execute before hostile cell handlers; custom legend/header content keeps focus ownership; React 19 callback
ref cleanup is composed; new fiscal day/week numeric text uses Intl. None changes the no-override fixture pixels/tree.

The first full repository run had one unchanged SideNavigation test pass on retry. A second run under high machine
load had six failures and four tests that did not run. Neither satisfies the zero-flaky gate; no retries/sleeps were
added or tests weakened. The first clean run used five workers and retries=0 and passed all 1,418 tests in 7.3
minutes. The following full run had one unchanged ColorPalettePopover focus-return failure; its focused zero-retry
rerun passed. The second clean full run used three workers/retries=0 and passed all 1,418 tests in 15.7 minutes.
The final verdict and copied test summary lines are recorded in README.md.

**Overall: PASS for X0's design/prototype scope.** The seven decisions, 81-component inventory, exact default
parity, public-API fiscal consumers, installation proofs and two clean repository runs satisfy the card. Production
H6/H6b, full rollout cards and activation of rule 11 still require the later owner approval specified by X0.
