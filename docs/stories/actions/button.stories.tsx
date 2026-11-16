import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { accept, add, edit } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "button", component: Button })
const meta = {
  ...base,
  render: (args) => <Button {...args} />,
  args: { children: "Save", variant: "default", size: "default", disabled: false, onClick: fn() },
  argTypes: {
    ...base.argTypes,
    children: { control: "text", table: { disable: false }, description: "Action label." },
    variant: { ...base.argTypes.variant, control: "select", options: ["default", "emphasized", "transparent", "positive", "negative", "attention"], description: "Semantic appearance of the action." },
    size: { ...base.argTypes.size, control: "inline-radio", options: ["default", "icon"], description: "Use icon for a square icon-only action." },
    disabled: { ...base.argTypes.disabled, control: "boolean", description: "Disable activation." },
    onClick: { control: false },
  },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Default: Story = { args: { variant: "default", children: "Cancel" } }
export const Emphasized: Story = { args: { variant: "emphasized" } }
export const Transparent: Story = { args: { variant: "transparent", children: "Details" } }
export const Positive: Story = { args: { variant: "positive", children: "Approve" } }
export const Negative: Story = { args: { variant: "negative", children: "Reject" } }
export const Attention: Story = { args: { variant: "attention", children: "Review" } }
export const Disabled: Story = { args: { disabled: true } }
export const EmphasizedDisabled: Story = { args: { variant: "emphasized", disabled: true } }
export const TransparentDisabled: Story = { args: { variant: "transparent", disabled: true } }
export const PositiveDisabled: Story = { args: { variant: "positive", disabled: true } }
export const NegativeDisabled: Story = { args: { variant: "negative", disabled: true } }
export const AttentionDisabled: Story = { args: { variant: "attention", disabled: true } }
export const WithIcon: Story = { render: (args) => <Button {...args}><Icon icon={accept} />Approve</Button> }
export const IconOnly: Story = { args: { children: undefined, size: "icon", variant: "transparent", "aria-label": "Add product" }, render: (args) => <Button {...args}><Icon icon={add} /></Button> }
export const LongText: Story = { args: { children: "Save changes and return to the product list" } }
export const Actions: Story = { render: () => <div className="flex flex-wrap gap-2"><Button variant="emphasized">Save</Button><Button>Cancel</Button><Button variant="transparent"><Icon icon={edit} />Edit</Button></div> }
