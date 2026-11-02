import type { ValueState } from "@/components/ui/input"
import { ProgressIndicator } from "@/components/ui/progress-indicator"

import { defineFixtures } from "../fixture-types"

type Props = { value: number; valueState?: ValueState; hideValue?: boolean; displayValue?: string }
const states = ["negative", "critical", "positive", "information"] as const

// UI5 animates the bar width on value change (20ms per percent); fixtures render once, so there is
// nothing to animate on first paint on either page.
export default defineFixtures<Props>({
  name: "progress-indicator",
  cases: [
    { id: "progress-indicator-0", props: { value: 0 } },
    { id: "progress-indicator-25", props: { value: 25 } },
    { id: "progress-indicator-75", props: { value: 75 } },
    { id: "progress-indicator-100", props: { value: 100 } },
    ...states.map((valueState) => ({ id: `progress-indicator-${valueState}`, props: { value: 60, valueState } })),
    { id: "progress-indicator-low-state", props: { value: 30, valueState: "negative" } },
    { id: "progress-indicator-hide-value", props: { value: 40, hideValue: true } },
    { id: "progress-indicator-display-value", props: { value: 80, displayValue: "8 of 10" } },
  ],
  react: (p) => <ProgressIndicator style={{ width: "15rem" }} aria-label="Progress" {...p} />,
})
