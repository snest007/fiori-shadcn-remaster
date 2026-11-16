import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { SegmentedButton, SegmentedButtonItem, type SegmentedButtonProps } from "@/components/ui/segmented-button"
import { Icon } from "@/components/ui/icon"
import { textAlignLeft, textAlignCenter, textAlignRight } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

type Args = Omit<SegmentedButtonProps, "defaultValue" | "value" | "onValueChange"> & { value: string | string[]; onValueChange?: (value: string | string[]) => void; icons?: boolean; iconOnly?: boolean; disabledItem?: boolean; twoItems?: boolean }
const base = fioriMeta({ name: "segmented-button", component: SegmentedButton as React.ComponentType<Args> })
const items = [{ value: "left", text: "Left", icon: textAlignLeft }, { value: "center", text: "Center", icon: textAlignCenter }, { value: "right", text: "Right", icon: textAlignRight }]
const meta = {
  ...base,
  args: { value: "left", selectionMode: "single", itemsFitContent: false, disabled: false, icons: false, iconOnly: false, disabledItem: false, twoItems: false, "aria-label": "Text alignment", onValueChange: fn() },
  argTypes: { ...base.argTypes,
    selectionMode: { control: "select", options: ["single", "multiple"] }, value: { control: "object" }, itemsFitContent: { control: "boolean" }, disabled: { control: "boolean" },
    icons: { control: "boolean", description: "Show a leading icon in each example item." }, iconOnly: { control: "boolean", description: "Use accessible icon-only items." }, disabledItem: { control: "boolean", description: "Disable the center item." }, twoItems: { control: "boolean", description: "Show two alignment options." }, dir: { control: false }, onValueChange: { control: false },
  },
  render: function TextAlignment(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { value, onValueChange, icons, iconOnly, disabledItem, twoItems, selectionMode, ...props } = args
    const change = (next: string | string[]) => { onValueChange?.(next); updateArgs({ value: next }) }
    const children = (twoItems ? items.slice(0, 2) : items).map((item) => <SegmentedButtonItem key={item.value} value={item.value} disabled={disabledItem && item.value === "center"} icon={(icons || iconOnly) && <Icon icon={item.icon} />} aria-label={iconOnly ? `${item.text} alignment` : undefined}>{iconOnly ? undefined : item.text}</SegmentedButtonItem>)
    return selectionMode === "multiple"
      ? <SegmentedButton {...props} selectionMode="multiple" value={Array.isArray(value) ? value : value ? [value] : []} onValueChange={change}>{children}</SegmentedButton>
      : <SegmentedButton {...props} value={Array.isArray(value) ? value[0] ?? "" : value} onValueChange={change}>{children}</SegmentedButton>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Single: Story = {}
export const MiddleSelected: Story = { args: { value: "center" } }
export const Multiple: Story = { args: { selectionMode: "multiple", value: ["left", "center"] } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledItem: Story = { args: { disabledItem: true } }
export const Icons: Story = { args: { iconOnly: true } }
export const IconAndText: Story = { args: { icons: true, value: "center" } }
export const TwoItems: Story = { args: { twoItems: true } }
export const ItemsFitContent: Story = { args: { itemsFitContent: true } }
export const RTL: Story = { globals: { dir: "rtl" } }
