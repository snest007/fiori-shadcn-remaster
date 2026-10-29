import * as React from "react"

import { Button } from "@/components/ui/button"
import { MessageStrip } from "@/components/ui/message-strip"

import { defineDemo } from "./types"

function MessageStripDemo() {
  const [shown, setShown] = React.useState({ information: true, positive: true, negative: true, critical: true })
  return (
    <div className="grid max-w-xl gap-2">
      {(Object.keys(shown) as (keyof typeof shown)[]).map(
        (d) =>
          shown[d] && (
            <MessageStrip key={d} id={`ms-${d}`} design={d} onClose={() => setShown((s) => ({ ...s, [d]: false }))}>
              {`A ${d} message strip. Close it with the button.`}
            </MessageStrip>
          )
      )}
      <MessageStrip design="color-set-1" colorScheme={5} hideCloseButton>
        Color set 1, scheme 5, not closable.
      </MessageStrip>
      <MessageStrip design="color-set-2" colorScheme={8}>
        Color set 2, scheme 8.
      </MessageStrip>
      <div>
        <Button onClick={() => setShown({ information: true, positive: true, negative: true, critical: true })}>Reset strips</Button>
      </div>
    </div>
  )
}

export default defineDemo({ title: "MessageStrip", order: 30, Demo: MessageStripDemo })
