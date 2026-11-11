import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { List, ListItemCustom, ListItemGroup, ListItemStandard, type ListSelectionMode } from "@/components/ui/list"
import { calendar, email, settings } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const fruits = ["Apples", "Bananas", "Cherries", "Dates", "Elderberries", "Figs", "Grapes", "Honeydew", "Kiwis", "Lemons", "Mangoes", "Nectarines", "Oranges"]

function MovableList() {
  const [items, setItems] = React.useState(["Apples", "Bananas", "Cherries", "Dates"])
  const [allow, setAllow] = React.useState(true)
  const [reorder, setReorder] = React.useState(true)
  const [on, setOn] = React.useState(false)
  const [rejectApples, setRejectApples] = React.useState(false)
  const [disableBananas, setDisableBananas] = React.useState(false)
  const [clicked, setClicked] = React.useState("")
  const [log, setLog] = React.useState("")
  const nativeEvent = React.useRef<Event | null>(null)
  const [nativeOver, setNativeOver] = React.useState(false)
  const [nativeMove, setNativeMove] = React.useState(false)
  return <div className="grid gap-2">
    <p>Drag items or use Ctrl/Cmd with arrows, Home or End. The application accepts placements and reorders its data.</p>
    <div className="flex flex-wrap gap-1">
      <Button id="list-move-allow" aria-pressed={allow} onClick={() => setAllow(!allow)}>Accept drops</Button>
      <Button id="list-move-reorder" aria-pressed={reorder} onClick={() => setReorder(!reorder)}>Reorder data</Button>
      <Button id="list-move-on" aria-pressed={on} onClick={() => setOn(!on)}>Accept On</Button>
      <Button id="list-move-reject-apples" aria-pressed={rejectApples} onClick={() => setRejectApples(!rejectApples)}>Reject Apples</Button>
      <Button id="list-move-disable-bananas" aria-pressed={disableBananas} onClick={() => setDisableBananas(!disableBananas)}>Disable Bananas</Button>
    </div>
    <List id="list-movable" aria-label="Movable fruits"
      onItemClick={setClicked}
      onKeyDownCapture={(event) => { nativeEvent.current = event.nativeEvent }}
      onDragOver={(event) => { nativeEvent.current = event.nativeEvent }}
      onDrop={(event) => { nativeEvent.current = event.nativeEvent }}
      onMoveOver={(event) => {
      setNativeOver(event.originalEvent === nativeEvent.current)
      if (allow && !(rejectApples && event.destination.element.dataset.navKey === "Apples") && (on || event.destination.placement !== "On")) event.preventDefault()
    }} onMove={(event) => {
      setNativeMove(event.originalEvent === nativeEvent.current)
      const source = event.source.element?.dataset.navKey ?? event.source.element?.dataset.rowKey ?? event.source.element?.id
      const target = event.destination.element.dataset.navKey
      const placement = event.destination.placement
      setLog(`${source} ${placement} ${target}`)
      if (!reorder || !source || !target || source === target || placement === "On") return
      setItems((current) => {
        if (!current.includes(source)) return current
        const next = current.filter((item) => item !== source)
        next.splice(next.indexOf(target) + (placement === "After" ? 1 : 0), 0, source)
        return next
      })
    }}>
      {items.map((item) => <ListItemStandard key={item} id={`list-movable-${item}`} value={item} text={item === "Dates" ? <span id="list-movable-nested-source" draggable>{item}</span> : item} movable={item !== "Dates"} disabled={disableBananas && item === "Bananas"} />)}
    </List>
    <span id="list-move-log" data-native-over={nativeOver} data-native-move={nativeMove} data-clicked={clicked}>{log}</span>
  </div>
}

function ListDemo() {
  const [mode, setMode] = React.useState<ListSelectionMode>("multiple")
  const [selected, setSelected] = React.useState<string[]>(["Bananas"])
  const [items, setItems] = React.useState(["Inbox", "Drafts", "Sent", "Spam"])
  const [shown, setShown] = React.useState(5)
  const [clicked, setClicked] = React.useState("")
  return (
    <div id="list-demo" className="grid gap-6 md:grid-cols-2">
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
      <MovableList />
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
