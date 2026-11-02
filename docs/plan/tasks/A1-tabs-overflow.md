# A1 — Tabs overflow ("More" button)

**Goal:** when tabs don't fit their container, they collapse into an overflow button with a popover list, exactly as
`ui5-tabcontainer` does in 2.28. Today `registry/ui/tabs.tsx` lets the strip scroll/clip.

## Read first (UI5 2.28)

- `node_modules/@ui5/webcomponents/dist/TabContainer.js` — `overflowMode` (`End` | `StartAndEnd`), `_updateEndOverflow`,
  `_updateStartAndEndOverflow`, `_onOverflowClick`, `_showPopoverAt`, `_getRootTab`, `_onOverflowKeyDown`,
  how the selected tab is kept visible, and the overflow button text (`+N` vs "More") and its aria.
- `TabContainerTemplate.js`, `TabInOverflowTemplate.js`, `TabSeparatorInOverflowTemplate.js`, `types/OverflowMode.js`.
- CSS: `dist/generated/themes/TabContainer.css.js`, `TabInOverflow.css.js`, `TabSeparatorInOverflow.css.js`;
  parameters `grep -- '--fiori-tc-' registry/styles/fiori.css | sort -u`.

## Files

Own: `registry/ui/tabs.tsx`, `registry/styles/components/tabs.css`, `docs/src/fixtures/tabs.tsx` + `tabs.ui5.ts`,
`docs/src/demos/tabs.tsx`, `tests/tabs.spec.ts`. Reuse `@/components/ui/popover` and `@/components/ui/list` styles
(don't edit them).

## Behaviour

- New props on `Tabs`: `overflowMode?: "end" | "startAndEnd"` (default `"end"`), `overflowButton?: ReactNode`
  (custom end button), `startOverflowButton?: ReactNode`, texts overridable (`moreText`, overflow list aria label).
- Measure with ResizeObserver; tabs that don't fit go to the overflow in DOM order; the selected tab must stay visible
  (UI5 moves it into the strip and pushes others out). Separators follow UI5's rules in the overflow list.
- Overflow button shows `+N` (StartAndEnd) or "More" (End) as UI5 does; opens a popover list of hidden tabs (icons,
  counts, designs, disabled state as in the strip). Selecting one selects the tab and closes the popover; focus returns.
- Keyboard: overflow button is part of the tablist arrow navigation as in UI5; in the popover ↑/↓/Enter/Space/Escape.
- No overflow at all when everything fits (no button rendered).

## Fixtures (add to tabs fixtures; fixed widths)

- `tabs-overflow-end` (e.g. 10 text tabs in 30rem, 3rd selected), `tabs-overflow-end-selected-last`
  (selected tab beyond the fold), `tabs-overflow-start-end`, `tabs-overflow-icons` (icon tabs with counts).
- Open overflow popover in place for one case (use `ui5-popup-in-place.ts` on the UI5 side) if feasible; otherwise
  skipCompare that one case with a comment and cover it in tests.

## Tests (`tests/tabs.spec.ts`)

- Resizing the demo container from wide to narrow adds the overflow button; widening removes it.
- Selected tab stays visible when it would overflow.
- Choosing a tab from the popover selects it, closes the popover, restores focus to the button/tab per UI5.
- Keyboard: → from the last visible tab reaches the overflow button; Enter opens; ↓/Enter selects; Escape closes.

## Acceptance

- All new fixtures pass the pixel diff in 4 themes × 2 densities.
- Existing tabs fixtures/tests unchanged and green.
- AGENTS.md definition of done.
