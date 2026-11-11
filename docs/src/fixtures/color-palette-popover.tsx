import * as React from "react"

import { ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"

import { defineFixtures } from "../fixture-types"
import { paletteColors } from "./color-palette"
import { inPlace } from "./popover"

function PalettePopoverFixture({ recent, defaultButton }: { recent?: boolean; defaultButton?: boolean }) {
  const opener = React.useRef<HTMLSpanElement | null>(null)
  return <div className={inPlace} style={{ fontSize: "1rem" }}>
    {/* In-place comparisons need a real intersecting opener without contributing pixels or layout. */}
    <span ref={opener} aria-hidden style={{ position: "fixed", top: 0, left: 0, width: "var(--sapContent_FocusWidth)", height: "var(--sapContent_FocusWidth)", opacity: 0, pointerEvents: "none" }} />
    <ColorPalettePopover open opener={opener} portal={false} showRecentColors={recent} showDefaultColor={defaultButton} defaultColor="#003366"
      contentProps={{ onOpenAutoFocus: (event) => event.preventDefault(), onCloseAutoFocus: (event) => event.preventDefault() }}>
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
