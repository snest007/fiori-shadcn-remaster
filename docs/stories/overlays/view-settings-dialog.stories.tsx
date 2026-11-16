import type { Meta, StoryObj } from "@storybook/react-vite"
import { ViewSettingsDialog } from "@/components/ui/view-settings-dialog"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "view-settings-dialog", component: ViewSettingsDialog }), args: { defaultOpen: true, resetEnabled: true, filterItems: [{ text: "Delivery", values: [{ text: "Express", selected: true }, { text: "Standard" }] }] } } satisfies Meta<typeof ViewSettingsDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const AnnouncementTexts: Story = { args: { texts: { resetAnnouncement: "Filters restored", filterItemLabel: (label, count) => `${label}: ${count} choices` } } }
