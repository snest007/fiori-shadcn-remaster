import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MenuItem } from "@/components/ui/menu"
import { ShellBar, ShellBarBranding, ShellBarItem, ShellBarMenuButton, ShellBarSpacer } from "@/components/ui/shell-bar"
import { ShellBarSearch } from "@/components/ui/search"
import { Tag } from "@/components/ui/tag"
import { Text } from "@/components/ui/text"
import { ToggleButton } from "@/components/ui/toggle-button"
import { da, menu2, sysHelp, travelExpense } from "@/lib/fiori-icons"
import { Icon } from "@/components/ui/icon"

import { defineFixtures } from "../fixture-types"

// A small self-contained logo (no network), identical on both pages.
export const SHELL_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00b8f1"/><stop offset="1" stop-color="#0057d2"/></linearGradient></defs><path d="M0 0h48L24 24H0z" fill="url(#g)"/><path d="M6 6h14v3H9v2h10v7H5v-3h11v-2H6z" fill="#fff"/></svg>`
  )

export type ShellBarFixtureProps = {
  width: string
  startButton?: boolean
  title?: string
  logo?: boolean
  /** Menu button with this secondary title (ui5-shellbar's primary-title + menuItems) instead of the branding. */
  menuButton?: string
  /** Content items before / after the spacer: "#text" is a Text, anything else a Tag. */
  start?: string[]
  end?: string[]
  search?: "collapsed" | "expanded"
  notifications?: string | true
  items?: { icon: "help" | "expense"; text: string; count?: string }[]
  assistant?: boolean
  profile?: boolean
  productSwitch?: boolean
}

const itemIcons = { help: sysHelp, expense: travelExpense }

export default defineFixtures<ShellBarFixtureProps>({
  name: "shell-bar",
  cases: ([
    { id: "shell-bar-interaction", props: { width: "40rem", items: [{ icon: "help", text: "Help" }] }, interact: { selector: '[data-slot="shell-bar-item"]', ui5Selector: "ui5-shellbar-item" } },
    {
      id: "shell-bar-xl",
      props: {
        width: "1480px",
        logo: true,
        title: "Corporate Portal",
        start: ["#Sales Order Management"],
        end: ["Trial"],
        search: "expanded",
        notifications: "12",
        items: [{ icon: "help", text: "Help" }, { icon: "expense", text: "Expenses", count: "3" }],
        assistant: true,
        profile: true,
        productSwitch: true,
      },
    },
    {
      id: "shell-bar-l",
      props: {
        width: "1100px",
        startButton: true,
        logo: true,
        title: "Corporate Portal",
        search: "collapsed",
        notifications: true,
        profile: true,
        productSwitch: true,
      },
    },
    { id: "shell-bar-minimal", props: { width: "40rem", logo: true, title: "Corporate Portal", profile: true } },
    { id: "shell-bar-menu-button", props: { width: "60rem", logo: true, title: "Corporate Portal", menuButton: "Secondary title", profile: true, productSwitch: true } },
    { id: "shell-bar-title-only", props: { width: "40rem", title: "Corporate Portal", notifications: true } },
    {
      id: "shell-bar-overflow-dot",
      props: {
        width: "300px",
        logo: true,
        notifications: "5",
        items: [{ icon: "help", text: "Help" }, { icon: "expense", text: "Expenses", count: "3" }],
        profile: true,
        productSwitch: true,
      },
    },
    {
      id: "shell-bar-s",
      props: {
        width: "360px",
        logo: true,
        title: "Corporate Portal",
        search: "collapsed",
        notifications: "5",
        items: [{ icon: "help", text: "Help" }, { icon: "expense", text: "Expenses", count: "3" }],
        profile: true,
        productSwitch: true,
      },
    },
  ] satisfies import("../fixture-types").FixtureCase<ShellBarFixtureProps>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "shell-bar-rtl" }] : [fixture]),
  react: (p) => (
    <ShellBar
      style={{ width: p.width }}
      startButton={
        p.startButton ? (
          <Button variant="transparent" size="icon" aria-label="Menu">
            <Icon icon={menu2} />
          </Button>
        ) : undefined
      }
      branding={
        p.menuButton ? (
          <ShellBarMenuButton
            logo={p.logo ? <img src={SHELL_LOGO} alt="" /> : undefined}
            secondaryTitle={p.menuButton}
            menu={<MenuItem>Application 1</MenuItem>}
          >
            {p.title}
          </ShellBarMenuButton>
        ) : p.title || p.logo ? (
          <ShellBarBranding logo={p.logo ? <img src={SHELL_LOGO} alt="" /> : undefined}>{p.title}</ShellBarBranding>
        ) : undefined
      }
      content={
        p.start || p.end ? (
          <>
            {(p.start ?? []).map((t) => (t.startsWith("#") ? <Text key={t}>{t.slice(1)}</Text> : <Tag key={t}>{t}</Tag>))}
            <ShellBarSpacer />
            {(p.end ?? []).map((t) => (t.startsWith("#") ? <Text key={t}>{t.slice(1)}</Text> : <Tag key={t}>{t}</Tag>))}
          </>
        ) : undefined
      }
      search={p.search ? <ShellBarSearch placeholder="Search" /> : undefined}
      searchExpanded={p.search === "expanded"}
      disableSearchCollapse
      assistant={
        p.assistant ? (
          <ToggleButton variant="transparent" size="icon" aria-label="Joule">
            <Icon icon={da} />
          </ToggleButton>
        ) : undefined
      }
      showNotifications={!!p.notifications}
      notificationsCount={typeof p.notifications === "string" ? p.notifications : undefined}
      profile={p.profile ? <Avatar initials="JD" /> : undefined}
      showProductSwitch={p.productSwitch}
    >
      {p.items?.map((it) => <ShellBarItem key={it.text} icon={itemIcons[it.icon]} text={it.text} count={it.count} />)}
    </ShellBar>
  ),
})
