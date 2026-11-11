import * as React from "react"

import { ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"

import { defineFixtures } from "../fixture-types"
import { paletteColors } from "./color-palette"

function PalettePopoverFixture({ recent, defaultButton }: { recent?: boolean; defaultButton?: boolean }) {
  const opener = React.useRef<HTMLSpanElement | null>(null)
  const contentRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    // Match ui5-popup-in-place.ts: keep the native surface closed, overriding viewport geometry only in fixtures.
    for (const [property, value] of Object.entries({ display: "flex", position: "relative", inset: "auto", transform: "none", "max-height": "none", "max-width": "none" })) node.style.setProperty(property, value, "important")
  }, [])
  return <div style={{ fontSize: "1rem", overflow: "hidden", padding: ".75rem" }}>
    {/* In-place comparisons need a real intersecting opener without contributing pixels or layout. */}
    <span ref={opener} aria-hidden style={{ position: "fixed", top: 0, left: 0, width: "var(--sapContent_FocusWidth)", height: "var(--sapContent_FocusWidth)", opacity: 0, pointerEvents: "none" }} />
    <ColorPalettePopover opener={opener} portal={false} showRecentColors={recent} showDefaultColor={defaultButton} defaultColor="#003366"
      contentProps={{ forceMount: true, ref: contentRef, onOpenAutoFocus: (event) => event.preventDefault(), onCloseAutoFocus: (event) => event.preventDefault() }}>
      {paletteColors.map((value) => <ColorPaletteItem key={value} value={value} />)}
    </ColorPalettePopover>
  </div>
}

export default defineFixtures<{ recent?: boolean; defaultButton?: boolean }>({
  name: "color-palette-popover",
  cases: [
    { id: "color-palette-popover", props: {} },
    { id: "color-palette-popover-default-recent", props: { recent: true, defaultButton: true } },
  ],
  react: (props) => <PalettePopoverFixture {...props} />,
})
