import type { Meta, StoryObj } from "@storybook/react-vite"
import { Popover, PopoverContent, PopoverBody } from "@/components/ui/popover"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "popover", component: PopoverContent }) } satisfies Meta<typeof PopoverContent>
export default meta
type Story = StoryObj<typeof meta>

export const CustomHost: Story = { render: () => <Popover open><PopoverContent asChild portal={false} aria-label="Custom host popover" hideArrow><section><PopoverBody>Popover content</PopoverBody></section></PopoverContent></Popover> }
