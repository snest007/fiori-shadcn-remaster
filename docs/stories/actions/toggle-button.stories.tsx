import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ToggleButton, type ToggleButtonProps } from "@/components/ui/toggle-button"
import { Icon } from "@/components/ui/icon"
import { edit } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "toggle-button", component: ToggleButton })
const meta = {
  ...base,
  args: { children: "Edit mode", variant: "default", pressed: false, disabled: false, size: "default", onPressedChange: fn(), onClick: fn() },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, variant: { control: "select", options: ["default", "emphasized", "transparent", "positive", "negative", "attention"] }, pressed: { control: "boolean" }, disabled: { control: "boolean" }, size: { control: "select", options: ["default", "icon"] }, onPressedChange: { control: false }, onClick: { control: false } },
  render: function EditMode(args: ToggleButtonProps) {
    const [, updateArgs] = useArgs<ToggleButtonProps>()
    return <ToggleButton {...args} onPressedChange={(pressed) => { args.onPressedChange?.(pressed); updateArgs({ pressed }) }} />
  },
} satisfies Meta<typeof ToggleButton>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Default: Story = { args: { variant: "default" } }
export const DefaultPressed: Story = { args: { variant: "default", pressed: true } }
export const Emphasized: Story = { args: { variant: "emphasized" } }
export const EmphasizedPressed: Story = { args: { variant: "emphasized", pressed: true } }
export const Transparent: Story = { args: { variant: "transparent" } }
export const TransparentPressed: Story = { args: { variant: "transparent", pressed: true } }
export const Positive: Story = { args: { variant: "positive" } }
export const PositivePressed: Story = { args: { variant: "positive", pressed: true } }
export const Negative: Story = { args: { variant: "negative" } }
export const NegativePressed: Story = { args: { variant: "negative", pressed: true } }
export const Attention: Story = { args: { variant: "attention" } }
export const AttentionPressed: Story = { args: { variant: "attention", pressed: true } }
export const Disabled: Story = { args: { disabled: true } }
export const PressedDisabled: Story = { args: { pressed: true, disabled: true } }
export const WithIcon: Story = { args: { pressed: true, children: <><Icon icon={edit} />Edit mode</> } }
export const IconOnly: Story = { args: { variant: "transparent", size: "icon", pressed: true, children: <Icon icon={edit} />, "aria-label": "Edit mode" } }
export const LongText: Story = { args: { children: "Show purchase orders awaiting approval" } }
export const RTL: Story = { globals: { dir: "rtl" } }
