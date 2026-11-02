import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { actionSettings, globe, sysHelp } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { manage?: boolean; subtitle?: boolean; icons?: boolean }

// The surface is rendered open and in place, without the arrow on both pages (its position depends on the live
// placement against the opener). Opening, focus and Escape are covered by tests/user-menu.spec.ts.

export default defineFixtures<Props>({
  name: "user-menu",
  cases: [
    { id: "user-menu", props: { manage: true, subtitle: true, icons: true } },
    { id: "user-menu-plain", props: {} },
  ],
  react: ({ manage, subtitle, icons }) => (
    <div className={inPlace}>
      <UserMenu
        open
        portal={false}
        hideArrow
        onOpenAutoFocus={(e) => e.preventDefault()}
        account={{ titleText: "John Doe", subtitleText: subtitle ? "john.doe@example.com" : undefined, avatarInitials: "JD" }}
        showManageAccount={manage}
      >
        <UserMenuItem icon={icons ? actionSettings : undefined}>Settings</UserMenuItem>
        <UserMenuItem icon={icons ? globe : undefined}>Language</UserMenuItem>
        <UserMenuItem icon={icons ? sysHelp : undefined}>Help</UserMenuItem>
      </UserMenu>
    </div>
  ),
})
