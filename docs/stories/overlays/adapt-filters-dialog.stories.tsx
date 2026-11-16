import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { AdaptFiltersDialog, type AdaptFiltersDialogProps, type FilterDefinition, type FilterValues } from "@/components/ui/adapt-filters-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"
const initialValues: FilterValues = { name: [{ operator: "EQ", values: ["Notebook"] }], country: [{ operator: "EQ", values: ["Germany"] }] }
const filters: FilterDefinition[] = [
  { key: "name", label: "Name", group: "product", groupLabel: "Product", required: true },
  { key: "country", label: "Country", group: "location", groupLabel: "Location" },
  { key: "city", label: "City", group: "location", groupLabel: "Location", visibleInFilterBar: false },
].map((field): FilterDefinition => ({ ...field, render: ({ id, conditions, onConditionsChange, required, valueState, valueStateMessage, disabled }) => <Input id={id} aria-label={field.label} required={required} disabled={disabled} value={String(conditions[0]?.values[0] ?? "")} valueState={valueState} valueStateMessage={valueStateMessage} onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "EQ", values: [event.target.value] }] : [])} /> }))
// Source-backed defaults from registry/ui/adapt-filters-dialog.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "texts.title",
    "key": "filterbar.ADAPT, filterbar.ADAPT_TITLE",
    "value": "Adapt Filters"
  },
  {
    "prop": "texts.reset",
    "key": "p13nDialog.RESET, p13n.POPUP_RESET",
    "value": "Reset"
  },
  {
    "prop": "texts.ok",
    "key": "p13nDialog.OK, p13n.POPUP_OK",
    "value": "OK"
  },
  {
    "prop": "texts.cancel",
    "key": "p13nDialog.CANCEL, p13n.POPUP_CANCEL",
    "value": "Cancel"
  },
  {
    "prop": "texts.warning",
    "key": "Application text; no matching component UI5 default",
    "value": "Warning"
  },
  {
    "prop": "texts.resetWarning",
    "key": "filterbar.ADAPT_RESET_WARNING",
    "value": "You are about to reset all the changes you made\n to your filters and revert back to the selected view."
  },
  {
    "prop": "texts.list",
    "key": "adaptFiltersPanel.LIST",
    "value": "List"
  },
  {
    "prop": "texts.group",
    "key": "p13nDialog.TAB_Group, adaptFiltersPanel.GROUP, p13n.DEFAULT_TITLE_GROUP",
    "value": "Group"
  },
  {
    "prop": "texts.listView",
    "key": "filterbar.ADAPT_LIST_VIEW",
    "value": "List View"
  },
  {
    "prop": "texts.groupView",
    "key": "filterbar.ADAPT_GROUP_VIEW",
    "value": "Group View"
  },
  {
    "prop": "texts.toolbarTitle",
    "key": "adaptFiltersPanel.TOOLBAR_TITLE",
    "value": "Filter Values and Visibility"
  },
  {
    "prop": "texts.search",
    "key": "p13nDialog.ADAPT_FILTER_SEARCH",
    "value": "Search for filters"
  },
  {
    "prop": "texts.edit",
    "key": "adaptFiltersPanel.VIEW_MODE_EDIT",
    "value": "Edit"
  },
  {
    "prop": "texts.sort",
    "key": "p13nDialog.TAB_Sort, adaptFiltersPanel.VIEW_MODE_SORT, p13n.DEFAULT_TITLE_SORT",
    "value": "Sort"
  },
  {
    "prop": "texts.interactionModes",
    "key": "p13nDialog.ADAPT_FILTER_MODE_BUTTON_LABEL",
    "value": "Filter Interaction Modes"
  },
  {
    "prop": "texts.addFilter",
    "key": "adaptFiltersPanel.ADD_FILTER_LABEL",
    "value": "Add Filter"
  },
  {
    "prop": "texts.addPlaceholder",
    "key": "adaptFiltersPanel.ADD_FILTER_PLACEHOLDER",
    "value": "Select or Type Name"
  },
  {
    "prop": "texts.addOptions",
    "key": "Application text; no matching component UI5 default",
    "value": "Available Filters"
  },
  {
    "prop": "texts.selectOptions",
    "key": "Application text; no matching component UI5 default",
    "value": "Select Options"
  },
  {
    "prop": "texts.noResults",
    "key": "Application text; no matching component UI5 default",
    "value": "No data"
  },
  {
    "prop": "texts.showFilter",
    "key": "Application text; no matching component UI5 default",
    "value": "Show on Filter Bar"
  },
  {
    "prop": "texts.hideFilter",
    "key": "Application text; no matching component UI5 default",
    "value": "Hide on Filter Bar"
  },
  {
    "prop": "texts.removeFilter",
    "key": "Application text; no matching component UI5 default",
    "value": "Remove Filter"
  },
  {
    "prop": "texts.dragToReorder",
    "key": "adaptFiltersPanel.ACTION_SORT",
    "value": "Drag to reorder"
  },
  {
    "prop": "texts.moveTop",
    "key": "filterbar.ADAPT_MOVE_TO_TOP, p13nDialog.MOVE_TO_TOP, p13n.MOVE_TO_TOP",
    "value": "Move to Top"
  },
  {
    "prop": "texts.moveUp",
    "key": "filterbar.ADAPT_MOVE_UP, p13nDialog.MOVE_UP, p13n.MOVE_UP",
    "value": "Move Up"
  },
  {
    "prop": "texts.moveDown",
    "key": "filterbar.ADAPT_MOVE_DOWN, p13nDialog.MOVE_DOWN, p13n.MOVE_DOWN",
    "value": "Move Down"
  },
  {
    "prop": "texts.moveBottom",
    "key": "filterbar.ADAPT_MOVE_TO_BOTTOM, p13nDialog.MOVE_TO_BOTTOM, p13n.MOVE_TO_BOTTOM",
    "value": "Move to Bottom"
  },
  {
    "prop": "texts.reorderHint",
    "key": "adaptFiltersPanel.REORDERING_SHORTCUT_WINDOWS",
    "value": "Use Ctrl + Arrow Up or Ctrl + Arrow Down to reorder item."
  },
  {
    "prop": "texts.filter",
    "key": "filterbar.ADAPT_COLUMN_DESCRIPTION, p13nDialog.LIST_VIEW_COLUMN, p13nDialog.TAB_Filter, adaptFiltersPanel.FILTER_BUTTON, p13n.DEFAULT_TITLE_FILTER",
    "value": "Filter"
  },
  {
    "prop": "texts.filterMode",
    "key": "Application text; no matching component UI5 default",
    "value": "Filter Mode"
  },
  {
    "prop": "texts.visible",
    "key": "p13nDialog.GROUPMODE_VISIBLE",
    "value": "Visible"
  },
  {
    "prop": "texts.active",
    "key": "p13nDialog.GROUPMODE_ACTIVE, p13nDialog.LIST_VIEW_ACTIVE",
    "value": "Active"
  },
  {
    "prop": "texts.visibleActive",
    "key": "p13nDialog.GROUPMODE_VISIBLE_ACTIVE",
    "value": "Visible and Active"
  },
  {
    "prop": "texts.all",
    "key": "p13nDialog.GROUPMODE_ALL",
    "value": "All"
  },
  {
    "prop": "texts.mandatory",
    "key": "p13nDialog.GROUPMODE_MANDATORY",
    "value": "Mandatory"
  },
  {
    "prop": "texts.showValues",
    "key": "filterbar.ADAPT_SHOW_VALUE",
    "value": "Show Values"
  },
  {
    "prop": "texts.hideValues",
    "key": "filterbar.ADAPT_HIDE_VALUE",
    "value": "Hide Values"
  },
  {
    "prop": "texts.basic",
    "key": "p13nDialog.FILTER_DEFAULT_GROUP, adaptFiltersPanel.GROUP_DEFAULT, p13n.BASIC_DEFAULT_GROUP",
    "value": "Basic"
  },
  {
    "prop": "texts.selectAll",
    "key": "Application text; no matching component UI5 default",
    "value": "Select All"
  },
  {
    "prop": "texts.required",
    "key": "filterbar.REQUIRED_FILTER_VALUE_MISSING",
    "value": "{0} is a required field."
  },
  {
    "prop": "texts.invalidFilter",
    "key": "adaptFiltersPanel.COMBOBOX_VALUE_NOT_EXIST",
    "value": "Value \"{0}\" does not exist."
  },
  {
    "prop": "texts.added",
    "key": "p13nDialog.ADAPT_FILTER_ADD_ANNOUNCE, p13n.FILTERPANEL_ADDINGFILTER_ANNOUNCEMENT",
    "value": "Filter {0} added"
  },
  {
    "prop": "texts.removed",
    "key": "p13nDialog.ADAPT_FILTER_REMOVE_ANNOUNCE",
    "value": "Filter {0} removed"
  },
  {
    "prop": "texts.shown",
    "key": "p13nDialog.ADAPT_FILTER_VISIBLE_ANNOUNCE",
    "value": "Filter {0} is now visible"
  },
  {
    "prop": "texts.hidden",
    "key": "p13nDialog.ADAPT_FILTER_INVISIBLE_ANNOUNCE",
    "value": "Filter {0} is now hidden"
  },
  {
    "prop": "texts.reordered",
    "key": "p13n.REORDER_ANNOUNCEMENT",
    "value": "List Item with label {0} has been reordered"
  },
  {
    "prop": "texts.movedTop",
    "key": "p13n.REORDER_ANNOUNCEMENT_TOP",
    "value": "List Item with label {0} has been moved to top"
  },
  {
    "prop": "texts.movedUp",
    "key": "p13n.REORDER_ANNOUNCEMENT_UP",
    "value": "List Item with label {0} has been moved up"
  },
  {
    "prop": "texts.movedDown",
    "key": "p13n.REORDER_ANNOUNCEMENT_DOWN",
    "value": "List Item with label {0} has been moved down"
  },
  {
    "prop": "texts.movedBottom",
    "key": "p13n.REORDER_ANNOUNCEMENT_BOTTOM",
    "value": "List Item with label {0} has been moved to bottom"
  },
  {
    "prop": "texts.searchUpdate",
    "key": "Application text; no matching component UI5 default",
    "value": "Table {0} has been updated. {1}"
  },
  {
    "prop": "texts.oneItemAvailable",
    "key": "Application text; no matching component UI5 default",
    "value": "1 item available."
  },
  {
    "prop": "texts.itemsAvailable",
    "key": "Application text; no matching component UI5 default",
    "value": "{0} items available."
  },
  {
    "prop": "texts.noItemsAvailable",
    "key": "Application text; no matching component UI5 default",
    "value": "No items available."
  },
  {
    "prop": "texts.resetAnnouncement",
    "key": "p13n.POPUP_ANNOUNCEMENT_RESET",
    "value": "Filters have been reset to the initially selected view."
  },
  {
    "prop": "texts.resize",
    "key": "Application text; no matching component UI5 default",
    "value": "Drag and resize dialog"
  },
  {
    "prop": "texts.handleRoleDescription",
    "key": "Application text; no matching component UI5 default",
    "value": "Handle"
  },
  {
    "prop": "texts.dragResizeHint",
    "key": "Application text; no matching component UI5 default",
    "value": "Use Arrow keys to move, Shift+Arrow keys to resize"
  },
  {
    "prop": "texts.hiddenWithValue",
    "key": "adaptFiltersPanel.INFO_INVISIBLE_WITH_VALUE",
    "value": "The filter will not show in the filter bar."
  }
]

const base = fioriMeta({ name: "adapt-filters-dialog", component: AdaptFiltersDialog })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></>, story: { inline: false, height: "800px" } } },
  args: { open: false, filters, values: initialValues, visibleKeys: ["name", "country"], initialValues, initialVisibleKeys: ["name", "country"], p13nMode: ["item", "value"], defaultView: "list", defaultMode: "edit", defaultSearch: "", resetEnabled: false, modal: true, onOpenChange: fn(), onApply: fn(), onReset: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, values: { control: "object" }, visibleKeys: { control: "object" }, initialValues: { control: "object" }, initialVisibleKeys: { control: "object" }, p13nMode: { control: "check", options: ["item", "value"] }, defaultView: { control: "inline-radio", options: ["list", "group"] }, defaultMode: { control: "inline-radio", options: ["edit", "sort"] }, defaultSearch: { control: "text" }, resetEnabled: { control: "boolean" }, modal: { control: "boolean" }, contentWidth: { control: "text" }, contentHeight: { control: "text" }, texts: { control: "object" }, filters: { control: false }, defaultResetConfirmation: { control: "boolean" }, portal: { control: false }, onOpenChange: { control: false }, onApply: { control: false }, onReset: { control: false } },
  render: function ProductFilters(args: AdaptFiltersDialogProps) {
    const [, updateArgs] = useArgs<AdaptFiltersDialogProps>()
    return <div className="grid gap-3"><Button onClick={() => { args.onOpenChange(true); updateArgs({ open: true }) }}>Adapt product filters</Button><AdaptFiltersDialog key={`${args.defaultView}-${args.defaultMode}-${args.defaultSearch}-${args.defaultResetConfirmation}`} {...args} onOpenChange={(open) => { args.onOpenChange(open); updateArgs({ open }) }} onApply={(state) => { args.onApply(state); updateArgs({ values: state.values, visibleKeys: state.visibleKeys }) }} /><output>Visible filters: {args.visibleKeys.join(", ")}</output></div>
  },
} satisfies Meta<typeof AdaptFiltersDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const ListEdit: Story = { args: { open: true } }
export const ListSort: Story = { args: { open: true, defaultMode: "sort" } }
export const GroupView: Story = { args: { open: true, defaultView: "group" } }
export const NoResults: Story = { args: { open: true, defaultSearch: "Unknown filter" } }
export const ResetConfirmation: Story = { args: { open: true, defaultResetConfirmation: true } }
export const ItemsOnly: Story = { args: { open: true, p13nMode: ["item"] } }
export const ValuesOnly: Story = { args: { open: true, p13nMode: ["value"] } }
export const RequiredValue: Story = { args: { open: true, values: { name: [] } } }
export const HiddenActiveFilter: Story = { args: { open: true, values: { ...initialValues, city: [{ operator: "EQ", values: ["Berlin"] }] } } }
export const CustomTexts: Story = { args: { open: true, texts: { title: "Product filters", toolbarTitle: "Product values and visibility", search: "Find a product filter", ok: "Apply product filters", cancel: "Keep current filters", added: "Added product filter {0}", required: "Enter a value for {0}." } } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }
