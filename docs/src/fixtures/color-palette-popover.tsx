import * as React from "react"

import { ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"

import { defineFixtures } from "../fixture-types"
import { paletteColors } from "./color-palette"

export type PalettePopoverFixtureProps = { recent?: boolean; defaultButton?: boolean; empty?: "empty" | "empty-value" | "hidden" | "hidden-before-visible" }

function PalettePopoverFixture({ recent, defaultButton, empty }: PalettePopoverFixtureProps) {
  const opener = React.useRef<HTMLSpanElement | null>(null)
  const contentRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    // Match ui5-popup-in-place.ts: pin the shared Popover surface in its cell, overriding viewport geometry only in fixtures.
    for (const [property, value] of Object.entries({ display: "flex", position: "relative", inset: "auto", transform: "none", "max-height": "none", "max-width": "none" })) node.style.setProperty(property, value, "important")
  }, [])
  return <div className="[&_[data-radix-popper-content-wrapper]]:static! [&_[data-radix-popper-content-wrapper]]:transform-none!" style={{ fontSize: "1rem", overflow: "hidden", padding: ".75rem" }}>
    {/* In-place comparisons need a real intersecting opener without contributing pixels or layout. */}
    <span ref={opener} aria-hidden style={{ position: "fixed", top: 0, left: 0, width: "var(--sapContent_FocusWidth)", height: "var(--sapContent_FocusWidth)", opacity: 0, pointerEvents: "none" }} />
    <ColorPalettePopover opener={opener} portal={false} open showRecentColors={recent} showDefaultColor={defaultButton} defaultColor="#003366"
      contentProps={{ ref: contentRef, onOpenAutoFocus: (event) => event.preventDefault(), onCloseAutoFocus: (event) => event.preventDefault() }}>
      {!empty && paletteColors.map((value) => <ColorPaletteItem key={value} value={value} />)}
      {empty === "empty-value" && <ColorPaletteItem value="" />}
      {(empty === "hidden" || empty === "hidden-before-visible") && <ColorPaletteItem value="red" hidden />}
      {empty === "hidden-before-visible" && <ColorPaletteItem value="blue" />}
    </ColorPalettePopover>
  </div>
}

export default defineFixtures<PalettePopoverFixtureProps>({
  name: "color-palette-popover",
  cases: ([
    { id: "color-palette-popover", props: {} },
    { id: "color-palette-popover-default-recent", props: { recent: true, defaultButton: true } },
    { id: "color-palette-popover-empty", props: { empty: "empty" } },
    { id: "color-palette-popover-empty-value", props: { empty: "empty-value" } },
    { id: "color-palette-popover-hidden-only", props: { empty: "hidden" } },
    { id: "color-palette-popover-hidden-before-visible", props: { empty: "hidden-before-visible" } },
  ] satisfies import("../fixture-types").FixtureCase<PalettePopoverFixtureProps>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "color-palette-popover-rtl" }] : [fixture]),
  react: (props) => <PalettePopoverFixture {...props} />,
})
