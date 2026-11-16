import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ObjectPage, ObjectPageHeader, ObjectPageHeaderFacet, ObjectPageSection, ObjectPageSubSection, type ObjectPageProps } from "@/components/ui/object-page"
import { DynamicPageTitle } from "@/components/ui/dynamic-page"
import { Avatar } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Form, FormItem } from "@/components/ui/form"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"
import { machine } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "object-page", component: ObjectPage })
const meta = {
  ...base,
  parameters: { ...base.parameters, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "600px" } } },
  args: { mode: "anchor", selectedSection: "general", showAnchorBar: true, anchorBarLabel: "Object sections", headerSnapped: false, headerPinned: false, hidePinButton: false, showFooter: false, onSelectedSectionChange: fn(), onTitleToggle: fn(), onPinButtonToggle: fn() },
  argTypes: { ...base.argTypes, mode: { control: "inline-radio", options: ["anchor", "tabs"] }, selectedSection: { control: "select", options: ["general", "assembly", "contact"] }, showAnchorBar: { control: "boolean" }, anchorBarLabel: { control: "text" }, headerSnapped: { control: "boolean" }, headerPinned: { control: "boolean" }, hidePinButton: { control: "boolean" }, showFooter: { control: "boolean" }, title: { control: false }, header: { control: false }, footer: { control: false }, texts: { control: false }, accessibilityAttributes: { control: false }, defaultSelectedSection: { control: false }, defaultHeaderPinned: { control: false }, defaultHeaderSnapped: { control: false }, scrollContainerRef: { control: false }, contentClassName: { control: false, table: { disable: true } }, onSelectedSectionChange: { control: false }, onTitleToggle: { control: false }, onPinButtonToggle: { control: false } },
  render: function RobotDetails(args: ObjectPageProps) {
    const [, updateArgs] = useArgs<ObjectPageProps>()
    return <ObjectPage {...args} className="h-screen" accessibilityAttributes={{ header: { role: "region", name: "Robot arm header" }, content: { role: "region", name: "Robot arm sections" } }} onSelectedSectionChange={(selectedSection) => { args.onSelectedSectionChange?.(selectedSection); updateArgs({ selectedSection }) }} onTitleToggle={(headerSnapped) => { args.onTitleToggle?.(headerSnapped); updateArgs({ headerSnapped }) }} onPinButtonToggle={(headerPinned) => { args.onPinButtonToggle?.(headerPinned); updateArgs({ headerPinned }) }} title={<DynamicPageTitle heading={<Title level="H1" size="H3">Robot Arm Series 9</Title>} snappedHeading={<Title level="H1" size="H4">Robot Arm Series 9</Title>} subheading={<Label>PO-48865</Label>} actions={<Toolbar aria-label="Robot arm actions" design="transparent"><ToolbarButton variant="emphasized">Edit</ToolbarButton><ToolbarButton>Delete</ToolbarButton></Toolbar>} />} header={<ObjectPageHeader accessibleName="Robot arm details" avatar={<Avatar size="L" shape="square" icon={machine} accessibleName="Robot arm" />}><ObjectPageHeaderFacet title="Manufacturer"><Text>Robotech</Text><Text>Orlando factory</Text></ObjectPageHeaderFacet><ObjectPageHeaderFacet title="Status"><Text>Delivery confirmed</Text></ObjectPageHeaderFacet></ObjectPageHeader>}><ObjectPageSection id="general" titleText="General information"><ObjectPageSubSection titleText="Order details"><Form layout="S1 M2 L2 XL2"><FormItem label={<Label showColon>Order ID</Label>}><Text>589946637</Text></FormItem><FormItem label={<Label showColon>Contract</Label>}><Text>10045876</Text></FormItem></Form></ObjectPageSubSection></ObjectPageSection><ObjectPageSection id="assembly" titleText="Assembly options"><ObjectPageSubSection titleText="Configuration"><div className="h-64 p-4"><Text>Six-axis robot arm with the default socket.</Text></div></ObjectPageSubSection><ObjectPageSubSection titleText="Notes"><div className="h-48 p-4"><Text>Assembly takes place at the Orlando factory.</Text></div></ObjectPageSubSection></ObjectPageSection><ObjectPageSection id="contact" titleText="Contact information"><ObjectPageSubSection titleText="Purchasing contact"><div className="h-72 p-4"><Text>Denise Smith, purchasing coordinator</Text></div></ObjectPageSubSection></ObjectPageSection></ObjectPage>
  },
} satisfies Meta<typeof ObjectPage>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Anchor: Story = {}
export const Snapped: Story = { args: { headerSnapped: true } }
export const Tabs: Story = { args: { mode: "tabs" } }
export const SelectedSection: Story = { args: { mode: "tabs", selectedSection: "assembly" } }
export const Pinned: Story = { args: { headerPinned: true } }
export const WithoutAnchorBar: Story = { args: { showAnchorBar: false } }
export const CustomTexts: Story = { args: { anchorBarLabel: "Robot arm information", texts: { expandHeader: "Show robot details", collapseHeader: "Hide robot details", pinHeader: "Keep robot details visible", unpinHeader: "Unpin robot details" } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/object-page.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "anchorBarLabel",
    "Application text; no matching UI5 key",
    "Sections"
  ],
  [
    "texts.headerExpanded",
    "DYNAMIC_PAGE_ARIA_LABEL_EXPANDED_HEADER",
    "Header Expanded"
  ],
  [
    "texts.headerSnapped",
    "DYNAMIC_PAGE_ARIA_LABEL_SNAPPED_HEADER",
    "Header Snapped"
  ],
  [
    "texts.expandHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_EXPAND_HEADER",
    "Expand Header"
  ],
  [
    "texts.collapseHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_SNAP_HEADER",
    "Collapse Header"
  ],
  [
    "texts.pinHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_PIN_HEADER",
    "Pin Header"
  ],
  [
    "texts.unpinHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_UNPIN_HEADER",
    "Unpin Header"
  ],
  [
    "texts.toggleHeader",
    "DYNAMIC_PAGE_ARIA_DESCR_TOGGLE_HEADER",
    "Toggle Header"
  ]
]
// Source: registry/items/object-page.json and registry/ui/object-page.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori object page floorplan layout: DynamicPage with object header (avatar, facets), sticky navigation bar with anchor (scroll spy) or tabs mode, sections and subsections on cards.",
  "usage": {
    "summary": "Compose one object’s categorized details with a dynamic header and anchor or tab navigation.",
    "useWhen": [
      "Read or edit one object’s details while moving between its categorized sections.",
      "Keep object identity, essential attributes and actions above related forms, item lists and notes.",
      "Use mode=\"anchor\" for a continuous page or mode=\"tabs\" to show one section at a time."
    ],
    "avoidWhen": [
      {
        "when": "Show only one section without editable header content or section navigation.",
        "use": [
          "dynamic-page",
          "page"
        ]
      },
      {
        "when": "Start from a complete display/edit page with sample fields, items, notes and Save/Cancel handling.",
        "use": [
          "object-page-floorplan"
        ]
      },
      {
        "when": "Find records with filters or keep a list beside its selected detail.",
        "use": [
          "list-report",
          "flexible-column-layout"
        ]
      },
      {
        "when": "Guide unfamiliar object creation through 3–8 validated steps and a review screen.",
        "use": [
          "wizard-page"
        ]
      },
      {
        "when": "Add noncritical contextual information beside existing object content instead of making it an object section.",
        "use": [
          "dynamic-side-content"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "anchorBarLabel names section navigation; section ids and titleText own tab-to-section relationships. Arrow keys, Home/End and Enter/Space follow Tabs. accessibilityAttributes names the dynamic page areas; texts names header controls. Anchor navigation and scroll spy update selectedSection."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/object-page"
  return <main><DocsTitle /><p>{guide.description}</p>
    <section aria-label="Install component"><div className="flex items-center gap-3"><pre><code>{command}</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{guide.usage.summary}</p><h2>When to use</h2><ul>{guide.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{guide.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}{entry.use.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><ul><li>{accessibilityNote}</li></ul></section>
    <section aria-label="Localization"><h2>Localization</h2>{textKeys.length ? <><p>Override these props for application terminology. Function texts receive their parameters in UI5 order.</p><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textKeys.map(([key, ui5, value]) => <tr key={key}><td><code>{key}</code></td><td>{ui5}</td><td>{value}</td></tr>)}</tbody></table></> : <p>Supply application labels and native accessible names through the component's content and aria props. The Direction toolbar applies RTL to each example.</p>}</section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Props</h2><ArgTypes />
    <h2>Variants and examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
