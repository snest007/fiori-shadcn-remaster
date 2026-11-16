import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tree, TreeItem, TreeItemCustom } from "@/components/ui/tree"
import { fioriMeta } from "../_lib/meta"

const meta = { ...fioriMeta({ name: "tree", component: Tree }), render: () => <Tree aria-label="Files"><TreeItem value="docs" text="Documents" defaultExpanded><TreeItem value="report" text="Report.pdf" /></TreeItem></Tree> } satisfies Meta<typeof Tree>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const AccessibleDescription: Story = { render: () => <Tree aria-label="Files" aria-description="Browse company documents"><TreeItem value="docs" text="Documents" aria-label="Document collection" aria-haspopup="dialog" /></Tree> }
export const RTLAccessibleDescription: Story = { ...AccessibleDescription, globals: { dir: "rtl" } }
export const CustomContentSelection: Story = { render: () => <Tree aria-label="Files" selectionMode="singleStart"><TreeItemCustom value="docs" content={<span>Custom documents</span>} defaultExpanded><TreeItem value="report" text="Report.pdf" /></TreeItemCustom></Tree> }
export const RTLCustomContentSelection: Story = { ...CustomContentSelection, globals: { dir: "rtl" } }
export const CustomTexts: Story = { render: () => <Tree aria-label="Files" selectionMode="multiple" texts={{ treeItem: "File node", active: "Opens a file", selected: "File selected", notSelected: "File deselected", expandText: "Open folder", collapseText: "Close folder" }}><TreeItem value="docs" text="Documents"><TreeItem value="report" text="Report.pdf" /></TreeItem></Tree> }
export const RTLCustomTexts: Story = { ...CustomTexts, globals: { dir: "rtl" } }
