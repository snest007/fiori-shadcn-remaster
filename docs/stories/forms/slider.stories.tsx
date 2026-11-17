import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Slider, RangeSlider, type SliderProps, type RangeSliderProps } from "@/components/ui/slider"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = Omit<SliderProps, "defaultValue" | "value" | "onValueChange" | "onValueCommit"> & Pick<RangeSliderProps, "startHandleDescription" | "endHandleDescription" | "rangeDescription" | "rangeValueText"> & { range?: boolean; value: number | [number, number]; onValueChange?: (value: number | [number, number]) => void; onValueCommit?: (value: number | [number, number]) => void }
const base = fioriMeta({ name: "slider", component: Slider as React.ComponentType<Args> })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "handleDescription",
    "SLIDER_ARIA_DESCRIPTION",
    "Slider handle"
  ],
  [
    "RangeSlider.startHandleDescription",
    "RANGE_SLIDER_START_HANDLE_DESCRIPTION",
    "Minimum"
  ],
  [
    "RangeSlider.endHandleDescription",
    "RANGE_SLIDER_END_HANDLE_DESCRIPTION",
    "Maximum"
  ],
  [
    "RangeSlider.rangeDescription",
    "RANGE_SLIDER_ARIA_DESCRIPTION",
    "Range"
  ],
  [
    "RangeSlider.rangeValueText",
    "RangeSliderTemplate.js accessible value",
    "From {0} to {1}"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { value: 40, range: false, min: 0, max: 100, step: 1, showTickmarks: false, labelInterval: 0, showTooltip: true, disabled: false, "aria-label": "Order volume", onValueChange: fn(), onValueCommit: fn() },
  argTypes: { ...base.argTypes, value: { control: "object" }, range: { control: "boolean", description: "Use a RangeSlider with two bounds." }, min: { control: "number" }, max: { control: "number" }, step: { control: "number" }, showTickmarks: { control: "boolean" }, labelInterval: { control: "number" }, showTooltip: { control: "boolean" }, disabled: { control: "boolean" }, handleDescription: { control: "text" }, startHandleDescription: { control: "text" }, endHandleDescription: { control: "text" }, rangeDescription: { control: "text" }, rangeValueText: { control: false }, onValueChange: { control: false }, onValueCommit: { control: false } },
  render: function OrderVolume(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { range, value, onValueChange, onValueCommit, handleDescription, startHandleDescription, endHandleDescription, rangeDescription, rangeValueText, ...props } = args
    const change = (next: number | [number, number]) => { onValueChange?.(next); updateArgs({ value: next }) }
    return <div className="w-full max-w-lg">{range
      ? <RangeSlider {...props} value={Array.isArray(value) ? value : [value, props.max ?? 100]} onValueChange={change} onValueCommit={onValueCommit} startHandleDescription={startHandleDescription} endHandleDescription={endHandleDescription} rangeDescription={rangeDescription} rangeValueText={rangeValueText} />
      : <Slider {...props} value={Array.isArray(value) ? value[0] : value} onValueChange={change} onValueCommit={onValueCommit} handleDescription={handleDescription} />}</div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Minimum: Story = { args: { value: 0 } }
export const Maximum: Story = { args: { value: 100 } }
export const Tickmarks: Story = { args: { min: 0, max: 10, value: 3, showTickmarks: true } }
export const Labels: Story = { args: { min: 0, max: 10, value: 6, showTickmarks: true, labelInterval: 2 } }
export const Disabled: Story = { args: { value: 30, disabled: true } }
export const WithoutTooltip: Story = { args: { showTooltip: false } }
export const Range: Story = { args: { range: true, value: [20, 70] } }
export const RangeTickmarks: Story = { args: { range: true, value: [2, 6], min: 0, max: 10, showTickmarks: true, labelInterval: 5 } }
export const RangeDisabled: Story = { args: { range: true, value: [10, 50], disabled: true } }
export const CustomTexts: Story = { args: { handleDescription: "Requested volume", range: true, value: [20, 70], startHandleDescription: "Minimum order", endHandleDescription: "Maximum order", rangeDescription: "Order volume range", rangeValueText: (start, end) => `${start} through ${end} units per order` } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const RangeRTL: Story = { args: { range: true, value: [20, 70] }, globals: { dir: "rtl" } }
