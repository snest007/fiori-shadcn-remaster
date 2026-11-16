import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger, type MenuContentProps, type MenuGroupProps } from "@/components/ui/menu"
import { Button } from "@/components/ui/button"
import { copy, edit, paste, share } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = React.ComponentProps<typeof Menu> & Pick<MenuContentProps, "side" | "align" | "headerText" | "cancelLabel"> & Pick<MenuGroupProps, "checkMode"> & { icons: boolean; disabledSubmenu: boolean; openerDirection?: "ltr" | "rtl"; openerAncestorDirection?: "ltr" | "rtl"; onSelect: (event: Event) => void; onCheckedChange: (checked: boolean) => void }
// Source-backed defaults from registry/ui/menu.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "MenuContent.headerText",
    "key": "Application text; no matching component UI5 default",
    "value": ""
  },
  {
    "prop": "MenuContent.cancelLabel",
    "key": "MENU_CANCEL_BUTTON_TEXT",
    "value": "Cancel"
  },
  {
    "prop": "MenuSubContent.backLabel",
    "key": "Application text; no matching component UI5 default",
    "value": "Navigate Back"
  },
  {
    "prop": "MenuGroup.none",
    "key": "MENU_ITEM_GROUP_NONE_ACCESSIBLE_NAME",
    "value": "Contains Non-Selectable Items"
  },
  {
    "prop": "MenuGroup.single",
    "key": "MENU_ITEM_GROUP_SINGLE_ACCESSIBLE_NAME",
    "value": "Contains Selectable Items"
  },
  {
    "prop": "MenuGroup.multiple",
    "key": "MENU_ITEM_GROUP_MULTI_ACCESSIBLE_NAME",
    "value": "Contains Multi-Selectable Items"
  }
]

const base = fioriMeta({ name: "menu", component: Menu })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></>, story: { inline: false, height: "400px" } } },
  args: { open: false, modal: false, side: "bottom", align: "start", checkMode: "none", icons: true, disabledSubmenu: false, onOpenChange: fn(), onSelect: fn(), onCheckedChange: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, modal: { control: "boolean" }, checkMode: { control: "inline-radio", options: ["none", "single", "multiple"] }, icons: { control: "boolean" }, disabledSubmenu: { control: "boolean" }, side: { control: "select", options: ["top", "right", "bottom", "left"] }, align: { control: "inline-radio", options: ["start", "center", "end"] }, headerText: { control: "text" }, cancelLabel: { control: "text" }, onOpenChange: { control: false }, onSelect: { control: false }, onCheckedChange: { control: false }, dir: { control: false }, openerDirection: { control: false }, openerAncestorDirection: { control: false } },
  render: function OrderActions(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [last, setLast] = React.useState("No action selected")
    const { icons, disabledSubmenu, checkMode, side, align, headerText, cancelLabel, onSelect, onCheckedChange, openerDirection, openerAncestorDirection, ...props } = args
    const select = (label: string) => (event: Event) => { onSelect(event); setLast(label) }
    return <div className="grid gap-3"><Menu {...props} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}><div dir={openerAncestorDirection}><MenuTrigger asChild><Button dir={openerDirection}>Order actions</Button></MenuTrigger></div><MenuContent side={side} align={align} headerText={headerText} cancelLabel={cancelLabel} aria-label="Order actions" className="w-64"><MenuGroup checkMode={checkMode} aria-label="Order preferences"><MenuItem defaultChecked={checkMode !== "none"} icon={icons ? edit : undefined} onSelect={select("Edit")} onCheckedChange={onCheckedChange}>Edit</MenuItem><MenuItem icon={icons ? copy : undefined} additionalText="Ctrl+C" onSelect={select("Copy")} onCheckedChange={onCheckedChange}>Copy</MenuItem><MenuItem disabled icon={icons ? paste : undefined} defaultChecked={checkMode === "multiple"}>Paste</MenuItem><MenuSub><MenuSubTrigger disabled={disabledSubmenu} defaultChecked={disabledSubmenu && checkMode !== "none"} icon={icons ? share : undefined}>Share</MenuSubTrigger><MenuSubContent aria-label="Share order"><MenuItem onSelect={select("Email")}>Email</MenuItem><MenuItem onSelect={select("Chat")}>Chat</MenuItem></MenuSubContent></MenuSub></MenuGroup><MenuSeparator /><MenuGroup aria-label="Other actions"><MenuItem onSelect={select("Archive")}>Archive</MenuItem></MenuGroup></MenuContent></Menu><output>{last}</output></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const Plain: Story = { args: { open: true, icons: false } }
export const IconsAndShortcuts: Story = { args: { open: true } }
export const SingleSelection: Story = { args: { open: true, checkMode: "single", icons: false } }
export const SingleSelectionWithIcons: Story = { args: { open: true, checkMode: "single" } }
export const MultipleSelection: Story = { args: { open: true, checkMode: "multiple", icons: false } }
export const MultipleSelectionWithIcons: Story = { args: { open: true, checkMode: "multiple" } }
export const SingleDisabledSubmenu: Story = { args: { open: true, checkMode: "single", disabledSubmenu: true } }
export const MultipleDisabledSubmenu: Story = { args: { open: true, checkMode: "multiple", disabledSubmenu: true } }
export const CustomTexts: Story = { args: { headerText: "Purchase order actions", cancelLabel: "Close action list" } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }

export const OwnerRTLWithLTROpener: Story = { args: { open: true, openerDirection: "ltr" }, decorators: [(Story) => <div dir="rtl"><Story /></div>] }
export const OwnerRTLWithLTROpenerAncestor: Story = { args: { open: true, openerAncestorDirection: "ltr" }, decorators: [(Story) => <div dir="rtl"><Story /></div>] }
export const OwnerLTRWithRTLOpenerAncestor: Story = { args: { open: true, openerAncestorDirection: "rtl" } }
export const ExplicitLTR: Story = { args: { open: true, dir: "ltr", openerDirection: "rtl" }, decorators: [(Story) => <div dir="rtl"><Story /></div>] }
export const ExplicitRTL: Story = { args: { open: true, dir: "rtl", openerDirection: "ltr" } }
