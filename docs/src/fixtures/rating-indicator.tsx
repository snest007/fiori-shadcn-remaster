import { RatingIndicator } from "@/components/ui/rating-indicator"

import { defineFixtures } from "../fixture-types"

type Props = { value: number; max?: number; size?: "S" | "M" | "L"; readOnly?: boolean; displayOnly?: boolean; disabled?: boolean }

export default defineFixtures<Props>({
  name: "rating-indicator",
  cases: [
    { id: "rating-indicator-0", props: { value: 0 } },
    { id: "rating-indicator-3", props: { value: 3 } },
    { id: "rating-indicator-half", props: { value: 2.5 } },
    { id: "rating-indicator-max7", props: { value: 4, max: 7 } },
    { id: "rating-indicator-s", props: { value: 3, size: "S" } },
    { id: "rating-indicator-l", props: { value: 3, size: "L" } },
    { id: "rating-indicator-readonly", props: { value: 3, readOnly: true } },
    { id: "rating-indicator-display-only", props: { value: 3.5, displayOnly: true } },
    { id: "rating-indicator-disabled", props: { value: 2, disabled: true } },
  ],
  react: ({ value, ...p }) => <RatingIndicator value={value} aria-label="Rating" {...p} />,
})
