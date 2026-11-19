import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs, useCallback, useState } from "storybook/preview-api"
import { fn } from "storybook/test"
import { UserMenu, UserMenuItem, type UserMenuProps } from "@/components/ui/user-menu"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { actionSettings, globe, sysHelp } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = UserMenuProps & { icons: boolean }
// Source-backed defaults from registry/ui/user-menu.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "texts.accessibleName",
    "key": "USER_MENU_POPOVER_ACCESSIBLE_NAME",
    "value": "User menu for"
  },
  {
    "prop": "texts.heading",
    "key": "USER_MENU_HEADING_TXT",
    "value": "User Menu"
  },
  {
    "prop": "texts.currentInformation",
    "key": "USER_MENU_CURRENT_INFORMATION_TXT",
    "value": "Current user information"
  },
  {
    "prop": "texts.actions",
    "key": "USER_MENU_ACTIONS_TXT",
    "value": "Actions"
  },
  {
    "prop": "texts.manageAccount",
    "key": "USER_MENU_MANAGE_ACCOUNT_BUTTON_TXT",
    "value": "Manage Account"
  },
  {
    "prop": "texts.signOut",
    "key": "USER_MENU_SIGN_OUT_BUTTON_TXT",
    "value": "Sign Out"
  }
]

const base = fioriMeta({ name: "user-menu", component: UserMenu })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></>, story: { inline: false, height: "620px" } } },
  args: { open: false, account: { titleText: "John Doe", subtitleText: "john.doe@example.com", avatarInitials: "JD" }, showManageAccount: true, avatarInteractive: false, icons: true, hideArrow: false, side: "bottom", align: "start", onOpenChange: fn(), onAvatarClick: fn(), onManageAccountClick: fn(), onSignOutClick: fn(), onItemClick: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, account: { control: "object" }, showManageAccount: { control: "boolean" }, avatarInteractive: { control: "boolean" }, icons: { control: "boolean" }, hideArrow: { control: "boolean" }, side: { control: "select", options: ["top", "right", "bottom", "left"] }, align: { control: "inline-radio", options: ["start", "center", "end"] }, texts: { control: "object" }, opener: { control: false }, infoArea: { control: false }, footer: { control: false }, onOpenChange: { control: false }, onAvatarClick: { control: false }, onManageAccountClick: { control: false }, onSignOutClick: { control: false }, onItemClick: { control: false } },
  render: function AccountMenu(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [opener, setOpener] = useState<HTMLElement | null>(null)
    // Storybook useStateLike creates a new setter per render. Keep the React
    // callback ref stable so detach/attach does not schedule an endless render.
    const attachOpener = useCallback((node: HTMLElement | null) => setOpener(node), [])
    const [last, setLast] = useState("No action selected")
    const { icons, ...props } = args
    return <div className="grid gap-3"><Avatar interactive accessibleName="Open account menu" initials="JD" ref={attachOpener} onClick={() => updateArgs({ open: !args.open })} /><UserMenu {...props} opener={opener} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }} onAvatarClick={() => { args.onAvatarClick?.(); setLast("Profile") }} onManageAccountClick={() => { args.onManageAccountClick?.(); setLast("Manage account") }} onSignOutClick={(event) => { args.onSignOutClick?.(event); setLast("Sign out") }} onItemClick={(value, event) => { args.onItemClick?.(value, event); setLast(value) }}><UserMenuItem value="settings" icon={icons ? actionSettings : undefined}>Settings</UserMenuItem><UserMenuItem value="language" icon={icons ? globe : undefined} additionalText="English">Language</UserMenuItem><UserMenuItem value="help" icon={icons ? sysHelp : undefined}>Help</UserMenuItem></UserMenu><output>{last}</output></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const Plain: Story = { args: { open: true, icons: false, showManageAccount: false, account: { titleText: "John Doe", avatarInitials: "JD" } } }
export const InteractiveAvatar: Story = { args: { open: true, avatarInteractive: true } }
export const InformationArea: Story = { args: { open: true, infoArea: <p>Signed in to Northwind Traders</p> } }
export const WithoutFooter: Story = { args: { open: true, footer: null } }
export const CustomFooter: Story = { args: { open: true, footer: <Button onClick={fn()}>Account security</Button> } }
export const CustomTexts: Story = { args: { open: true, texts: { accessibleName: "Account options for", heading: "Account options", actions: "Account actions", manageAccount: "Manage profile", signOut: "End session" } } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }
