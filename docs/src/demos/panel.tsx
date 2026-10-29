import * as React from "react"

import { Panel } from "@/components/ui/panel"
import { Text } from "@/components/ui/text"

import { defineDemo } from "./types"

function PanelDemo() {
  const [collapsed, setCollapsed] = React.useState(false)
  return (
    <div className="grid max-w-xl gap-4">
      <Panel id="panel-demo" headerText="Expandable panel" collapsed={collapsed} onToggle={setCollapsed} accessibleRole="region">
        <Text>Click the header, or focus it and press Enter or Space, to collapse this panel.</Text>
      </Panel>
      <Panel headerText="Collapsed by default" defaultCollapsed accessibleRole="region">
        <Text>Hidden at first.</Text>
      </Panel>
      <Panel headerText="Fixed panel" fixed accessibleRole="region">
        <Text>A fixed panel has no toggle.</Text>
      </Panel>
    </div>
  )
}

export default defineDemo({ title: "Panel", order: 34, Demo: PanelDemo })
