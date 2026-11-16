import * as React from "react"

import { Tree, TreeItem } from "@/components/ui/tree"
import { document as documentIcon, folder } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function TreeDemo() {
  const [selected, setSelected] = React.useState<string[]>([])
  const [lazy, setLazy] = React.useState<string[] | null>(null)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Tree id="tree-demo" headerText="Files" selectionMode="multiple" value={selected} onValueChange={setSelected} footerText={`${selected.length} selected`}>
        <TreeItem value="docs" text="Documents" icon={folder} defaultExpanded>
          <TreeItem value="reports" text="Reports" icon={folder}>
            <TreeItem value="q1" text="Q1.pdf" icon={documentIcon} />
            <TreeItem value="q2" text="Q2.pdf" icon={documentIcon} />
          </TreeItem>
          <TreeItem value="invoices" text="Invoices" icon={folder}>
            <TreeItem value="jan" text="Jan.pdf" icon={documentIcon} />
          </TreeItem>
        </TreeItem>
        <TreeItem value="pics" text="Pictures" icon={folder} hasChildren onExpandedChange={(e) => e && !lazy && setLazy(["Beach.jpg", "City.jpg"])}>
          {lazy?.map((x) => <TreeItem key={x} value={x} text={x} icon={documentIcon} />)}
        </TreeItem>
        <TreeItem value="notes" text="Notes.txt" icon={documentIcon} additionalText="2 KB" />
      </Tree>
      <Tree id="tree-demo-single" aria-label="Regions" selectionMode="singleStart" defaultValue={["emea"]}>
        <TreeItem value="emea" text="EMEA" defaultExpanded>
          <TreeItem value="de" text="Germany" />
          <TreeItem value="fr" text="France" />
        </TreeItem>
        <TreeItem value="apac" text="APAC">
          <TreeItem value="cn" text="China" />
        </TreeItem>
      </Tree>
      <Tree id="tree-demo-texts" aria-label="Custom file tree" selectionMode="multiple" texts={{ treeItem: "File node", active: "Opens a file", selected: "File selected", notSelected: "File deselected", expandText: "Open folder", collapseText: "Close folder" }}>
        <TreeItem value="docs" text="Documents"><TreeItem value="report" text="Report.pdf" /></TreeItem>
      </Tree>
    </div>
  )
}

export default defineDemo({
  category: "Data",
  docs: [
    {
      name: "tree",
      description: "Hierarchical lists with selection and caller-managed expansion.",
      props: [
        { name: "Tree.value", type: "string[]", description: "Controlled selected node values." },
        { name: "Tree.onValueChange", type: "(value: string[], detail: { item: string; selected: boolean }) => void", description: "Receive selection values and the changed node." },
        { name: "Tree.selectionMode", type: "ListSelectionMode", description: "Selection or delete model.", defaultValue: "none" },
        { name: "Tree.onItemToggle", type: "(value: string, expanded: boolean) => void", description: "Receive node expansion changes." },
        { name: "TreeItem.hasChildren", type: "boolean", description: "Show expansion for a lazily populated node." },
      ],
    },
  ],
 title: "Tree", order: 37, Demo: TreeDemo })
