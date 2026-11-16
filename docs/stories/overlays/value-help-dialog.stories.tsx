import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { expect, userEvent, within } from "storybook/test"
import { ValueHelpDialog } from "@/components/ui/value-help-dialog"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"

const meta = {
  ...fioriMeta({ name: "value-help-dialog", component: ValueHelpDialog }),
  args: { title: "Delivery choices", open: false, keyField: "id", columns: [{ key: "name", label: "Name" }], items: [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }], defaultValue: { keys: ["a"], conditions: [{ operator: "EQ", values: ["A"] }] } },
  render: function Example(args) { const [, updateArgs] = useArgs(); return <ValueHelpDialog {...args} onOpenChange={open => updateArgs({ open })}><Button onClick={() => updateArgs({ open: true })}>Open delivery choices</Button></ValueHelpDialog> },
} satisfies Meta<typeof ValueHelpDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const CountedTitles: Story = { args: { texts: { itemsWithCount: count => `Rows ${count}`, searchAndSelectWithCount: count => `Selected ${count}`, defineConditionsWithCount: count => `Rules ${count}`, selectedItemsAndConditionsWithCount: count => `Total ${count}` } }, play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: "Open delivery choices" })); const dialog = await within(document.body).findByRole("dialog", { name: "Delivery choices" }); await expect(within(dialog).getByRole("grid")).toHaveAccessibleName("Rows 2"); await expect(within(dialog).getByRole("tab", { name: "Selected 1" })).toBeVisible(); await expect(within(dialog).getByRole("tab", { name: "Rules 1" })).toBeVisible(); await expect(within(dialog).getByRole("list", { name: "Total 2" })).toBeVisible() } }
