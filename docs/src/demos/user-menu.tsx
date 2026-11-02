import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { actionSettings, globe, sysHelp } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function UserMenuDemo() {
  const [open, setOpen] = React.useState(false)
  const [opener, setOpener] = React.useState<HTMLElement | null>(null)
  const [last, setLast] = React.useState("none")
  return (
    <div className="flex items-center gap-3">
      <Avatar
        id="user-menu-demo-open"
        interactive
        size="XS"
        initials="JD"
        accessibleName="John Doe"
        onClick={(e) => {
          setOpener(e.currentTarget)
          setOpen((o) => !o)
        }}
      />
      <UserMenu
        id="user-menu-demo"
        open={open}
        onOpenChange={setOpen}
        opener={opener}
        account={{ titleText: "John Doe", subtitleText: "john.doe@example.com", avatarInitials: "JD" }}
        showManageAccount
        onManageAccountClick={() => setLast("manage")}
        onSignOutClick={() => setLast("sign out")}
        onItemClick={(v) => setLast(v)}
      >
        <UserMenuItem value="settings" icon={actionSettings}>Settings</UserMenuItem>
        <UserMenuItem value="language" icon={globe} additionalText="English">Language</UserMenuItem>
        <UserMenuItem value="help" icon={sysHelp}>Help</UserMenuItem>
      </UserMenu>
      <span id="user-menu-demo-last" className="text-(--sapContent_LabelColor)">{`Last action: ${last}`}</span>
    </div>
  )
}

export default defineDemo({ title: "User Menu", order: 62, Demo: UserMenuDemo })
