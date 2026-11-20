# A2 — Toolbar overflow

**Goal:** `Toolbar` items that don't fit move into an overflow button + popover, following `ui5-toolbar` 2.28,
including per-item overflow priority. Today `registry/ui/toolbar.tsx` has no overflow.

## Read first

- `node_modules/@ui5/webcomponents/dist/Toolbar.js` — `processOverflowLayout`, `distributeItems`, `itemsWidth`,
  `standardItems`, `itemsToOverflow`, `alwaysOverflowItems`, `toggleOverflow`, `isOverflowOpen`,
  `onOverflowPopoverClosed`, `closeOverflow`.
- `ToolbarItemBase.js` (`overflowPriority`, `preventOverflowClosing`, `stableDomRef`), `ToolbarItem.js`, `ToolbarButton.js`, `ToolbarSeparator.js`, `ToolbarSpacer.js`, `ToolbarSelect.js`,
  `types/ToolbarItemOverflowBehavior.js` (`Default` | `NeverOverflow` | `AlwaysOverflow`),
  `ToolbarTemplate.js` (the overflow popover is rendered there), `ToolbarItemTemplate.js`; CSS `generated/themes/Toolbar*.css.js`, params `grep -- '--fiori-toolbar\|--fiori-x-toolbar'`.

## Files

Own: `registry/ui/toolbar.tsx`, `registry/styles/components/toolbar.css`, toolbar fixtures/demo/spec.
Don't edit `button.tsx`; wrap it.

## Behaviour

- New item prop `overflowPriority?: "default" | "neverOverflow" | "alwaysOverflow"` on `ToolbarButton` and a generic
  `ToolbarItem` wrapper (for arbitrary children such as Select/Input), plus `preventOverflowClosing`.
- Overflow algorithm ported from `distributeItems` (measure item widths once, recompute on resize); separators adjacent to
  overflowed items behave as UI5 (hidden at edges, rendered as horizontal separators in the popover); spacers ignored.
- In the popover, buttons render full width with text (UI5's overflow styling), icon-only buttons show their text/tooltip.
  Clicking an item closes the popover unless `preventOverflowClosing`.
- Overflow button: transparent, `overflow` icon, accessible name "Additional Options" (overridable), `aria-haspopup`,
  `aria-expanded`.
- Existing roving arrow-key behaviour must include the overflow button as last item.

## Fixtures

- `toolbar-overflow` (narrow width, several buttons, separators), `toolbar-overflow-always` (alwaysOverflow items),
  `toolbar-overflow-never` (neverOverflow keeps a button), popover open in place if feasible.

## Tests

- Narrowing hides items into the popover in UI5's order; `neverOverflow` stays; `alwaysOverflow` is never in the bar.
- Clicking an overflow item fires its handler and closes the popover (unless prevented); focus returns to the button.
- Keyboard: arrows reach the overflow button; Enter/Space open; Escape closes.

## Acceptance

Pixel diff for new fixtures; AGENTS.md definition of done. Check `registry/blocks/list-report.tsx` still renders (it uses Toolbar).
