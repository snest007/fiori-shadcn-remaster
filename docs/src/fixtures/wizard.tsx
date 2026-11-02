import { Text } from "@/components/ui/text"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import * as icons from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

export type StepSpec = { title?: string; subtitle?: string; icon?: "product" | "hint" | "activate" | "accept"; disabled?: boolean; branching?: boolean }
type Props = { steps: StepSpec[]; selected: number; width?: string }

export const WIZ_HEIGHT = "13rem"
export const ICON_IDS = { product: "product", hint: "hint", activate: "activate", accept: "accept" } as const
export const stepText = (i: number) => `Content of step ${i + 1}.`
// Fixed-height step content so the scroll position (selected step at the top) is the same on both pages.
export const STEP_CONTENT_STYLE = "display:block;height:4rem"

const four: StepSpec[] = [
  { title: "Product type", icon: "product" },
  { title: "Product information", subtitle: "(Optional)", icon: "hint" },
  { title: "Options", icon: "activate", disabled: true },
  { title: "Pricing", icon: "accept", disabled: true },
]

export default defineFixtures<Props>({
  name: "wizard",
  cases: [
    { id: "wizard-icons-first", props: { steps: four, selected: 0 } },
    { id: "wizard-icons-second", props: { steps: four, selected: 1 } },
    { id: "wizard-numbers", props: { steps: [{ title: "Step 1" }, { title: "Step 2", branching: true }, { title: "Step 3", disabled: true }], selected: 1 } },
    { id: "wizard-all-enabled", props: { steps: four.map((s) => ({ ...s, disabled: false })), selected: 3 } },
    // 520px header → room for 2 expanded tabs; the others collapse into stacks.
    { id: "wizard-narrow", props: { steps: [...four, { title: "Review" }].map((s) => ({ ...s, disabled: false })), selected: 2, width: "520px" } },
  ],
  react: ({ steps, selected, width = "48rem" }) => (
    <div style={{ width, height: WIZ_HEIGHT }}>
      <Wizard defaultSelectedStep={String(selected)} accessibleName={`Wizard fixture ${steps.length} ${selected} ${width}`}>
        {steps.map((s, i) => (
          <WizardStep
            key={i}
            titleText={s.title}
            subtitleText={s.subtitle}
            icon={s.icon && icons[s.icon]}
            disabled={s.disabled}
            branching={s.branching}
          >
            <Text style={{ display: "block", height: "4rem" }}>{stepText(i)}</Text>
          </WizardStep>
        ))}
      </Wizard>
    </div>
  ),
})
