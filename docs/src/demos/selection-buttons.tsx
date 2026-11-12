import { Icon } from "@/components/ui/icon"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { ToggleButton } from "@/components/ui/toggle-button"
import { boldText, italicText, textAlignCenter, textAlignLeft, textAlignRight, underlineText } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

export default defineDemo({
  category: "Actions",
  docs: [
    {
      name: "segmented-button",
      description: "A single or multiple selection group with one keyboard entry point.",
      props: [
        { name: "SegmentedButton.selectionMode", type: "single | multiple", description: "Select one item or any number of items.", defaultValue: "single" },
        { name: "SegmentedButton.value", type: "string | string[]", description: "Controlled selected value; an array is required in multiple mode." },
        { name: "SegmentedButton.onValueChange", type: "(value: string) => void | (value: string[]) => void", description: "Receive the selected value for the chosen mode." },
        { name: "SegmentedButton.itemsFitContent", type: "boolean", description: "Size items to their content instead of sharing the width." },
      ],
    },
    {
      name: "toggle-button",
      description: "An action that retains its pressed state.",
      props: [
        { name: "ToggleButton.pressed", type: "boolean", description: "Controlled pressed state." },
        { name: "ToggleButton.defaultPressed", type: "boolean", description: "Initial uncontrolled pressed state." },
        { name: "ToggleButton.onPressedChange", type: "(pressed: boolean) => void", description: "Receive the next pressed state." },
        { name: "ToggleButton.variant", type: "ButtonProps[\"variant\"]", description: "Semantic button design.", defaultValue: "default" },
      ],
    },
  ],

  title: "SegmentedButton, ToggleButton",
  order: 33,
  Demo: () => (
    <div className="flex flex-col items-start gap-4">
      <SegmentedButton id="view" aria-label="View" defaultValue="week">
        <SegmentedButtonItem value="day">Day</SegmentedButtonItem>
        <SegmentedButtonItem value="week">Week</SegmentedButtonItem>
        <SegmentedButtonItem value="month">Month</SegmentedButtonItem>
        <SegmentedButtonItem value="year" disabled>Year</SegmentedButtonItem>
      </SegmentedButton>
      <div className="flex flex-wrap gap-4">
        <SegmentedButton aria-label="Alignment" defaultValue="left">
          <SegmentedButtonItem value="left" aria-label="Align left" icon={<Icon icon={textAlignLeft} />} />
          <SegmentedButtonItem value="center" aria-label="Align center" icon={<Icon icon={textAlignCenter} />} />
          <SegmentedButtonItem value="right" aria-label="Align right" icon={<Icon icon={textAlignRight} />} />
        </SegmentedButton>
        <SegmentedButton aria-label="Text style" selectionMode="multiple" defaultValue={["bold"]}>
          <SegmentedButtonItem value="bold" aria-label="Bold" icon={<Icon icon={boldText} />} />
          <SegmentedButtonItem value="italic" aria-label="Italic" icon={<Icon icon={italicText} />} />
          <SegmentedButtonItem value="underline" aria-label="Underline" icon={<Icon icon={underlineText} />} />
        </SegmentedButton>
      </div>
      <div className="flex flex-wrap gap-2">
        <ToggleButton id="favorite" defaultPressed>Favorite</ToggleButton>
        <ToggleButton variant="transparent">Transparent</ToggleButton>
        <ToggleButton variant="positive">Positive</ToggleButton>
        <ToggleButton variant="negative" defaultPressed>Negative</ToggleButton>
      </div>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Segmented button: one tab stop; ←/→/Home/End move focus, Space or Enter select.
      </p>
    </div>
  ),
})
