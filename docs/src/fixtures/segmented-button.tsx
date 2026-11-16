import * as React from "react"
import { Icon } from "@/components/ui/icon"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { textAlignCenter, textAlignLeft, textAlignRight } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Item = { text?: string; icon?: "text-align-left" | "text-align-center" | "text-align-right"; selected?: boolean; disabled?: boolean; hidden?: boolean }
type Props = { items: Item[]; multiple?: boolean; custom?: boolean; composition?: "fragment" | "wrapper"; channel?: "name" | "name-ref" | "description" | "description-ref"; itemChannel?: boolean }
function ItemWrapper({ children }: { children: React.ReactNode }) { return <>{children}</> }
const icons = { "text-align-left": textAlignLeft, "text-align-center": textAlignCenter, "text-align-right": textAlignRight }

export default defineFixtures<Props>({
  name: "segmented-button",
  a11yDiff: {
    "segmented-button-a11y-item-description-ref": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-item-description": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-item-name-ref": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-item-name": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-root-description-ref": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-root-description": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-root-name-ref": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-a11y-root-name": {
      "ignore": [
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-custom": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-default": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-disabled-item": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ui5/ax/0/children/2/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid",
        "/ax/0/children/2/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-fragment": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-hidden": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-icon-text": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-icons": {
      "ignore": [
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid",
        "/ax/0/children/2/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-middle": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ui5/ax/0/children/2/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid",
        "/ax/0/children/2/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-multiple": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ui5/ax/0/children/2/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid",
        "/ax/0/children/2/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-two": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button-wrapper": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    },
    "segmented-button": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/0",
        "/ui5/ax/0/children/2/children/0",
        "/ax/0/children/0/properties/invalid",
        "/ax/0/children/1/properties/invalid",
        "/ax/0/children/2/properties/invalid"
      ],
      "reason": "React/DOM difference in segmented-button: these literal capture-proven paths unwrap only unnamed, description-free, value-free generic nodes with no properties, preserving every descendant role/name/state/order. SegmentedButtonItemTemplate.js:5 uses a li option; our native button option has Chromium implicit invalid=false. Only the exact false-versus-absence scalar paths are allowed; the runtime guard rejects every actual invalid state."
    }
  },
  cases: [
    { id: "segmented-button-fragment", props: { composition: "fragment", items: [{ text: "Map", selected: true }, { text: "Satellite" }] } },
    { id: "segmented-button-wrapper", props: { composition: "wrapper", items: [{ text: "Map", selected: true }, { text: "Satellite" }] } },
    { id: "segmented-button-hidden", props: { items: [{ text: "Map", selected: true }, { text: "Terrain", hidden: true }, { text: "Satellite" }] } },
    { id: "segmented-button-default", props: { items: [{ text: "Map" }, { text: "Satellite" }] } },
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
  react: ({ items, multiple, custom, channel, itemChannel, composition }) => {
    const targetId = `segmented-button-${itemChannel ? "item" : "root"}-${channel}`
    const attributes = {
      "aria-label": channel === "name" ? "Cartography" : undefined,
      "aria-labelledby": channel === "name-ref" ? targetId : undefined,
      "aria-description": channel === "description" ? "Choose a map layer" : undefined,
      "aria-describedby": channel === "description-ref" ? targetId : undefined,
    }
    const rootAttributes = itemChannel || !channel ? {} : { ...attributes, "aria-label": attributes["aria-label"] ?? (channel === "name-ref" ? undefined : "Segmented") }
    const sel = items.flatMap((it, i) => (it.selected ? [String(i)] : []))
    const renderedItems = items.map((it, i) => (
      <SegmentedButtonItem key={i} value={String(i)} hidden={it.hidden} disabled={it.disabled} icon={it.icon && <Icon icon={icons[it.icon]} />} {...{ "aria-label": it.text ? undefined : it.icon, ...(itemChannel && i === 0 ? attributes : {}) }} asChild={custom}>
        {custom ? <button role="menuitem" aria-selected={false} aria-posinset={99} aria-setsize={99} tabIndex={99}>{it.text}</button> : it.text}
      </SegmentedButtonItem>
    ))
    const children = composition === "fragment" ? <>{renderedItems}</> : composition === "wrapper" ? <ItemWrapper>{renderedItems}</ItemWrapper> : renderedItems
    const group = multiple ? (
      <SegmentedButton id={custom ? "segmented-button-custom-owner" : undefined} selectionMode="multiple" defaultValue={sel} {...{ "aria-label": "Segmented", ...rootAttributes }}>{children}</SegmentedButton>
    ) : (
      <SegmentedButton id={custom ? "segmented-button-custom-owner" : undefined} defaultValue={sel[0]} {...{ "aria-label": "Segmented", ...rootAttributes }}>{children}</SegmentedButton>
    )
    return <>{channel && <span hidden id={targetId}>{channel.startsWith("name") ? "Cartography" : "Choose a map layer"}</span>}{group}</>
  },
})
