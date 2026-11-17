import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tag } from "@/components/ui/tag"
import { fioriMeta } from "../_lib/meta"

const meta = {
  ...fioriMeta({ name: "tag", component: Tag }),
  args: { design: "negative", children: "Delayed", interactive: false },
  argTypes: { texts: { control: false }, tagText: { control: "text" }, roleDescription: { control: "text" } },
} satisfies Meta<typeof Tag>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const CustomTexts: Story = { args: { texts: { tag: "Category marker", negative: "Unavailable" } } }
export const LegacyDescription: Story = { args: { tagText: "Legacy complete description", texts: { tag: "Ignored marker" } } }
export const German: Story = { globals: { locale: "de" } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" } }
