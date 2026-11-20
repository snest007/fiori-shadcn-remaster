import { FlexibleColumnLayout, type FCLLayout } from "@/components/ui/flexible-column-layout"

import { defineFixtures } from "../fixture-types"

// Fixed container sizes: 1100px is a desktop width (> 1023px, 3 columns), 800px a tablet width (2 columns).
export const FCL_SIZES = { desktop: { width: 1100, height: 240 }, tablet: { width: 800, height: 240 } }

/** Plain column content, identical markup on both pages. */
export const FCL_CONTENT_STYLE =
  "box-sizing:border-box;height:100%;padding:1rem;font-family:var(--sapFontFamily);font-size:var(--sapFontSize);color:var(--sapTextColor);background:var(--sapGroup_ContentBackground)"
export const FCL_COLUMNS = ["Products", "Product detail", "Line item"] as const

type Props = { layout: FCLLayout; size: keyof typeof FCL_SIZES; disableResizing?: boolean }

const styleObject = (css: string) =>
  Object.fromEntries(css.split(";").map((d) => d.split(":")).map(([k, ...v]) => [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":")]))

const desktopLayouts: FCLLayout[] = [
  "OneColumn",
  "TwoColumnsStartExpanded",
  "TwoColumnsMidExpanded",
  "ThreeColumnsMidExpanded",
  "ThreeColumnsEndExpanded",
  "ThreeColumnsStartExpandedEndHidden",
  "ThreeColumnsMidExpandedEndHidden",
  "ThreeColumnsStartHiddenMidExpanded",
  "ThreeColumnsStartHiddenEndExpanded",
  "MidColumnFullScreen",
  "EndColumnFullScreen",
]
const tabletLayouts: FCLLayout[] = ["TwoColumnsMidExpanded", "ThreeColumnsMidExpanded", "ThreeColumnsEndExpanded", "ThreeColumnsMidExpandedEndHidden"]
const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

export default defineFixtures<Props>({
  name: "flexible-column-layout",
  cases: [
    ...desktopLayouts.map((layout) => ({ id: `flexible-column-layout-${kebab(layout)}`, props: { layout, size: "desktop" as const } })),
    ...tabletLayouts.map((layout) => ({ id: `flexible-column-layout-tablet-${kebab(layout)}`, props: { layout, size: "tablet" as const } })),
    { id: "flexible-column-layout-disable-resizing", props: { layout: "ThreeColumnsMidExpanded", size: "desktop", disableResizing: true } },
  ],
  react: ({ layout, size, disableResizing }) => {
    const col = (i: number) => <div style={styleObject(FCL_CONTENT_STYLE)}>{FCL_COLUMNS[i]}</div>
    return (
      <FlexibleColumnLayout
        layout={layout}
        disableResizing={disableResizing}
        disableAnimation
        style={{ width: FCL_SIZES[size].width, height: FCL_SIZES[size].height }}
        startColumn={col(0)}
        midColumn={col(1)}
        endColumn={col(2)}
      />
    )
  },
})
