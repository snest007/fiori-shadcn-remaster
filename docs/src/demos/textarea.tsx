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

export default defineDemo({ title: "TextArea", order: 30, Demo: TextAreaDemo })
