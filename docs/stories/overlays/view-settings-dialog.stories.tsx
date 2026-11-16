import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { ViewSettingsDialog } from "@/components/ui/view-settings-dialog"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "view-settings-dialog", component: ViewSettingsDialog }), args: { resetEnabled: true, filterItems: [{ text: "Delivery", values: [{ text: "Express", selected: true }, { text: "Standard" }] }] }, render: function Example(args) { const [open, setOpen] = React.useState(false); return <ViewSettingsDialog {...args} open={open} onOpenChange={setOpen}><Button onClick={() => setOpen(true)}>Open view settings</Button></ViewSettingsDialog> } } satisfies Meta<typeof ViewSettingsDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const AnnouncementTexts: Story = { args: { texts: { resetAnnouncement: "Filters restored", filterItemLabel: (label, count) => `${label}: ${count} choices` } }, play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: "Open view settings" })); const dialog = await within(document.body).findByRole("dialog"); await expect(dialog).toBeVisible(); await expect(within(dialog).getByRole("listitem", { name: "Delivery: 1 choices" })).toBeVisible(); await userEvent.click(within(dialog).getByRole("button", { name: "Reset" })); await expect(within(dialog).getByRole("status")).toHaveTextContent("Filters restored") } }
