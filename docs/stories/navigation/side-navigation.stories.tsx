import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn, expect, userEvent, waitFor, within } from "storybook/test"
import { SideNavigation, SideNavigationGroup, SideNavigationItem, SideNavigationSubItem, type SideNavigationProps } from "@/components/ui/side-navigation"
import { Tag } from "@/components/ui/tag"
import { actionSettings, building, calendar, chainLink, customer, group, history, home, product, sysHelp } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
type Args = SideNavigationProps & { flat: boolean; overflow: boolean; disabledGroup: boolean }
const base = fioriMeta({ name: "side-navigation", component: SideNavigation })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { accessibleName: "Application navigation", collapsed: false, value: "team", flat: false, overflow: false, disabledGroup: false, onValueChange: fn(), onItemClick: fn(), onItemToggle: fn() },
  argTypes: { ...base.argTypes, collapsed: { control: "boolean" }, accessibleName: { control: "text" }, value: { control: "select", options: ["home", "people", "team", "other", "products", "archived", "history", "settings", "page-1", "page-10", "page-9-detail"] }, flat: { control: "boolean" }, overflow: { control: "boolean" }, disabledGroup: { control: "boolean" }, header: { control: false }, fixedItems: { control: false }, texts: { control: false }, defaultValue: { control: false }, onValueChange: { control: false }, onItemClick: { control: false }, onItemToggle: { control: false } },
  render: function BusinessNavigation(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { flat, overflow, disabledGroup, ...props } = args
    return <div className={overflow ? "flex h-72" : "flex h-[28rem]"}><SideNavigation {...props} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} fixedItems={!overflow ? <><SideNavigationItem text="Legal" value="legal" icon={sysHelp} unselectable><SideNavigationSubItem text="Terms" value="terms" /><SideNavigationSubItem text="Privacy" value="privacy" /></SideNavigationItem><SideNavigationItem text="Settings" value="settings" icon={actionSettings} /></> : undefined}>{overflow ? Array.from({ length: 10 }, (_, index) => <SideNavigationItem key={index} text={`Page ${index + 1}`} value={`page-${index + 1}`} icon={index === 0 ? home : product}>{index === 8 && <SideNavigationSubItem text="Page 9 detail" value="page-9-detail" />}</SideNavigationItem>) : <><SideNavigationItem text="Home" value="home" icon={home} />{flat ? <><SideNavigationItem text="Customers" value="customers" icon={customer}><SideNavigationSubItem text="Active" value="active" /><SideNavigationSubItem text="Archived" value="archived" /></SideNavigationItem><SideNavigationItem text="Products" value="products" icon={product} tag={<Tag>New</Tag>} /><SideNavigationItem text="Unselectable parent" value="parent" icon={calendar} unselectable defaultExpanded><SideNavigationSubItem text="Child A" value="a" /><SideNavigationSubItem text="Child B" value="b" /></SideNavigationItem></> : <><SideNavigationGroup text="People and places" defaultExpanded disabled={disabledGroup}><SideNavigationItem text="People" value="people" icon={group} defaultExpanded><SideNavigationSubItem text="From my team" value="team" /><SideNavigationSubItem text="From other teams" value="other" /></SideNavigationItem><SideNavigationItem text="Locations" value="locations" icon={building} disabled /><SideNavigationItem text="Events" value="events" icon={calendar}><SideNavigationSubItem text="Local" value="local" /></SideNavigationItem></SideNavigationGroup><SideNavigationGroup text="Activity"><SideNavigationItem text="History" value="history" icon={history} /></SideNavigationGroup></>}<SideNavigationItem text="External" value="external" icon={chainLink} href="#external" target="_blank" /></>}</SideNavigation></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Expanded: Story = {}
export const Collapsed: Story = { args: { collapsed: true } }
export const Flat: Story = { args: { flat: true, value: "products" } }
export const ParentSelected: Story = { args: { flat: true, value: "archived" } }
export const CollapsedFlat: Story = { args: { flat: true, collapsed: true, value: "archived" } }
export const DisabledGroup: Story = { args: { disabledGroup: true, value: "home" } }
export const Overflow: Story = { args: { collapsed: true, overflow: true, value: "page-1" }, decorators: [(Story) => <div className="w-24 max-w-full"><Story /></div>] }
export const OverflowSelected: Story = { ...Overflow, args: { collapsed: true, overflow: true, value: "page-10" } }
export const OverflowSubSelected: Story = { ...Overflow, args: { collapsed: true, overflow: true, value: "page-9-detail" } }
export const OverflowGroups: Story = { args: { collapsed: true, value: "history" }, decorators: [(Story) => <div className="w-24 h-72 overflow-hidden [&>div]:h-full"><Story /></div>] }
export const Open: Story = { args: { collapsed: true, overflow: true, value: "page-1" }, decorators: [(Story) => <div className="w-24 max-w-full"><Story /></div>], parameters: { docs: { story: { inline: false, height: "460px" } } }, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvas.getByRole("menuitem", { name: "More Items" })).toBeVisible()); await userEvent.click(canvas.getByRole("menuitem", { name: "More Items" })); await expect(within(canvasElement.ownerDocument.body).getByRole("menu", { name: "Additional Navigation Items" })).toBeVisible() } }
export const CustomTexts: Story = { args: { texts: { primaryListLabel: "Business areas", fixedListLabel: "Application settings", expandText: "Show child pages", collapseText: "Hide child pages", popoverLabel: "Business pages", overflowText: "Other pages", overflowMenuLabel: "Other business pages" } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/side-navigation.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.primaryListLabel",
    "SIDE_NAVIGATION_FLEXIBLE_LIST_LABEL",
    "Primary Navigation Menu"
  ],
  [
    "texts.fixedListLabel",
    "SIDE_NAVIGATION_FIXED_LIST_LABEL",
    "Footer Navigation Menu"
  ],
  [
    "texts.listRoleDescription",
    "SIDE_NAVIGATION_LIST_ARIA_ROLE_DESC",
    "Navigation List Tree"
  ],
  [
    "texts.collapsedListRoleDescription",
    "SIDE_NAVIGATION_COLLAPSED_LIST_ARIA_ROLE_DESC",
    "Navigation List Menu Bar"
  ],
  [
    "texts.expandText",
    "SIDE_NAVIGATION_ICON_EXPAND",
    "Expand"
  ],
  [
    "texts.collapseText",
    "SIDE_NAVIGATION_ICON_COLLAPSE",
    "Collapse"
  ],
  [
    "texts.popoverLabel",
    "SIDE_NAVIGATION_POPOVER_HIDDEN_TEXT",
    "Navigation"
  ],
  [
    "texts.overflowText",
    "SIDE_NAVIGATION_OVERFLOW_ACCESSIBLE_NAME",
    "More Items"
  ],
  [
    "texts.overflowDescription",
    "SIDE_NAVIGATION_OVERFLOW_ITEM_LABEL",
    "Displays additional navigation items that are hidden due to limited screen space."
  ],
  [
    "texts.overflowMenuLabel",
    "NAVIGATION_MENU_POPOVER_HIDDEN_TEXT",
    "Additional Navigation Items"
  ],
  [
    "texts.overflowParentDescription",
    "NAVIGATION_MENU_SELECTABLE_ITEM_HIDDEN_TEXT",
    "This menu item opens a submenu and also links to a page. To go to the page, press Enter or the right arrow key to open the submenu, then select the first item in the submenu."
  ],
  [
    "texts.parentItemDescription",
    "SIDE_NAVIGATION_PARENT_ITEM_SELECTABLE_DESCRIPTION",
    "To navigate to navigation item {0}, press Spacebar or Enter."
  ]
]
// Source: registry/items/side-navigation.json and registry/ui/side-navigation.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori side navigation: groups, items and sub-items as a keyboard tree; collapsed icon mode with sub-item popovers and a height-aware overflow menu; fixed footer items (ui5-side-navigation).",
  "usage": {
    "summary": "Provide the main navigation between modules or destinations within a product.",
    "useWhen": [
      "Let users move between multiple application destinations from a persistent vertical navigation.",
      "Group related destinations and expose sub-items when the navigation has a hierarchy.",
      "Label the first destination Home and link it to the entry page; keep any footer action focused on the essential task."
    ],
    "avoidWhen": [
      {
        "when": "Switch facets of content within one page rather than application destinations.",
        "use": [
          "tabs"
        ]
      },
      {
        "when": "Switch to a different product rather than navigate within the current one.",
        "use": [
          "product-switch"
        ]
      },
      {
        "when": "Show the current location and return to ancestors in its navigation path.",
        "use": [
          "breadcrumbs"
        ]
      },
      {
        "when": "Arrange the shell, navigation and content regions rather than provide navigation items.",
        "use": [
          "navigation-layout"
        ]
      },
      {
        "when": "Offer only a single navigation target.",
        "use": []
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "accessibleName names the nav; texts names primary/fixed trees or menubars and collapsed popovers. Selection uses aria-current, children use aria-expanded. One Tab stop enters each list; arrows navigate, expand or collapse (mirrored in RTL), Home/End jump and Enter/Space activate."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/side-navigation"
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
