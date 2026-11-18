import type { Meta, StoryObj } from "@storybook/react-vite"
import { Popover, PopoverContent, PopoverBody } from "@/components/ui/popover"
import { fioriMeta } from "../_lib/meta"
const meta = { ...fioriMeta({ name: "popover", component: PopoverContent }) } satisfies Meta<typeof PopoverContent>
export default meta
type Story = StoryObj<typeof meta>

export const CustomHost: Story = { render: () => <Popover open><PopoverContent asChild portal={false} aria-label="Custom host popover" hideArrow><section><PopoverBody>Popover content</PopoverBody></section></PopoverContent></Popover> }
function ChildrenOnlyHost({ children }: React.ComponentProps<"div">) { return <section>{children}</section> }
export const ReactHost: Story = { render: () => <Popover open><PopoverContent asChild portal={false} aria-label="React host popover" hideArrow><ChildrenOnlyHost role="presentation" tabIndex={13}><PopoverBody>Popover content</PopoverBody></ChildrenOnlyHost></PopoverContent></Popover> }
export const RTLReactHost: Story = { ...ReactHost, globals: { dir: "rtl" } }
