import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs, useState as useStoryState } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Tree, TreeItem, TreeItemCustom, type TreeProps, type TreeItemType } from "@/components/ui/tree"
import { Button } from "@/components/ui/button"
import { document as documentIcon, folder } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = TreeProps & { collapsed?: boolean; itemType?: TreeItemType; disabledItem?: boolean; customItem?: boolean; empty?: boolean }
const base = fioriMeta({ name: "tree", component: Tree })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { value: [], selectionMode: "none", separators: "all", collapsed: false, itemType: "active", disabledItem: false, customItem: false, empty: false, "aria-label": "Files", onValueChange: fn(), onItemClick: fn(), onItemDelete: fn(), onItemToggle: fn() },
  argTypes: {
    ...base.argTypes,
    selectionMode: { control: "select", options: ["none", "single", "singleStart", "singleEnd", "singleAuto", "multiple", "delete"] }, value: { control: "object" }, defaultValue: { control: false }, separators: { control: "inline-radio", options: ["all", "inner", "none"] }, headerText: { control: "text" }, footerText: { control: "text" }, noDataText: { control: "text" }, expandText: { control: "text" }, collapseText: { control: "text" }, deleteText: { control: "text" },
    collapsed: { control: "boolean" }, itemType: { control: "select", options: ["active", "inactive", "inactiveSelectable"] }, disabledItem: { control: "boolean" }, customItem: { control: "boolean" }, empty: { control: "boolean" }, header: { control: false },
    onValueChange: { control: false }, onItemClick: { control: false }, onItemDelete: { control: false }, onItemToggle: { control: false },
  },
  render: function FilesTree(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { collapsed, itemType, disabledItem, customItem, empty, ...props } = args
    // Storybook 10.6 preview-api applyHooks: state in the same story render as
    // useArgs must use Storybook hooks so deletion rerenders its active context.
    const [removed, setRemoved] = useStoryState<string[]>([])
    return <Tree key={String(collapsed)} {...props} onValueChange={(value, detail) => { args.onValueChange?.(value, detail); updateArgs({ value }) }} onItemDelete={(value) => { args.onItemDelete?.(value); setRemoved((current) => [...current, value]) }}>
      {!empty && <>
        {!removed.includes("docs") && <TreeItem value="docs" text="Documents" icon={folder} type={itemType} defaultExpanded={!collapsed}>
          {!removed.includes("reports") && <TreeItem value="reports" text="Reports" icon={folder} defaultExpanded={!collapsed}>{!removed.includes("q1") && <TreeItem value="q1" text="Q1.pdf" icon={documentIcon} />}{!removed.includes("q2") && <TreeItem value="q2" text="Q2.pdf" icon={documentIcon} />}</TreeItem>}
          {!removed.includes("invoices") && <TreeItem value="invoices" text="Invoices" icon={folder}>{!removed.includes("jan") && <TreeItem value="jan" text="January.pdf" icon={documentIcon} />}</TreeItem>}
        </TreeItem>}
        {!removed.includes("pictures") && <TreeItem value="pictures" text="Pictures" icon={folder} hasChildren disabled={disabledItem} type={itemType} />}
        {!removed.includes("notes") && (customItem ? <TreeItemCustom value="notes" content={<div className="flex items-center gap-2"><span>Notes.txt</span><Button aria-label="Open Notes.txt" onClick={() => args.onItemClick?.("notes")}>Open</Button></div>} /> : <TreeItem value="notes" text="Notes.txt" icon={documentIcon} additionalText="2 KB" type={itemType} />)}
      </>}
    </Tree>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Expanded: Story = {}
export const Collapsed: Story = { args: { collapsed: true } }
export const HeaderFooter: Story = { args: { headerText: "Files", footerText: "Shared workspace" } }
export const Single: Story = { args: { selectionMode: "single", value: ["reports"] } }
export const SingleStart: Story = { args: { selectionMode: "singleStart", value: ["notes"] } }
export const SingleEnd: Story = { args: { selectionMode: "singleEnd", value: ["notes"] } }
export const SingleAuto: Story = { args: { selectionMode: "singleAuto", value: ["notes"] } }
export const Multiple: Story = { args: { selectionMode: "multiple", value: ["reports", "q2"] } }
export const Delete: Story = { args: { selectionMode: "delete" } }
export const ActiveItems: Story = { args: { itemType: "active" } }
export const InactiveItems: Story = { args: { itemType: "inactive" } }
export const InactiveSelectableItems: Story = { args: { itemType: "inactiveSelectable", selectionMode: "multiple" } }
export const DisabledItem: Story = { args: { disabledItem: true } }
export const CustomItem: Story = { args: { customItem: true, selectionMode: "multiple" } }
export const Empty: Story = { args: { empty: true, noDataText: "No files available" } }
export const NoSeparators: Story = { args: { separators: "none" } }
export const CustomTexts: Story = { args: { expandText: "Show folder contents", collapseText: "Hide folder contents", deleteText: "Remove file" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const LazyLoading: Story = { render: function LazyFiles() {
  const [files, setFiles] = React.useState<string[]>([])
  return <Tree aria-label="Lazy files"><TreeItem value="pictures" text="Pictures" icon={folder} hasChildren onExpandedChange={(expanded) => { if (expanded && !files.length) setFiles(["Beach.jpg", "City.jpg"]) }}>{files.map((name) => <TreeItem key={name} value={name} text={name} icon={documentIcon} />)}</TreeItem></Tree>
} }
export const Growing: Story = { render: function GrowingFiles() {
  const [count, setCount] = React.useState(3)
  return <div className="grid gap-2"><Tree aria-label="Files loaded by the application">{Array.from({ length: count }, (_, index) => <TreeItem key={index} value={`file-${index}`} text={`Report ${index + 1}.pdf`} icon={documentIcon} />)}</Tree><Button onClick={() => setCount((current) => current + 3)}>Load more files</Button></div>
} }

// Current defaults are read from registry/ui/tree.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "expandText",
    "text": "Expand Node",
    "key": "TREE_ITEM_EXPAND_NODE"
  },
  {
    "prop": "collapseText",
    "text": "Collapse Node",
    "key": "TREE_ITEM_COLLAPSE_NODE"
  },
  {
    "prop": "deleteText",
    "text": "Delete",
    "key": "DELETE"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}
