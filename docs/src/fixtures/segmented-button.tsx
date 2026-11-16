import { Icon } from "@/components/ui/icon"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { textAlignCenter, textAlignLeft, textAlignRight } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Item = { text?: string; icon?: "text-align-left" | "text-align-center" | "text-align-right"; selected?: boolean; disabled?: boolean }
type Props = { items: Item[]; multiple?: boolean; custom?: boolean; channel?: "name" | "name-ref" | "description" | "description-ref"; itemChannel?: boolean }
const icons = { "text-align-left": textAlignLeft, "text-align-center": textAlignCenter, "text-align-right": textAlignRight }

export default defineFixtures<Props>({
  name: "segmented-button",
  cases: [
    ...([false, true] as const).flatMap((itemChannel) => (["name", "name-ref", "description", "description-ref"] as const).map((channel) => ({
      id: `segmented-button-a11y-${itemChannel ? "item" : "root"}-${channel}`,
      props: { items: [{ text: "Map", selected: true }, { text: "Satellite" }], channel, itemChannel },
    }))),
    { id: "segmented-button-custom", props: { items: [{ text: "Map", selected: true }, { text: "Satellite" }], custom: true } },
    { id: "segmented-button", props: { items: [{ text: "Map", selected: true }, { text: "Satellite" }, { text: "Terrain" }] }, interact: { selector: '[data-slot="segmented-button-item"][aria-selected="true"]', ui5Selector: "ui5-segmented-button-item[selected]" } },
    { id: "segmented-button-middle", props: { items: [{ text: "Day" }, { text: "Week", selected: true }, { text: "Month" }] } },
    { id: "segmented-button-disabled-item", props: { items: [{ text: "One", selected: true }, { text: "Two", disabled: true }, { text: "Three" }] } },
    {
      id: "segmented-button-icons",
      props: { items: [{ icon: "text-align-left", selected: true }, { icon: "text-align-center" }, { icon: "text-align-right" }] },
    },
    {
      id: "segmented-button-icon-text",
      props: { items: [{ icon: "text-align-left", text: "Left" }, { icon: "text-align-center", text: "Center", selected: true }] },
    },
    { id: "segmented-button-multiple", props: { multiple: true, items: [{ text: "Bold", selected: true }, { text: "Italic", selected: true }, { text: "Underline" }] } },
    { id: "segmented-button-two", props: { items: [{ text: "On", selected: true }, { text: "Off" }] } },
  ],
  react: ({ items, multiple, custom, channel, itemChannel }) => {
    const targetId = `segmented-button-${itemChannel ? "item" : "root"}-${channel}`
    const attributes = {
      "aria-label": channel === "name" ? "Cartography" : undefined,
      "aria-labelledby": channel === "name-ref" ? targetId : undefined,
      "aria-description": channel === "description" ? "Choose a map layer" : undefined,
      "aria-describedby": channel === "description-ref" ? targetId : undefined,
    }
    const rootAttributes = itemChannel || !channel ? {} : { ...attributes, "aria-label": attributes["aria-label"] ?? (channel === "name-ref" ? undefined : "Segmented") }
    const sel = items.flatMap((it, i) => (it.selected ? [String(i)] : []))
    const children = items.map((it, i) => (
      <SegmentedButtonItem key={i} value={String(i)} disabled={it.disabled} icon={it.icon && <Icon icon={icons[it.icon]} />} {...{ "aria-label": it.text ? undefined : it.icon, ...(itemChannel && i === 0 ? attributes : {}) }} asChild={custom}>
        {custom ? <button role="menuitem" aria-selected={false} aria-posinset={99} aria-setsize={99} tabIndex={99}>{it.text}</button> : it.text}
      </SegmentedButtonItem>
    ))
    const group = multiple ? (
      <SegmentedButton id={custom ? "segmented-button-custom-owner" : undefined} selectionMode="multiple" defaultValue={sel} {...{ "aria-label": "Segmented", ...rootAttributes }}>{children}</SegmentedButton>
    ) : (
      <SegmentedButton id={custom ? "segmented-button-custom-owner" : undefined} defaultValue={sel[0]} {...{ "aria-label": "Segmented", ...rootAttributes }}>{children}</SegmentedButton>
    )
    return <>{channel && <span hidden id={targetId}>{channel.startsWith("name") ? "Cartography" : "Choose a map layer"}</span>}{group}</>
  },
})
