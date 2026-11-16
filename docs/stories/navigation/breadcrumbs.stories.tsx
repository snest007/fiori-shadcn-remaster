import type { Meta, StoryObj } from "@storybook/react-vite"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "breadcrumbs", component: Breadcrumbs }), render: args => <Breadcrumbs {...args}><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem href="#products">Products</BreadcrumbsItem><BreadcrumbsItem>Current</BreadcrumbsItem></Breadcrumbs> } satisfies Meta<typeof Breadcrumbs>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const PositionTexts: Story = { args: { texts: { breadcrumbTrail: "Navigation path", overflow: "Earlier locations", position: (position, size) => `${position} among ${size}` } } }
