import type { Meta, StoryObj } from "@storybook/react-vite"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "card", component: Card }), args: { accessibleName: "Shipping" }, render: args => <Card {...args}><CardHeader titleText="Shipping" titleLevel={2} /><CardContent>Shipping details</CardContent></Card> } satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const ContentTexts: Story = { args: { texts: { card: "Panel", content: "Panel content" } } }
export const HeaderTexts: Story = { render: args => <Card {...args}><CardHeader titleText="Shipping" titleLevel={2} texts={{ header: "Panel header", interactiveHeader: "Open panel", avatar: "Account portrait" }} /><CardContent>Shipping details</CardContent></Card> }
