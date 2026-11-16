import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ExpandableText, type ExpandableTextProps } from "@/components/ui/expandable-text"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = ExpandableTextProps & { showPopover: boolean }
const details = "Review the delivery details and confirm the purchase order. The supplier will receive a notification once approval is complete, and your team can track the shipment from the order overview."

// Source-backed defaults from registry/ui/expandable-text.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "ExpandableText.showMoreText",
    "key": "EXPANDABLE_TEXT_SHOW_MORE",
    "value": "Show More"
  },
  {
    "prop": "ExpandableText.showLessText",
    "key": "EXPANDABLE_TEXT_SHOW_LESS",
    "value": "Show Less"
  },
  {
    "prop": "ExpandableText.closeText",
    "key": "EXPANDABLE_TEXT_CLOSE",
    "value": "Close"
  },
  {
    "prop": "ExpandableText.showFullTextLabel",
    "key": "EXPANDABLE_TEXT_SHOW_MORE_POPOVER_ARIA_LABEL",
    "value": "Show the full text"
  },
  {
    "prop": "ExpandableText.closePopoverLabel",
    "key": "EXPANDABLE_TEXT_SHOW_LESS_POPOVER_ARIA_LABEL",
    "value": "Close the popover"
  },
  {
    "prop": "ExpandableText.emptyIndicatorLabel",
    "key": "EMPTY_INDICATOR_ACCESSIBLE_TEXT",
    "value": "Empty Value"
  }
]

const base = fioriMeta({ name: "expandable-text", component: ExpandableText })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { text: details, maxCharacters: 100, overflowMode: "InPlace", emptyIndicatorMode: "Off", defaultExpanded: false, showPopover: false },
  argTypes: { ...base.argTypes, text: { control: "text" }, maxCharacters: { control: "number" }, overflowMode: { control: "inline-radio", options: ["InPlace", "Popover"] }, emptyIndicatorMode: { control: "inline-radio", options: ["Off", "On"] }, defaultExpanded: { control: "boolean" }, showPopover: { control: false }, showMoreText: { control: "text" }, showLessText: { control: "text" }, closeText: { control: "text" }, showFullTextLabel: { control: "text" }, closePopoverLabel: { control: "text" }, emptyIndicatorLabel: { control: "text" } },
  render: function OrderDescription(args: Args) {
    const ref = React.useRef<HTMLDivElement>(null)
    const { showPopover, ...props } = args
    React.useEffect(() => { if (showPopover && args.overflowMode === "Popover") ref.current?.querySelector<HTMLElement>(".fiori-expandable-text__toggle[aria-expanded=false]")?.click() }, [showPopover, args.overflowMode])
    return <div className="max-w-md"><ExpandableText key={`${args.defaultExpanded}-${args.overflowMode}`} ref={ref} {...props} /></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Collapsed: Story = { args: {} }
export const Expanded: Story = { args: { defaultExpanded: true } }
export const ShortText: Story = { args: { text: "Delivery confirmed." } }
export const ThirtyCharacters: Story = { args: { maxCharacters: 30 } }
export const Trigger: Story = { args: { overflowMode: "Popover" }, parameters: { docs: { story: { inline: false, height: "400px" } } } }
export const Open: Story = { args: { overflowMode: "Popover", showPopover: true }, parameters: { docs: { story: { inline: false, height: "400px" } } } }
export const Popover: Story = { args: { overflowMode: "Popover" }, parameters: { docs: { story: { inline: false, height: "400px" } } } }
export const EmptyIndicator: Story = { args: { text: "", emptyIndicatorMode: "On" } }
export const Empty: Story = { args: { text: "" } }
export const CustomTexts: Story = { args: { showMoreText: "Read delivery details", showLessText: "Hide delivery details", closeText: "Close details", showFullTextLabel: "Read the full delivery description", closePopoverLabel: "Close delivery description", emptyIndicatorLabel: "No delivery details" } }
export const RTL: Story = { globals: { dir: "rtl" } }
