import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { IllustratedMessage, type IllustratedMessageProps } from "@/components/ui/illustrated-message"
import { Button } from "@/components/ui/button"
import type { IllustrationData } from "@/lib/fiori-illustrations/types"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

// Include the complete installed illustration catalog. SVG size modules are strings;
// the named data modules expose all four sizes and their English UI5 defaults.
const modules = import.meta.glob<{ default: IllustrationData | string }>(["@/lib/fiori-illustrations/*.ts", "!@/lib/fiori-illustrations/types.ts"], { eager: true })
const illustrations = Object.fromEntries(Object.entries(modules).filter(([, module]) => typeof module.default === "object").map(([path, module]) => [path.split("/").at(-1)!.replace(/\.ts$/, ""), module.default as IllustrationData]))
const names = Object.keys(illustrations).sort()
type Args = IllustratedMessageProps & { illustrationName: string; actions: boolean; width: number; onAction: () => void }
// Source-backed defaults from registry/ui/illustrated-message.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "IllustratedMessage.titleText",
    "key": "Selected illustration title key (NoData: IM_TITLE_NODATA)",
    "value": "illustration.title (NoData: \"There's no data yet.\")"
  },
  {
    "prop": "IllustratedMessage.subtitleText",
    "key": "Selected illustration subtitle key (NoData: IM_SUBTITLE_NODATA)",
    "value": "illustration.subtitle (NoData: \"When there is, you'll see it here.\")"
  },
  {
    "prop": "IllustratedMessage.accessibleName",
    "key": "UI5 IllustratedMessageTemplate.js: name (not an i18n key)",
    "value": "illustration.name (NoData: \"NoData\")"
  }
]

const base = fioriMeta({ name: "illustrated-message", component: IllustratedMessage })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { illustrationName: "NoData", illustration: illustrations.NoData, design: "Auto", titleLevel: "H2", titleWrappingType: "Normal", decorative: false, actions: true, width: 480, onAction: fn() },
  argTypes: { ...base.argTypes, illustrationName: { control: "select", options: names, description: "All 118 Fiori and TNT illustration data modules." }, illustration: { control: false }, design: { control: "select", options: ["Auto", "Base", "Dot", "Spot", "Dialog", "Scene"] }, titleText: { control: "text" }, subtitleText: { control: "text" }, titleLevel: { control: "select", options: ["H1", "H2", "H3", "H4", "H5", "H6"] }, titleWrappingType: { control: "inline-radio", options: ["Normal", "None"] }, accessibleName: { control: "text" }, decorative: { control: "boolean" }, actions: { control: "boolean" }, width: { control: { type: "range", min: 120, max: 800, step: 10 } }, onAction: { control: false } },
  render: function IllustratedState(args: Args) {
    const [attempts, setAttempts] = React.useState(0)
    const { illustrationName, actions, width, onAction, ...props } = args
    return <div style={{ width }} className="max-w-full"><IllustratedMessage {...props} illustration={illustrations[illustrationName]}>{actions && <Button variant="emphasized" onClick={() => { onAction(); setAttempts((value) => value + 1) }}>Continue</Button>}</IllustratedMessage>{actions && <output>Continued {attempts} times</output>}</div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Scene: Story = { args: { design: "Scene", width: 704 } }
export const Dialog: Story = { args: { design: "Dialog", illustrationName: "UnableToLoad", width: 480 } }
export const Spot: Story = { args: { design: "Spot", illustrationName: "NoSearchResults", width: 352, actions: false } }
export const Dot: Story = { args: { design: "Dot", illustrationName: "Tent", width: 256, titleText: "No files found", subtitleText: "Drop files here", actions: false } }
export const Base: Story = { args: { design: "Base", illustrationName: "SuccessScreen", width: 160 } }
export const AutoSpot: Story = { args: { illustrationName: "SuccessScreen", width: 320 } }
export const AutoDot: Story = { args: { width: 240 } }
export const Patterns: Story = { args: { illustrationName: "SuccessBalloon", design: "Spot", width: 352 } }
export const TNT: Story = { args: { illustrationName: "TntSuccess", design: "Dialog", width: 480, titleText: "All set", subtitleText: "Your account is ready." } }
export const WithoutTitle: Story = { args: { titleText: null } }
export const WithoutSubtitle: Story = { args: { subtitleText: null } }
export const WithoutActions: Story = { args: { actions: false } }
export const Decorative: Story = { args: { decorative: true } }
export const CustomTexts: Story = { args: { titleText: "No purchase orders yet", subtitleText: "Create an order to get started.", accessibleName: "Empty purchase order list" } }
export const RTL: Story = { globals: { dir: "rtl" } }
