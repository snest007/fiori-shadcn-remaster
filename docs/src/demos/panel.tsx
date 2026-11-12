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

export default defineDemo({
  category: "Display",
  docs: [
    {
      name: "panel",
      description: "Expandable or fixed content sections with text or custom headers.",
      props: [
        { name: "Panel.headerText", type: "ReactNode", description: "Header text; the whole text header toggles the panel." },
        { name: "Panel.header", type: "ReactNode", description: "Custom header content; only its arrow toggles the panel." },
        { name: "Panel.collapsed", type: "boolean", description: "Controlled collapsed state." },
        { name: "Panel.onToggle", type: "(collapsed: boolean) => void", description: "Receive collapse and expansion changes." },
        { name: "Panel.defaultCollapsed", type: "boolean", description: "Initial collapsed state.", defaultValue: "false" },
        { name: "Panel.fixed", type: "boolean", description: "Always show content and remove the toggle." },
        { name: "Panel.accessibleRole", type: "form | region | complementary", description: "Root landmark role.", defaultValue: "form" },
      ],
    },
  ], title: "Panel", order: 34, Demo: PanelDemo })
