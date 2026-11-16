import type { Meta, StoryObj } from "@storybook/react-vite"
import { List, ListItemGroup, ListItemStandard } from "@/components/ui/list"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "list", component: List }), args: { selectionMode: "multiple" }, render: args => <List {...args}><ListItemGroup headerText="Delivery countries"><ListItemStandard value="a">Argentina</ListItemStandard><ListItemStandard value="b">Bulgaria</ListItemStandard></ListItemGroup></List> } satisfies Meta<typeof List>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const ModeTexts: Story = { args: { texts: { multiSelectable: "Choose several destinations", selected: "Chosen", notSelected: "Not chosen", groups: (groups, items) => `${groups} destination groups, ${items} choices` } } }
