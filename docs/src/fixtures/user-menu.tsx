import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { actionSettings, globe, sysHelp } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

export const USER_MENU_WIDTH = "20rem"

type Props = { manage?: boolean; subtitle?: boolean; icons?: boolean; noItems?: boolean }

export default defineFixtures<Props>({
  name: "user-menu",
  cases: [
    { id: "user-menu", props: { manage: true, subtitle: true, icons: true } },
    { id: "user-menu-plain", props: {} },
  ],
  react: ({ manage, subtitle, icons }) => (
    <UserMenu
      surfaceOnly
      account={{ titleText: "John Doe", subtitleText: subtitle ? "john.doe@example.com" : undefined, avatarInitials: "JD" }}
      showManageAccount={manage}
    >
      <UserMenuItem icon={icons ? actionSettings : undefined}>Settings</UserMenuItem>
      <UserMenuItem icon={icons ? globe : undefined}>Language</UserMenuItem>
      <UserMenuItem icon={icons ? sysHelp : undefined}>Help</UserMenuItem>
    </UserMenu>
  ),
})
