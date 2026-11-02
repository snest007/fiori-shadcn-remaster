import * as React from "react"

import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Page } from "@/components/ui/page"
import { Text } from "@/components/ui/text"

import { defineDemo } from "./types"

function PageDemo() {
  const [hidden, setHidden] = React.useState(false)
  const [fixed, setFixed] = React.useState(false)
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <Button aria-pressed={hidden} onClick={() => setHidden((v) => !v)}>Hide footer</Button>
        <Button aria-pressed={fixed} onClick={() => setFixed((v) => !v)}>Fixed footer</Button>
      </div>
      <div id="page-demo" className="h-[20rem]">
        <Page
          aria-label="Page demo"
          fixedFooter={fixed}
          hideFooter={hidden}
          header={<Bar design="header"><Label>Edit Supplier</Label></Bar>}
          footer={
            <Bar
              design={fixed ? "footer" : "floating-footer"}
              endContent={<><Button variant="emphasized">Save</Button><Button>Cancel</Button></>}
            />
          }
        >
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="my-3"><Text>Paragraph {i + 1}: the content scrolls under the header; the floating footer stays above it.</Text></p>
          ))}
        </Page>
      </div>
    </div>
  )
}

export default defineDemo({ title: "Page", order: 72, Demo: PageDemo })
