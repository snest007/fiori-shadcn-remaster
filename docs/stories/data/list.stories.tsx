import type { Meta, StoryObj } from "@storybook/react-vite"
import { List, ListItemCustom, ListItemGroup, ListItemGroupHeader, ListItemStandard } from "@/components/ui/list"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"

const meta = { ...fioriMeta({ name: "list", component: List }), render: () => <List aria-label="Produce" selectionMode="multiple"><ListItemStandard value="apple">Apples</ListItemStandard><ListItemStandard value="pear">Pears</ListItemStandard></List> } satisfies Meta<typeof List>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const CustomFocusDescription: Story = { render: () => <List aria-label="Custom produce" texts={{ customItem: "Produce row", singleControl: "Contains one action", selected: "Produce selected", notSelected: "Produce deselected" }} selectionMode="multiple"><ListItemCustom value="apple"><span>Apples</span><Button>Edit</Button></ListItemCustom></List> }
export const RTLCustomFocusDescription: Story = { ...CustomFocusDescription, globals: { dir: "rtl" } }
export const GrowingAccessibility: Story = { render: () => <List aria-label="Produce" growing="button" growingButtonText="Load produce" growingButtonName="Load produce" growingButtonDescription="Fetch additional fruit"><ListItemStandard value="apple">Apples</ListItemStandard></List> }

export const Groups: Story = { render: () => <List aria-label="Produce"><ListItemGroup headerText="Fruit"><ListItemStandard value="apple">Apples</ListItemStandard><ListItemStandard value="pear">Pears</ListItemStandard></ListItemGroup></List> }
export const RTLGroups: Story = { ...Groups, globals: { dir: "rtl" } }
export const HeaderAccessibility: Story = { render: () => <List aria-label="Produce"><ListItemGroupHeader accessibleName="Produce categories">Fruit group</ListItemGroupHeader><ListItemStandard value="apple" type="inactive">Apples</ListItemStandard></List> }
export const ItemAccessibility: Story = { render: () => <List aria-label="Produce" accessibleRole="listbox" selectionMode="single" defaultValue={["apple"]}><ListItemCustom value="apple" aria-label="Apples produce row" aria-posinset={2} aria-setsize={7}><span>Apples</span></ListItemCustom></List> }
export const RoleMenu: Story = { render: () => <List aria-label="Produce actions" accessibleRole="menu"><ListItemStandard value="buy" type="navigation">Buy produce</ListItemStandard></List> }
export const RoleTree: Story = { render: () => <List aria-label="Produce tree" accessibleRole="tree"><ListItemStandard value="fruit" type="inactive">Fruit</ListItemStandard></List> }
