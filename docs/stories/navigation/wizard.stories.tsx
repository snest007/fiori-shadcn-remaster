import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Wizard, WizardStep, type WizardProps } from "@/components/ui/wizard"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { product, hint, activate, accept } from "@/lib/fiori-icons"
import { docsLink, fioriMeta } from "../_lib/meta"
type Args = WizardProps & { icons: boolean; allEnabled: boolean; branching: boolean }
const steps = [{ value: "type", title: "Product type", icon: product }, { value: "information", title: "Product information", icon: hint }, { value: "options", title: "Options", icon: activate }, { value: "pricing", title: "Pricing", icon: accept }]
const base = fioriMeta({ name: "wizard", component: Wizard })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { selectedStep: "type", contentLayout: "multipleSteps", stepSwitchThreshold: 0.7, accessibleName: "Create product", icons: true, allEnabled: false, branching: false, onStepChange: fn() },
  argTypes: { ...base.argTypes, selectedStep: { control: "select", options: ["type", "information", "options", "pricing"] }, contentLayout: { control: "inline-radio", options: ["multipleSteps", "singleStep"] }, stepSwitchThreshold: { control: { type: "number", min: 0.5, max: 1, step: 0.1 } }, accessibleName: { control: "text" }, icons: { control: "boolean" }, allEnabled: { control: "boolean" }, branching: { control: "boolean" }, texts: { control: false }, defaultSelectedStep: { control: false }, onStepChange: { control: false } },
  render: function ProductWizard(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [reached, setReached] = React.useState(1)
    const current = steps.findIndex((step) => step.value === args.selectedStep)
    const { icons, allEnabled, branching, ...props } = args
    return <div className="h-[28rem]"><Wizard {...props} onStepChange={(selectedStep, detail) => { args.onStepChange?.(selectedStep, detail); updateArgs({ selectedStep }) }}>{steps.map((step, index) => <WizardStep key={step.value} value={step.value} titleText={step.title} subtitleText={index === 1 ? "Optional" : undefined} icon={icons ? step.icon : undefined} disabled={!allEnabled && index > Math.max(reached, current)} branching={branching && index === 1}><div className="grid gap-3 p-4"><h2>{step.title}</h2><Label htmlFor={`wizard-story-${step.value}`}>{step.title} details</Label><Input id={`wizard-story-${step.value}`} placeholder="Enter details" />{index < 3 && <Button onClick={() => { setReached((previous) => Math.max(previous, index + 1)); updateArgs({ selectedStep: steps[index + 1].value }) }}>Continue to {steps[index + 1].title.toLowerCase()}</Button>}</div></WizardStep>)}</Wizard></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const IconsFirstStep: Story = {}
export const IconsSecondStep: Story = { args: { selectedStep: "information" } }
export const Numbers: Story = { args: { icons: false, branching: true, selectedStep: "information" } }
export const AllEnabled: Story = { args: { allEnabled: true, selectedStep: "pricing" } }
export const SingleStep: Story = { args: { contentLayout: "singleStep" } }
export const Narrow: Story = { args: { allEnabled: true, selectedStep: "options" }, decorators: [(Story) => <div className="w-[32rem] max-w-full"><Story /></div>] }
export const CustomTexts: Story = { args: { texts: { wizard: "Product creation", navigation: "Creation progress", steps: "Product creation steps", activateHint: "Press Enter to open a completed step", cancel: "Return to creation", stepLabel: (number, title, enabled, optional) => `Step ${number} ${title ?? ""} ${enabled ? "available" : "unavailable"}${optional ? ", optional" : ""}`, stepContentLabel: (number, title) => `Product creation step ${number}: ${title ?? ""}` } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/wizard.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.wizard",
    "Application region label; no matching UI5 key",
    "Wizard"
  ],
  [
    "texts.navigation",
    "WIZARD_NAV_ARIA_LABEL",
    "Wizard Progress Bar"
  ],
  [
    "texts.steps",
    "WIZARD_LIST_ARIA_LABEL",
    "Wizard Steps"
  ],
  [
    "texts.activateHint",
    "WIZARD_LIST_ARIA_DESCRIBEDBY",
    "To activate, press the space bar or Enter"
  ],
  [
    "texts.stepLabel",
    "WIZARD_STEP_ARIA_LABEL / WIZARD_STEP_ACTIVE / WIZARD_STEP_INACTIVE / WIZARD_OPTIONAL_STEP_ARIA_LABEL",
    "Step {number} {title} Active|Inactive Optional"
  ],
  [
    "texts.stepContentLabel",
    "WIZARD_NAV_STEP_DEFAULT_HEADING + number/title",
    "Step {0} {1}"
  ],
  [
    "texts.cancel",
    "WIZARD_CANCEL_BUTTON",
    "Cancel"
  ]
]
// Source: registry/items/wizard.json and registry/ui/wizard.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori wizard: step tabs (number or icon, title, subtitle, separators) over scrolling step contents; keyboard tab navigation, scroll-to-step, disabled future steps, collapsed step stacks (ui5-wizard).",
  "usage": {
    "summary": "Guide users through a task in reachable steps inside an existing page or custom workflow.",
    "useWhen": [
      "Help users complete a complex task by dividing it into guided steps; a wizard page typically has 3–8 steps.",
      "Let users revisit reached steps while the application keeps unreached steps disabled until their prerequisites are met.",
      "Use contentLayout=\"multipleSteps\" to stack reached sections or \"singleStep\" to show only the selected section."
    ],
    "avoidWhen": [
      {
        "when": "Start from a complete page with step validation, footer actions and a review/submit screen.",
        "use": [
          "wizard-page"
        ]
      },
      {
        "when": "Edit fields together without needing a guided step sequence.",
        "use": [
          "form"
        ]
      },
      {
        "when": "Browse independent content facets without controlling task progress.",
        "use": [
          "tabs"
        ]
      },
      {
        "when": "Narrow a result collection by filter criteria rather than complete a guided task.",
        "use": [
          "filter-bar"
        ]
      },
      {
        "when": "Trigger a standalone action without collecting inputs or tracking task steps.",
        "use": [
          "button"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "accessibleName names the wizard region; texts names progress navigation, step lists and content regions. Arrow keys and Home/End move through enabled steps; Enter/Space activates. Disabled future steps stay unavailable; grouped narrow steps use a named popover."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/wizard"
  return <main><DocsTitle /><p>{guide.description}</p>
    <section aria-label="Install component"><div className="flex items-center gap-3"><pre><code>{command}</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{guide.usage.summary}</p><h2>When to use</h2><ul>{guide.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{guide.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}{entry.use.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><ul><li>{accessibilityNote}</li></ul></section>
    <section aria-label="Localization"><h2>Localization</h2>{textKeys.length ? <><p>Override these props for application terminology. Function texts receive their parameters in UI5 order.</p><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textKeys.map(([key, ui5, value]) => <tr key={key}><td><code>{key}</code></td><td>{ui5}</td><td>{value}</td></tr>)}</tbody></table></> : <p>Supply application labels and native accessible names through the component's content and aria props. The Direction toolbar applies RTL to each example.</p>}</section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Props</h2><ArgTypes />
    <h2>Variants and examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
