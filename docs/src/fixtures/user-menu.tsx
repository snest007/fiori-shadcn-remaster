import * as React from "react"
import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { actionSettings, globe, sysHelp } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { manage?: boolean; subtitle?: boolean; icons?: boolean }

// The surface is rendered open and in place, without the arrow on both pages (its position depends on the live
// placement against the opener). Opening, focus and Escape are covered by tests/user-menu.spec.ts.

const fixtureSet = defineFixtures<Props>({
  name: "user-menu",
  cases: ([
    { id: "user-menu", props: { manage: true, subtitle: true, icons: true } },
    { id: "user-menu-plain", props: {} },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "user-menu-rtl" }] : [fixture]),
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


// E4: consumer host replacement changes the DOM host while the component keeps
// the owning semantics. The native renderer uses the same underlying state.
function customHost(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) return node.map(customHost)
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node
  const children = customHost(node.props.children)
  if (node.type === UserMenu) return React.cloneElement(node, { asChild: true } as Partial<typeof node.props>, <div data-custom-host="user-menu" role="presentation" tabIndex={13} id="user-menu-caller-host">{children}</div>)
  return node.props.children === undefined ? node : React.cloneElement(node, {}, children)
}
const baseCase = fixtureSet.cases.find((entry) => entry.id === "user-menu")!
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "user-menu-custom-host", props: { ...baseCase.props, customHost: true } }],
  react: (props: typeof baseCase.props & { customHost?: boolean }) => props.customHost ? customHost(fixtureSet.react(props)) : fixtureSet.react(props),
}
