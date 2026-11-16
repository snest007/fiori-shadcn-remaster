import type { Meta, StoryObj } from "@storybook/react-vite"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "wizard", component: Wizard }), render: args => <div className="h-80 w-full"><Wizard {...args}><WizardStep titleText="Shipping" subtitleText="Optional"><p>Shipping details</p></WizardStep><WizardStep titleText="Review" disabled><p>Review details</p></WizardStep></Wizard></div> } satisfies Meta<typeof Wizard>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const ComposedTexts: Story = { args: { texts: { stepHeading: "Stage", activeStep: "Ready", inactiveStep: "Pending", optionalStep: "Not required", actionSheetSteps: "Stages", stepLabel: (n, title, enabled, optional) => `${n} ${title} ${enabled ? "Ready" : "Pending"} ${optional ? "Not required" : ""}`.trim() } } }
