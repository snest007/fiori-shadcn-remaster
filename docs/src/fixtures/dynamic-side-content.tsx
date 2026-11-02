import { DynamicSideContent, type SideContentPosition } from "@/components/ui/dynamic-side-content"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"

import { defineFixtures } from "../fixture-types"

type Props = { width: string; position?: SideContentPosition; equalSplit?: boolean }
export const DSC_HEIGHT = "8rem"
export const DSC_MAIN = "Main content"
export const DSC_SIDE = "Side content"

// Coloured areas so the split is visible; same inline styles on both pages.
export const MAIN_STYLE = "height:100%;box-sizing:border-box;padding:1rem;background:var(--sapGroup_ContentBackground)"
export const SIDE_STYLE = "height:100%;box-sizing:border-box;padding:1rem;background:var(--sapList_SelectionBackgroundColor)"
const css = (s: string) => Object.fromEntries(s.split(";").map((d) => d.split(":")).map(([k, v]) => [k.replace(/-(\w)/g, (_, c) => c.toUpperCase()), v]))

export default defineFixtures<Props>({
  name: "dynamic-side-content",
  cases: [
    // 1100px container → L: 2/3 + 1/3.
    { id: "dynamic-side-content-l", props: { width: "1100px" } },
    { id: "dynamic-side-content-l-start", props: { width: "1100px", position: "start" } },
    { id: "dynamic-side-content-equal-split", props: { width: "1100px", equalSplit: true } },
    // 1000px → M: side content 340px.
    { id: "dynamic-side-content-m", props: { width: "1000px" } },
    // 600px → S: side content hidden.
    { id: "dynamic-side-content-s", props: { width: "600px" } },
  ],
  react: ({ width, position, equalSplit }) => (
    <div style={{ width, height: DSC_HEIGHT }}>
      <DynamicSideContent
        sideContentPosition={position}
        equalSplit={equalSplit}
        accessibilityAttributes={{ mainContent: { role: "region" }, sideContent: { role: "region" } }}
        sideContent={
          <div style={css(SIDE_STYLE)}>
            <Text>{DSC_SIDE}</Text>
          </div>
        }
      >
        <div style={css(MAIN_STYLE)}>
          <Title level="H3" size="H5">{DSC_MAIN}</Title>
        </div>
      </DynamicSideContent>
    </div>
  ),
})
