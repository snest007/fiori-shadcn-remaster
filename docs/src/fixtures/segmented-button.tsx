import { Icon } from "@/components/ui/icon"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { textAlignCenter, textAlignLeft, textAlignRight } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Item = { text?: string; icon?: "text-align-left" | "text-align-center" | "text-align-right"; selected?: boolean; disabled?: boolean }
type Props = { items: Item[]; multiple?: boolean }
const icons = { "text-align-left": textAlignLeft, "text-align-center": textAlignCenter, "text-align-right": textAlignRight }

export default defineFixtures<Props>({
  name: "segmented-button",
  cases: [
    { id: "segmented-button", props: { items: [{ text: "Map", selected: true }, { text: "Satellite" }, { text: "Terrain" }] } },
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
  react: ({ items, multiple }) => {
    const sel = items.flatMap((it, i) => (it.selected ? [String(i)] : []))
    const children = items.map((it, i) => (
      <SegmentedButtonItem key={i} value={String(i)} disabled={it.disabled} icon={it.icon && <Icon icon={icons[it.icon]} />} aria-label={it.text ? undefined : it.icon}>
        {it.text}
      </SegmentedButtonItem>
    ))
    return multiple ? (
      <SegmentedButton selectionMode="multiple" defaultValue={sel} aria-label="Segmented">{children}</SegmentedButton>
    ) : (
      <SegmentedButton defaultValue={sel[0]} aria-label="Segmented">{children}</SegmentedButton>
    )
  },
})
