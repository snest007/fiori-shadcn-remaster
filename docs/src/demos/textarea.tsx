import * as React from "react"

import { Label } from "@/components/ui/label"
import { TextArea } from "@/components/ui/textarea"

import { defineDemo } from "./types"

function TextAreaDemo() {
  const [notes, setNotes] = React.useState("")
  const over = notes.length > 40
  return (
    <>
      <div className="grid max-w-md grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2">
        <Label htmlFor="ta-notes" showColon className="mt-3">Notes</Label>
        <TextArea
          id="ta-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Up to 40 characters"
          maxLength={40}
          counterMode="always"
          valueState={over ? "negative" : "none"}
          valueStateMessage={over ? "Shorten the note to 40 characters." : undefined}
        />
        <Label htmlFor="ta-growing" showColon className="mt-3">Growing</Label>
        <TextArea id="ta-growing" growing growingMaxRows={5} placeholder="Grows up to 5 rows" />
        <Label htmlFor="ta-auto" showColon className="mt-3">Auto counter</Label>
        <TextArea id="ta-auto" maxLength={20} counterMode="auto" rows={1} placeholder="Counter shows while focused" />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Escape restores the text the field had when it got focus.
      </p>
    </>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "textarea",
      description: "Multiline text with growing rows, character counts and value states.",
      props: [
        { name: "TextArea.rows", type: "number", description: "Visible rows; 0 uses the two-row visual default.", defaultValue: "0" },
        { name: "TextArea.growing", type: "boolean", description: "Grow to fit content.", defaultValue: "false" },
        { name: "TextArea.growingMaxRows", type: "number", description: "Maximum growing rows; 0 is unlimited.", defaultValue: "0" },
        { name: "TextArea.counterMode", type: "none | always | auto", description: "Character counter behavior when maxLength is set.", defaultValue: "none" },
        { name: "TextArea.valueState", type: "ValueState", description: "Semantic validation state.", defaultValue: "none" },
      ],
    },
  ],
 title: "TextArea", order: 30, Demo: TextAreaDemo })
