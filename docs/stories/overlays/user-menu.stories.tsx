import type { Meta, StoryObj } from "@storybook/react-vite"
import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "user-menu", component: UserMenu }), args: { account: { titleText: "John Doe" } } } satisfies Meta<typeof UserMenu>
export default meta
type Story = StoryObj<typeof meta>

export const CustomHost: Story = { render: () => <UserMenu asChild open portal={false} hideArrow account={{ titleText: "John Doe", avatarInitials: "JD" }}><section><UserMenuItem>Settings</UserMenuItem><UserMenuItem>Help</UserMenuItem></section></UserMenu> }
