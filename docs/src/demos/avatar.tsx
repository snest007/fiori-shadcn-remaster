import * as React from "react"

import { Avatar, AvatarGroup } from "@/components/ui/avatar"
import { favorite } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function AvatarDemo() {
  const [pressed, setPressed] = React.useState(0)
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Avatar size="XS" initials="XS" />
        <Avatar size="S" initials="S" colorScheme="accent1" />
        <Avatar size="M" initials="M" colorScheme="accent3" />
        <Avatar size="L" icon={favorite} colorScheme="accent5" />
        <Avatar size="XL" shape="square" initials="XL" colorScheme="accent8" />
        <Avatar size="M" colorScheme="placeholder" />
      </div>
      <div className="flex items-center gap-3">
        <Avatar id="avatar-interactive" interactive initials="JD" accessibleName="John Doe" onClick={() => setPressed((n) => n + 1)} />
        <span id="avatar-pressed" className="text-(--sapContent_LabelColor)">{`Pressed ${pressed} times`}</span>
      </div>
      <AvatarGroup type="group" aria-label="Project team" onClick={() => setPressed((n) => n + 1)}>
        <Avatar initials="JD" />
        <Avatar initials="AB" />
        <Avatar initials="CK" />
        <Avatar icon={favorite} />
      </AvatarGroup>
      <AvatarGroup type="individual" size="XS">
        <Avatar initials="JD" accessibleName="John Doe" />
        <Avatar initials="AB" accessibleName="Anna Bauer" />
        <Avatar initials="CK" accessibleName="Chen Kai" />
      </AvatarGroup>
    </div>
  )
}

export default defineDemo({ title: "Avatar", order: 32, Demo: AvatarDemo })
