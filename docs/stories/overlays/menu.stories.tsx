import type { Meta, StoryObj } from "@storybook/react-vite"
import { Menu, MenuContent, MenuItem } from "@/components/ui/menu"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "menu", component: Menu }) } satisfies Meta<typeof Menu>
export default meta
type Story = StoryObj<typeof meta>

export const CustomHost: Story = { render: () => <Menu open modal={false}><MenuContent portal={false} aria-label="Custom host actions" preventInitialFocus><MenuItem asChild><div>Custom action</div></MenuItem></MenuContent></Menu> }
