import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { MessageStrip } from "@/components/ui/message-strip"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { favorite } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"


// Source-backed defaults from registry/ui/message-strip.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "MessageStrip.closeButtonText (design=\"information\")",
    "value": "Close information message strip",
    "key": "MESSAGE_STRIP_CLOSE_BUTTON_INFORMATION"
  },
  {
    "prop": "MessageStrip.closeButtonText (design=\"positive\")",
    "value": "Close positive message strip",
    "key": "MESSAGE_STRIP_CLOSE_BUTTON_POSITIVE"
  },
  {
    "prop": "MessageStrip.closeButtonText (design=\"negative\")",
    "value": "Close negative message strip",
    "key": "MESSAGE_STRIP_CLOSE_BUTTON_NEGATIVE"
  },
  {
    "prop": "MessageStrip.closeButtonText (design=\"critical\")",
    "value": "Close critical message strip",
    "key": "MESSAGE_STRIP_CLOSE_BUTTON_CRITICAL"
  },
  {
    "prop": "MessageStrip.closeButtonText (design=\"color-set-1\")",
    "value": "Close custom message strip",
    "key": "MESSAGE_STRIP_CLOSE_BUTTON_CUSTOM"
  },
  {
    "prop": "MessageStrip.closeButtonText (design=\"color-set-2\")",
    "value": "Close custom message strip",
    "key": "MESSAGE_STRIP_CLOSE_BUTTON_CUSTOM"
  },
  {
    "prop": "MessageStrip.closableText",
    "key": "MESSAGE_STRIP_CLOSABLE",
    "value": "Closable"
  },
  {
    "prop": "MessageStrip.designText (design=\"information\")",
    "key": "MESSAGE_STRIP_INFORMATION",
    "value": "Information Message Strip"
  },
  {
    "prop": "MessageStrip.designText (design=\"positive\")",
    "key": "MESSAGE_STRIP_SUCCESS",
    "value": "Success Message Strip"
  },
  {
    "prop": "MessageStrip.designText (design=\"negative\")",
    "key": "MESSAGE_STRIP_ERROR",
    "value": "Error Message Strip"
  },
  {
    "prop": "MessageStrip.designText (design=\"critical\")",
    "key": "MESSAGE_STRIP_WARNING",
    "value": "Warning Message Strip"
  },
  {
    "prop": "MessageStrip.designText (design=\"color-set-1\")",
    "key": "MESSAGE_STRIP_CUSTOM",
    "value": "Custom Message Strip"
  },
  {
    "prop": "MessageStrip.designText (design=\"color-set-2\")",
    "key": "MESSAGE_STRIP_CUSTOM",
    "value": "Custom Message Strip"
  }
]

const base = fioriMeta({ name: "message-strip", component: MessageStrip })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { design: "information", colorScheme: 1, hideIcon: false, hideCloseButton: false, children: "Review the delivery date before submitting the order.", onClose: fn() },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, design: { control: "select", options: ["information", "positive", "negative", "critical", "color-set-1", "color-set-2"] }, colorScheme: { control: "select", options: [1,2,3,4,5,6,7,8,9,10] }, hideIcon: { control: "boolean" }, hideCloseButton: { control: "boolean" }, closeButtonText: { control: "text" }, designText: { control: "text" }, closableText: { control: "text" }, icon: { control: false }, onClose: { control: false } },
  render: function DismissibleMessage(args) { const [shown, setShown] = React.useState(true); React.useEffect(() => setShown(true), [args.design, args.children]); return <div className="grid max-w-xl gap-2">{shown ? <MessageStrip {...args} onClose={() => { args.onClose?.(); setShown(false) }} /> : <Button onClick={() => setShown(true)}>Restore message</Button>}</div> },
} satisfies Meta<typeof MessageStrip>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Information: Story = { args: { design: "information" } }
export const Positive: Story = { args: { design: "positive" } }
export const Negative: Story = { args: { design: "negative" } }
export const Critical: Story = { args: { design: "critical" } }
export const NoIcon: Story = { args: { hideIcon: true } }
export const NotClosable: Story = { args: { hideCloseButton: true } }
export const NoIconOrClose: Story = { args: { hideIcon: true, hideCloseButton: true } }
export const LongText: Story = { args: { design: "critical", children: "Review the delivery details and confirm the purchase order. The supplier will receive a notification once approval is complete, and your team can track the shipment from the order overview." } }
export const ColorSet1Scheme1: Story = { args: { design: "color-set-1", colorScheme: 1 } }
export const ColorSet1Scheme4: Story = { args: { design: "color-set-1", colorScheme: 4 } }
export const ColorSet1Scheme7: Story = { args: { design: "color-set-1", colorScheme: 7 } }
export const ColorSet1Scheme10: Story = { args: { design: "color-set-1", colorScheme: 10 } }
export const ColorSet2Scheme1: Story = { args: { design: "color-set-2", colorScheme: 1 } }
export const ColorSet2Scheme4: Story = { args: { design: "color-set-2", colorScheme: 4 } }
export const ColorSet2Scheme7: Story = { args: { design: "color-set-2", colorScheme: 7 } }
export const ColorSet2Scheme10: Story = { args: { design: "color-set-2", colorScheme: 10 } }
export const ColorSet1CustomIcon: Story = { args: { design: "color-set-1", colorScheme: 3, icon: <Icon icon={favorite} /> } }
export const ColorSet2CustomIcon: Story = { args: { design: "color-set-2", colorScheme: 5, icon: <Icon icon={favorite} /> } }
export const CustomTexts: Story = { args: { closeButtonText: "Dismiss order notice", designText: "Order information", closableText: "Can be dismissed" } }
export const RTL: Story = { globals: { dir: "rtl" } }
