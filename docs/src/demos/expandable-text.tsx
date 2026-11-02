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

export default defineDemo({ title: "ExpandableText", order: 64, Demo: ExpandableTextDemo })
