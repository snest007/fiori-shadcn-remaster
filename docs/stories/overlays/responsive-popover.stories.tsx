import type { Meta, StoryObj } from "@storybook/react-vite"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "responsive-popover", component: ResponsivePopoverContent }) } satisfies Meta<typeof ResponsivePopoverContent>
export default meta
type Story = StoryObj<typeof meta>

export const CustomHost: Story = { render: () => <ResponsivePopover open><ResponsivePopoverContent asChild portal={false} aria-label="Custom responsive popup" headerText="Responsive title" phoneHeader={<span>Custom header</span>} phoneFooter={<button>Continue</button>}><section>Responsive content</section></ResponsivePopoverContent></ResponsivePopover> }
