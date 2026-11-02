import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { List, ListItemCustom, ListItemGroup, ListItemStandard, type ListSelectionMode } from "@/components/ui/list"
import { calendar, email, settings } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const fruits = ["Apples", "Bananas", "Cherries", "Dates", "Elderberries", "Figs", "Grapes", "Honeydew", "Kiwis", "Lemons", "Mangoes", "Nectarines", "Oranges"]

function ListDemo() {
  const [mode, setMode] = React.useState<ListSelectionMode>("multiple")
  const [selected, setSelected] = React.useState<string[]>(["Bananas"])
  const [items, setItems] = React.useState(["Inbox", "Drafts", "Sent", "Spam"])
  const [shown, setShown] = React.useState(5)
  const [clicked, setClicked] = React.useState("")
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {(["none", "single", "singleStart", "singleEnd", "singleAuto", "multiple"] as const).map((m) => (
            <Button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m}
            </Button>
          ))}
        </div>
        <List
          id="list-demo-selection"
          headerText="Fruits"
          selectionMode={mode}
          value={selected}
          onValueChange={setSelected}
          onItemClick={setClicked}
          growing="button"
          onLoadMore={() => setShown((n) => Math.min(n + 4, fruits.length))}
          footerText={`Selected: ${selected.join(", ") || "none"}`}
        >
          {fruits.slice(0, shown).map((f) => (
            <ListItemStandard key={f} value={f} text={f} additionalText={f.length > 6 ? "Seasonal" : undefined} />
          ))}
        </List>
        <span id="list-demo-clicked" className="text-(--sapContent_LabelColor)">
          Last clicked: {clicked || "none"}
        </span>
      </div>
      <List id="list-demo-delete" headerText="Folders (delete mode)" selectionMode="delete" onItemDelete={(v) => setItems((xs) => xs.filter((x) => x !== v))} noDataText="No folders">
        {items.map((x) => (
          <ListItemStandard key={x} value={x} text={x} />
        ))}
      </List>
      <List id="list-demo-rich" aria-label="People and settings">
        <ListItemGroup headerText="People">
          <ListItemStandard value="jd" text="John Doe" description="Engineering" image={<Avatar initials="JD" />} type="navigation" />
          <ListItemStandard value="ab" text="Anna Brown" description="Sales" image={<Avatar initials="AB" colorScheme="accent2" />} additionalText="Away" additionalTextState="critical" highlight="critical" />
        </ListItemGroup>
        <ListItemGroup headerText="Settings">
          <ListItemStandard value="cal" text="Calendar" icon={calendar} type="detail" />
          <ListItemStandard value="mail" text="Mail" icon={email} />
          <ListItemStandard value="settings" text="Settings" icon={settings} disabled />
        </ListItemGroup>
      </List>
      <List id="list-demo-custom" aria-label="Custom items">
        <ListItemCustom value="a">
          <div className="flex w-full items-center justify-between">
            <span>Item with a button</span>
            <Button id="list-demo-custom-btn-a">Edit</Button>
          </div>
        </ListItemCustom>
        <ListItemCustom value="b">
          <div className="flex w-full items-center justify-between">
            <span>Another item</span>
            <Button id="list-demo-custom-btn-b">Edit</Button>
          </div>
        </ListItemCustom>
      </List>
    </div>
  )
}

export default defineDemo({ title: "List", order: 36, Demo: ListDemo })
