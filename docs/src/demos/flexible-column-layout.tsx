import * as React from "react"

import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { FlexibleColumnLayout, useFlexibleColumnLayout, type FCLLayout } from "@/components/ui/flexible-column-layout"
import { Icon } from "@/components/ui/icon"
import { List, ListItemStandard } from "@/components/ui/list"
import { decline, exitFullScreen, fullScreen } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const LAYOUTS: FCLLayout[] = [
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

const orders = ["Order 1001", "Order 1002", "Order 1003", "Order 1004"]
const items = ["Notebook Basic 15", "Wireless Mouse", "USB-C Dock"]

function Column({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <Bar endContent={actions}>
        <span className="font-(family-name:--sapFontBoldFamily)">{title}</span>
      </Bar>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}

function FclDemo() {
  const fcl = useFlexibleColumnLayout()
  const [order, setOrder] = React.useState<string>()
  const [item, setItem] = React.useState<string>()
  const [width, setWidth] = React.useState(1100)
  const { midColumn, endColumn } = fcl.actions
  const tool = (label: string, icon: typeof decline, onClick?: () => void) =>
    onClick && (
      <Button variant="transparent" size="icon" aria-label={label} title={label} onClick={onClick}>
        <Icon icon={icon} />
      </Button>
    )
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-(--sapContent_LabelColor)">
          Layout
          <select
            id="flexible-column-layout-demo-select"
            className="rounded border border-(--sapField_BorderColor) bg-(--sapField_Background) px-2 py-1 text-(--sapField_TextColor)"
            value={fcl.layout}
            onChange={(e) => fcl.setLayout(e.target.value as FCLLayout)}
          >
            {LAYOUTS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        {[1100, 800, 500].map((w) => (
          <Button key={w} aria-pressed={width === w} onClick={() => setWidth(w)}>{w}px</Button>
        ))}
        <span id="flexible-column-layout-demo-status" className="text-(--sapContent_LabelColor)">
          {fcl.layout} · max {fcl.maxColumnsCount} columns
        </span>
      </div>
      <div className="max-w-full overflow-x-auto">
        <FlexibleColumnLayout
          id="flexible-column-layout-demo"
          {...fcl.layoutProps}
          style={{ width, height: 360 }}
          startColumn={
            <Column title="Orders">
              <List aria-label="Orders" selectionMode="single" value={order ? [order] : []} onItemClick={(v) => { setOrder(v); setItem(undefined); fcl.navigate(1) }}>
                {orders.map((o) => <ListItemStandard key={o} value={o} text={o} type="navigation" />)}
              </List>
            </Column>
          }
          midColumn={
            <Column
              title={order ?? "Order"}
              actions={<>
                {tool("Enter Full Screen Mode", fullScreen, midColumn.fullScreen)}
                {tool("Exit Full Screen Mode", exitFullScreen, midColumn.exitFullScreen)}
                {tool("Close", decline, midColumn.closeColumn)}
              </>}
            >
              <List aria-label="Items" onItemClick={(v) => { setItem(v); fcl.navigate(2) }}>
                {items.map((i) => <ListItemStandard key={i} value={i} text={i} type="navigation" />)}
              </List>
            </Column>
          }
          endColumn={
            <Column
              title={item ?? "Item"}
              actions={<>
                {tool("Enter Full Screen Mode", fullScreen, endColumn.fullScreen)}
                {tool("Exit Full Screen Mode", exitFullScreen, endColumn.exitFullScreen)}
                {tool("Close", decline, endColumn.closeColumn)}
              </>}
            >
              <p className="p-4 text-(--sapTextColor)">Details of {item ?? "the item"}.</p>
            </Column>
          }
        />
      </div>
    </div>
  )
}

export default defineDemo({ title: "Flexible Column Layout", order: 900, Demo: FclDemo })
