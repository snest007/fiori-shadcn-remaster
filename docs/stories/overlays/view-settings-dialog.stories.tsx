import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ViewSettingsDialog, type ViewSettings, type ViewSettingsDialogProps } from "@/components/ui/view-settings-dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"
// Source-backed defaults from registry/ui/view-settings-dialog.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "texts.title",
    "key": "VSD_DIALOG_TITLE_SORT",
    "value": "View Settings"
  },
  {
    "prop": "texts.reset",
    "key": "VSD_RESET_BUTTON",
    "value": "Reset"
  },
  {
    "prop": "texts.ok",
    "key": "VSD_SUBMIT_BUTTON",
    "value": "OK"
  },
  {
    "prop": "texts.cancel",
    "key": "VSD_CANCEL_BUTTON",
    "value": "Cancel"
  },
  {
    "prop": "texts.sortOrder",
    "key": "VSD_SORT_ORDER",
    "value": "Sort Order"
  },
  {
    "prop": "texts.sortBy",
    "key": "VSD_SORT_BY",
    "value": "Sort By"
  },
  {
    "prop": "texts.groupOrder",
    "key": "VSD_GROUP_ORDER",
    "value": "Group Order"
  },
  {
    "prop": "texts.groupBy",
    "key": "VSD_GROUP_BY",
    "value": "Group By"
  },
  {
    "prop": "texts.filterBy",
    "key": "VSD_FILTER_BY",
    "value": "Filter By"
  },
  {
    "prop": "texts.ascending",
    "key": "VSD_ORDER_ASCENDING",
    "value": "Ascending"
  },
  {
    "prop": "texts.descending",
    "key": "VSD_ORDER_DESCENDING",
    "value": "Descending"
  },
  {
    "prop": "texts.sortTooltip",
    "key": "VSD_SORT_TOOLTIP",
    "value": "Sort"
  },
  {
    "prop": "texts.filterTooltip",
    "key": "VSD_FILTER_TOOLTIP",
    "value": "Filter"
  },
  {
    "prop": "texts.groupTooltip",
    "key": "VSD_GROUP_TOOLTIP",
    "value": "Group"
  },
  {
    "prop": "texts.back",
    "key": "Application text; no matching component UI5 default",
    "value": "Back"
  }
]

const base = fioriMeta({ name: "view-settings-dialog", component: ViewSettingsDialog })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></>, story: { inline: false, height: "650px" } } },
  args: { open: false, sortItems: [{ text: "Product", selected: true }, { text: "Supplier" }, { text: "Price" }], filterItems: [{ text: "Supplier", values: [{ text: "Northwind Traders", selected: true }, { text: "Contoso" }] }, { text: "Availability", values: [{ text: "In stock" }, { text: "Preorder" }] }], groupItems: [{ text: "Supplier", selected: true }, { text: "Availability" }], sortDescending: false, groupDescending: false, resetEnabled: false, onOpenChange: fn(), onConfirm: fn(), onCancel: fn(), onReset: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, sortItems: { control: "object" }, filterItems: { control: "object" }, groupItems: { control: "object" }, sortDescending: { control: "boolean" }, groupDescending: { control: "boolean" }, resetEnabled: { control: "boolean" }, texts: { control: "object" }, portal: { control: false }, onOpenChange: { control: false }, onConfirm: { control: false }, onCancel: { control: false }, onReset: { control: false } },
  render: function ProductViewSettings(args: ViewSettingsDialogProps) {
    const [, updateArgs] = useArgs<ViewSettingsDialogProps>()
    const [settings, setSettings] = React.useState<ViewSettings | null>(null)
    return <div className="grid gap-3"><ViewSettingsDialog {...args} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }} onConfirm={(result) => { args.onConfirm?.(result); setSettings(result) }}><DialogTrigger asChild><Button>Configure product view</Button></DialogTrigger></ViewSettingsDialog><output>{settings ? `Sort by ${settings.sortBy ?? "None"}; group by ${settings.groupBy ?? "None"}` : "View settings have not been confirmed"}</output></div>
  },
} satisfies Meta<typeof ViewSettingsDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const SortFilterAndGroup: Story = { args: { open: true } }
export const Descending: Story = { args: { open: true, filterItems: [], sortDescending: true } }
export const FilterOnly: Story = { args: { open: true, sortItems: [], groupItems: [] } }
export const GroupOnly: Story = { args: { open: true, sortItems: [], filterItems: [] } }
export const SortOnly: Story = { args: { open: true, filterItems: [], groupItems: [] } }
export const GroupDescending: Story = { args: { open: true, sortItems: [], filterItems: [], groupDescending: true } }
export const ResetEnabled: Story = { args: { open: true, resetEnabled: true } }
export const CustomTexts: Story = { args: { open: true, texts: { title: "Product view", sortBy: "Order products by", filterBy: "Restrict products by", ok: "Apply view", cancel: "Keep current view", reset: "Restore view" } } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }
