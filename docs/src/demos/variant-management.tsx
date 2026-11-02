import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { VariantManagement, type VariantItem } from "@/components/ui/variant-management"

import { defineDemo } from "./types"

const initialItems: VariantItem[] = [
  { key: "standard", title: "Standard", rename: false, remove: false, author: "SAP" },
  { key: "sales", title: "Sales Orders", changeable: true, remove: true, author: "Alex" },
  { key: "operations", title: "Operations", changeable: true, remove: true, sharing: "Public", author: "Morgan" },
  { key: "restricted", title: "Restricted View", changeable: true, remove: true, sharing: "Public", author: "Taylor", contexts: { role: ["sales-role"] } },
  { key: "readonly", title: "Read-only View", rename: false, changeable: false, author: "SAP" },
  ...Array.from({ length: 7 }, (_, i) => ({ key: `view-${i + 6}`, title: `View ${i + 6}`, changeable: true, remove: true, author: "Alex" })),
  { key: "dormant", title: "Dormant View", favorite: false, changeable: true, remove: true, author: "Alex" },
  { key: "hidden", title: "Hidden View", visible: false, author: "Alex" },
]

function VariantManagementDemo() {
  const [items, setItems] = React.useState(initialItems)
  const [selectedKey, setSelectedKey] = React.useState("sales")
  const [defaultKey, setDefaultKey] = React.useState("standard")
  const [flags, setFlags] = React.useState({
    modified: true, supportDefault: true, supportFavorites: true, supportApplyAutomatically: true,
    supportPublic: true, supportContexts: false, showSaveAs: true, creationAllowed: true,
    showFooter: true, inErrorState: false, shortList: false, translated: false, nineList: false, emptyList: false, heading: false, limitWidth: false,
  })
  const [events, setEvents] = React.useState<{ type: string; payload?: unknown }[]>([])
  const record = (type: string, payload?: unknown) => setEvents((previous) => [...previous, { type, payload }])
  const { shortList, translated, nineList, emptyList, heading, limitWidth, ...componentFlags } = flags
  const displayedItems = emptyList ? [] : shortList ? items.slice(0, 3) : nineList ? items.slice(0, 9) : items
  return (
    <div id="variant-management-demo" className="flex flex-col gap-4">
      <VariantManagement
        id="variant-management-demo-control"
        items={displayedItems}
        selectedKey={selectedKey}
        defaultKey={defaultKey}
        {...componentFlags}
        portal={false}
        popoverTitle={translated ? "Meine Ansichten" : "My Views"}
        level={heading ? "H3" : "Auto"}
        titleStyle={heading ? "H1" : "Auto"}
        maxWidth={limitWidth ? "8rem" : undefined}
        roles={[{ key: "sales-role", title: "Sales Team" }, { key: "admin-role", title: "Administrators" }]}
        texts={translated ? { SAVE: "Speichern", SAVEAS: "Speichern als", MANAGE: "Verwalten", SAVEDIALOG: "Ansicht speichern", MANAGEDIALOG: "Ansichten verwalten", NAME: "Ansicht", CANCEL: "Abbrechen", VARIANTS: "Meine Ansichten", TRIGGER_TT: "Ansicht auswählen", ERROR_EMPTY: "Bitte Namen eingeben." } : undefined}
        onSelect={(event) => {
          setSelectedKey(event.key)
          setFlags((previous) => ({ ...previous, modified: false }))
          record("select", event)
        }}
        onSave={(event) => {
          record("save", event)
          setFlags((previous) => ({ ...previous, modified: false }))
          if (!event.overwrite) {
            const key = `saved-${events.filter((entry) => entry.type === "save").length + 1}`
            setItems((previous) => [...previous, { key, title: event.name, changeable: true, remove: true, author: "You", executeOnSelect: event.execute, sharing: event.public ? "Public" : "Private", contexts: event.contexts }])
            setSelectedKey(key)
            if (event.def) setDefaultKey(key)
          }
        }}
        onManage={(event) => {
          record("manage", event)
          setItems((previous) => previous.filter((item) => !event.deleted?.includes(item.key)).map((item) => ({
            ...item,
            title: event.renamed?.find((change) => change.key === item.key)?.name ?? item.title,
            favorite: event.fav?.find((change) => change.key === item.key)?.visible ?? item.favorite,
            executeOnSelect: event.exe?.find((change) => change.key === item.key)?.exe ?? item.executeOnSelect,
            contexts: event.contexts?.find((change) => change.key === item.key)?.contexts ?? item.contexts,
          })))
          if (event.def !== undefined) setDefaultKey(event.def)
          if (event.deleted?.includes(selectedKey)) setSelectedKey("standard")
        }}
        onManageCancel={() => record("manageCancel")}
        onCancel={() => record("cancel")}
      />
      <div className="flex flex-wrap gap-2" aria-label="Variant management options">
        {([
          ["modified", "Modified"], ["supportDefault", "Support default"], ["supportFavorites", "Support favorites"],
          ["supportApplyAutomatically", "Support apply automatically"], ["supportPublic", "Support public"],
          ["supportContexts", "Support contexts"], ["showSaveAs", "Show Save As"], ["creationAllowed", "Creation allowed"],
          ["showFooter", "Show footer"], ["inErrorState", "Error state"], ["shortList", "Use short list"], ["translated", "Translated texts"],
          ["nineList", "Use nine views"], ["emptyList", "No views"], ["heading", "Use H3 heading with H1 style"], ["limitWidth", "Limit title width"],
        ] as const).map(([key, text]) => <Checkbox key={key} text={text} checked={flags[key]} onCheckedChange={(checked) => setFlags((previous) => ({ ...previous, [key]: checked === true }))} />)}
      </div>
      <code id="variant-management-demo-events" className="text-(--sapContent_LabelColor)">{JSON.stringify(events)}</code>
      <code id="variant-management-demo-state" className="text-(--sapContent_LabelColor)">{JSON.stringify({ selectedKey, defaultKey, items })}</code>
    </div>
  )
}

export default defineDemo({ title: "VariantManagement", order: 66.5, Demo: VariantManagementDemo })
