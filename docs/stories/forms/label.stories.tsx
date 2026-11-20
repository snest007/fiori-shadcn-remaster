import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Label, type LabelProps } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "label", component: Label })
const meta = {
  ...base,
  args: { children: "Company name", required: false, showColon: false, truncate: false },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, required: { control: "boolean" }, showColon: { control: "boolean" }, truncate: { control: "boolean" }, htmlFor: { control: false } },
  render: function CompanyLabel(args: LabelProps) {
    const id = React.useId()
    return <div className="grid max-w-md gap-2"><Label {...args} htmlFor={id} /><Input id={id} required={args.required} placeholder="Enter the company name" /></div>
  },
} satisfies Meta<typeof Label>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Required: Story = { args: { required: true } }
export const Colon: Story = { args: { showColon: true } }
export const ColonRequired: Story = { args: { showColon: true, required: true } }
export const LongText: Story = { args: { children: "Registered company name for the international procurement division" }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const Truncated: Story = { args: { children: "Registered company name for the international procurement division", truncate: true }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const RTL: Story = { globals: { dir: "rtl" } }

export const CustomHost: Story = { render: () => <div><Label asChild htmlFor="label-custom-host-input" required showColon><label htmlFor="wrong-field">Company name</label></Label><Input id="label-custom-host-input" required /></div> }
