import { ExpandableText } from "@/components/ui/expandable-text"

import { defineDemo } from "./types"

const LONG =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."

function ExpandableTextDemo() {
  return (
    <div className="grid max-w-md gap-4">
      <ExpandableText id="expandable-text-inplace" text={LONG} />
      <ExpandableText id="expandable-text-popover" text={LONG} overflowMode="Popover" maxCharacters={40} />
      <ExpandableText id="expandable-text-short" text="Short text." />
    </div>
  )
}

export default defineDemo({
  category: "Display",
  docs: [
    {
      name: "expandable-text",
      description: "Long text that expands in place or opens in a popover.",
      props: [
        { name: "ExpandableText.text", type: "string", description: "Full text to display." },
        { name: "ExpandableText.maxCharacters", type: "number", description: "Characters shown while collapsed.", defaultValue: "100" },
        { name: "ExpandableText.overflowMode", type: "InPlace | Popover", description: "Where the full text is shown.", defaultValue: "InPlace" },
        { name: "ExpandableText.defaultExpanded", type: "boolean", description: "Start expanded in InPlace mode.", defaultValue: "false" },
        { name: "ExpandableText.emptyIndicatorMode", type: "Off | On", description: "Show a dash for empty text.", defaultValue: "Off" },
        { name: "ExpandableText.showMoreText", type: "string", description: "Expand action text.", defaultValue: "Show More" },
        { name: "ExpandableText.showLessText", type: "string", description: "Collapse action text.", defaultValue: "Show Less" },
      ],
    },
  ], title: "ExpandableText", order: 64, Demo: ExpandableTextDemo })
