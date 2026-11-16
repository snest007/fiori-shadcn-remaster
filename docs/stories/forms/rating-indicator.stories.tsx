import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { RatingIndicator, type RatingIndicatorProps } from "@/components/ui/rating-indicator"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "rating-indicator", component: RatingIndicator })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "roleDescription",
    "RATING_INDICATOR_TEXT",
    "Rating Indicator"
  ],
  [
    "requiredText",
    "RATING_INDICATOR_ARIA_DESCRIPTION",
    "Required"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { value: 3, max: 5, size: "M", disabled: false, readOnly: false, displayOnly: false, required: false, "aria-label": "Product rating", onValueChange: fn() },
  argTypes: { ...base.argTypes, value: { control: "number" }, max: { control: "number" }, size: { control: "select", options: ["S", "M", "L"] }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, displayOnly: { control: "boolean" }, required: { control: "boolean" }, ratedIcon: { control: false }, unratedIcon: { control: false }, roleDescription: { control: "text" }, requiredText: { control: "text" }, onValueChange: { control: false } },
  render: function ProductRating(args: RatingIndicatorProps) {
    const [, updateArgs] = useArgs<RatingIndicatorProps>()
    return <RatingIndicator {...args} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} />
  },
} satisfies Meta<typeof RatingIndicator>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Empty: Story = { args: { value: 0 } }
export const HalfStar: Story = { args: { value: 2.5 } }
export const SevenStars: Story = { args: { value: 4, max: 7 } }
export const Small: Story = { args: { size: "S" } }
export const Medium: Story = { args: { size: "M" } }
export const Large: Story = { args: { size: "L" } }
export const Disabled: Story = { args: { value: 2, disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const DisplayOnly: Story = { args: { value: 3.5, displayOnly: true } }
export const Required: Story = { args: { required: true } }
export const CustomTexts: Story = { args: { required: true, roleDescription: "Product evaluation", requiredText: "A rating is required before submitting your review." } }
export const RTL: Story = { globals: { dir: "rtl" } }
