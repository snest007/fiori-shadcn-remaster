# S2 component accessibility candidates

These patches are deliberately **unapplied**. S2 changes stories and prop JSDoc only; E4 owns runtime fixes.
The owning-fixture browser reproduction is preserved in `.integration/S2-evidence/component-defect-reproduction.json`.

| Defect | Unmodified component / installed UI5 2.28 | Narrow S2 marker |
|---|---|---|
| Clock spin button host | React `TimeSelectionClocks` and UI5 `ToggleSpinButton` both put `role=spinbutton` on a native `button`, rejected by axe `aria-allowed-role`. UI5 has additional unnamed-clock/fixture-footer findings; these are reference findings only and are not suppressed for React. | Exact TimePicker/DateTimePicker Open, OpenNegative, TimePicker OpenCritical and standalone TwentyFourHourClocks stories; or their explicitly open Playground primary. Only the unique owned hours/minutes/seconds button with valid name/range/value attributes. |
| Table loading overlay | React and UI5 expose the busy progressbar as an invalid grid child (`aria-required-children`). This is the same source defect already handed to E4 by S0. | Only `data-table--loading`: the Products grid, four expected child subtrees and its unique existing loading progressbar. Any other invalid role remains unexpected. |
| Timeline tooltip icon | React passes `iconTooltip` as `Icon.label`, creating `role=img` beside its owned listitem/treeitem bubble. That makes the list/tree fail `aria-required-children`. UI5's `TimelineItemTemplate.js` renders that icon in `Decorative` mode, while `_getAccessibleLabel` includes the tooltip in the item's own name. UI5 passes the same fixture check. | Explicit Timeline story IDs, and its Playground primary, only the unique owned list/tree whose existing tooltip images are outside valid item subtrees. Bubble names/descriptions must retain every tooltip; extra invalid roles remain unexpected. |
| ObjectStatus indication5 contrast | Unchanged React `object-status-states` fixture and native OpenUI5 1.154 `sap.m.ObjectStatus` both report 4.33:1 for ordinary 14px `Indication05` text on the required Morning SAP background. `ObjectStatusRenderer.render` and `themes/base/ObjectStatus.less` use the same `--sapIndicationColor_5` (#0070f2) and `--sapContent_TextShadow`; the composed shadow color is #f8f9fa. No UI5 Web Component exists for ObjectStatus. A sweep of all 15 semantic/indication states finds only indication5 failing. | Morning only, exact `data-object-status--indication5` story or Playground `state=indication5` Control choice. Only its unique direct ordinary text, expected content, unchanged 14px/color/shadow and SAP canvas background; inverted, large, active and other nodes stay strict. |

## Reproduction

The React checks ran on the owning `timeline-vertical`, `table`, and `time-picker-popover` fixture cells.
For the first two states, a temporary browser-only mount reused the real registry components inside their existing
fixture cells to set `iconTooltip="Meeting"` and `loading=true, loadingDelay=0`; no fixture or component files changed.
The UI5 checks used the same installed fixture page, setting the corresponding public UI5 properties. The clocks
were the existing unmodified open-clock fixture on both sides. The report contains the complete settled DOM and raw axe nodes.

The fourth reproduction is in `.integration/S2-evidence/object-status-contrast.json` and its script/log beside it.
It uses the unchanged existing React indication5 fixture, and a browser-only native `sap.m.ObjectStatus` mount using
installed OpenUI5 1.154 (the repository's reference harness version). Both use `--sapBackgroundColor` (#f5f6f7).
This is a component/theme defect on the mandated S0 canvas, not a substituted story background. The same report
records all 15 Playground state checks and a browser-only candidate stylesheet check with no contrast violation.

## Proposed fixes and required E4 validation

- `clock-spinbutton-host.patch`: use Button's existing `asChild` styling on a focusable generic div with the current spinbutton role/ranges. Preserve the clock container's keyboard model, labels, selected appearance, click/focus handling and Tab order. UI5's `ToggleSpinButton.effectiveAccRole` + `ButtonTemplate.js` share the invalid host combination; this is an explicit upstream ARIA-in-HTML deviation. E4 must run 12/24-hour keyboard, submit/cancel, and visual/a11y-tree parity checks before accepting this candidate.
- `table-loading-grid-child.patch`: the previously reviewed S0 candidate moves the existing overlay immediately after the grid while retaining busy state and progressbar semantics. E4 must verify geometry, loading focus, loading-delay behavior and axe for both Table and DataTable.
- `timeline-decorative-tooltip-icon.patch`: retain a visual tooltip on the icon container and keep the existing bubble name/description. Render the icon decoratively as UI5 does. E4 must verify iconTooltip in both layouts, grouped/ungrouped keyboard paths and the accessibility tree.
- `object-status-indication5-contrast.patch`: for Morning ordinary indication5 text, use SAP's darker blue `--sapInformativeTextColor` (#0064d9), retaining the indication icon color, inverted palette and all other themes. This is an explicit accessibility deviation from native OpenUI5's failing token, not a new hard-coded color. The browser-only candidate passed the unchanged owning fixture's axe contrast check; E4 must decide/record the reference deviation and verify all states, themes, inverted/active/large variants and visual parity before applying it.

All four patches pass `git apply --check` against this S2 branch. None have been applied. The contrast candidate
has only a browser-only stylesheet proof; the three structural candidates have not been runtime-tested.
