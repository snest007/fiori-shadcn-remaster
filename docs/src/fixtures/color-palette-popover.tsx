import { ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"

import { defineFixtures } from "../fixture-types"
import { paletteColors } from "./color-palette"
import { inPlace } from "./popover"

export default defineFixtures<{ recent?: boolean; defaultButton?: boolean }>({
  name: "color-palette-popover",
  cases: [
    { id: "color-palette-popover", props: {} },
    { id: "color-palette-popover-default-recent", props: { recent: true, defaultButton: true } },
  ],
  react: ({ recent, defaultButton }) => <div className={inPlace}>
    <ColorPalettePopover open portal={false} showRecentColors={recent} showDefaultColor={defaultButton} defaultColor="#003366"
      contentProps={{ onOpenAutoFocus: (event) => event.preventDefault(), onCloseAutoFocus: (event) => event.preventDefault() }}>
      {paletteColors.map((value) => <ColorPaletteItem key={value} value={value} />)}
    </ColorPalettePopover>
  </div>,
})
