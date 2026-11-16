import type { Meta, StoryObj } from "@storybook/react-vite"
import { Table, TableCell, TableHeaderCell, TableHeaderRow, TableRow } from "@/components/ui/table"
import { fioriMeta } from "../_lib/meta"

const meta = {
  ...fioriMeta({ name: "table", component: Table }),
  args: { "aria-label": "Products", loadingDelay: 0 },
  render: (args) => <Table {...args}><TableHeaderRow><TableHeaderCell>Product</TableHeaderCell></TableHeaderRow><TableRow rowKey="notebook" interactive><TableCell>Notebook Basic 15</TableCell></TableRow></Table>,
} satisfies Meta<typeof Table>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Loading: Story = { args: { loading: true } }
export const RTLLoading: Story = { args: { loading: true }, globals: { dir: "rtl" } }
