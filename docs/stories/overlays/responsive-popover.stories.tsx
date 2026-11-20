import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger, type ResponsivePopoverContentProps, type ResponsivePopoverProps } from "@/components/ui/responsive-popover"
import { PopoverHeader, PopoverTitle } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useIsPhone } from "@/lib/use-is-phone"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = ResponsivePopoverProps & Pick<ResponsivePopoverContentProps, "headerText" | "closeLabel" | "side" | "align" | "hideArrow" | "phoneField" | "preventFocusRestore"> & { phone?: boolean; customHeader: boolean; footer: boolean }
// Source-backed defaults from registry/ui/responsive-popover.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "ResponsivePopoverContent.headerText",
    "key": "Application text; no matching component UI5 default",
    "value": ""
  },
  {
    "prop": "ResponsivePopoverContent.closeLabel",
    "key": "RESPONSIVE_POPOVER_CLOSE_DIALOG_BUTTON",
    "value": "Decline"
  }
]

const base = fioriMeta({ name: "responsive-popover", component: ResponsivePopover })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></>, story: { inline: false, height: "480px" } } },
  args: { open: false, headerText: "Delivery information", footer: true, customHeader: false, phoneField: false, preventFocusRestore: false, side: "bottom", align: "start", hideArrow: false, onOpenChange: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, modal: { control: "boolean" }, phone: { control: false, table: { disable: true } }, headerText: { control: "text" }, closeLabel: { control: "text" }, customHeader: { control: "boolean" }, footer: { control: "boolean" }, phoneField: { control: "boolean" }, preventFocusRestore: { control: "boolean" }, side: { control: "select", options: ["top", "right", "bottom", "left"] }, align: { control: "inline-radio", options: ["start", "center", "end"] }, hideArrow: { control: "boolean" }, onOpenChange: { control: false }, dir: { control: false } },
  render: function ResponsiveDelivery(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    // Device forcing belongs only to the isolated Phone/Desktop examples. The
    // inline Playground follows the real device and keeps Controls in its store.
    React.useLayoutEffect(() => { if (args.phone === undefined) return; const previous = document.documentElement.dataset.fioriDevice; document.documentElement.dataset.fioriDevice = args.phone ? "phone" : "desktop"; return () => { if (previous === undefined) delete document.documentElement.dataset.fioriDevice; else document.documentElement.dataset.fioriDevice = previous } }, [args.phone])
    const phone = useIsPhone()
    const { phone: _phoneOverride, customHeader, footer, headerText, closeLabel, phoneField, preventFocusRestore, side, align, hideArrow, ...props } = args
    const close = () => { args.onOpenChange?.(false); updateArgs({ open: false }) }
    return <ResponsivePopover {...props} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}><ResponsivePopoverTrigger asChild><Button>View delivery information</Button></ResponsivePopoverTrigger><ResponsivePopoverContent headerText={headerText} closeLabel={closeLabel} aria-label={headerText} side={side} align={align} hideArrow={hideArrow} phoneField={phoneField} preventFocusRestore={preventFocusRestore} phoneHeader={customHeader ? <div className="flex w-full items-center justify-between"><span>{headerText}</span><Button onClick={close}>Done</Button></div> : undefined} phoneFooter={footer ? <Button variant="emphasized" onClick={close}>Confirm</Button> : undefined} className={phone ? undefined : "w-72"}>{!phone && <PopoverHeader><PopoverTitle>{headerText}</PopoverTitle></PopoverHeader>}<p>The warehouse accepts deliveries from Monday to Friday.</p>{!phone && footer && <Button onClick={close}>Done</Button>}</ResponsivePopoverContent></ResponsivePopover>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const Desktop: Story = { args: { open: true, phone: false } }
export const Phone: Story = { args: { open: true, phone: true } }
export const CustomPhoneHeader: Story = { args: { open: true, phone: true, customHeader: true } }
export const WithoutFooter: Story = { args: { open: true, phone: true, footer: false } }
export const FieldSurface: Story = { args: { open: true, phone: true, phoneField: true } }
export const CustomTexts: Story = { args: { open: true, phone: true, headerText: "Receiving information", closeLabel: "Close receiving information" } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }
export const PhoneRTL: Story = { args: { open: true, phone: true }, globals: { dir: "rtl" } }

export const CustomHost: Story = { render: () => <ResponsivePopover open><ResponsivePopoverContent asChild portal={false} aria-label="Custom responsive popup" headerText="Responsive title" phoneHeader={<span>Custom header</span>} phoneFooter={<button>Continue</button>}><section>Responsive content</section></ResponsivePopoverContent></ResponsivePopover> }
