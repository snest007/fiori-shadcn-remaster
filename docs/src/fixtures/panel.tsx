import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"

import { defineFixtures } from "../fixture-types"

type Props = { collapsed?: boolean; fixed?: boolean; custom?: boolean; long?: boolean }
export const PANEL_HEADER = "Panel header"
export const PANEL_LONG = "A long panel header text that does not fit and is truncated with an ellipsis"
export const PANEL_CONTENT = "Panel content goes here."
export const PANEL_WIDTH = "20rem"

export default defineFixtures<Props>({
  name: "panel",
  cases: [
    { id: "panel-expanded", props: {} },
    { id: "panel-collapsed", props: { collapsed: true } },
    { id: "panel-fixed", props: { fixed: true } },
    { id: "panel-long-header", props: { long: true, collapsed: true } },
    { id: "panel-custom-header", props: { custom: true } },
    { id: "panel-custom-header-collapsed", props: { custom: true, collapsed: true } },
  ],
  react: (props) => {
    const { collapsed, fixed, custom, long } = props
    return (
    <Panel
      style={{ width: PANEL_WIDTH }}
      // Unique names only to keep the fixture landmarks on the docs page distinct.
      accessibleName={`Panel fixture ${JSON.stringify(props)}`}
      headerText={custom ? undefined : long ? PANEL_LONG : PANEL_HEADER}
      header={
        custom ? (
          <div className="flex w-full items-center justify-between">
            <Title level="H3" size="H6">
              {PANEL_HEADER}
            </Title>
            <Button variant="transparent">Edit</Button>
          </div>
        ) : undefined
      }
      defaultCollapsed={collapsed}
      fixed={fixed}
    >
      {/* Panel content inherits the page font; use Text so both pages render it identically. */}
      <Text>{PANEL_CONTENT}</Text>
    </Panel>
    )
  },
})
