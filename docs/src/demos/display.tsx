import * as React from "react"

import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"

import { defineDemo } from "./types"

function DisplayDemo() {
  const [linkClicks, setLinkClicks] = React.useState(0)
  const [busy, setBusy] = React.useState(false)
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <Title level="H3" size="H1">Title H1</Title>
        <Title level="H3" size="H2">Title H2</Title>
        <Title level="H3" size="H3">Title H3</Title>
        <Title level="H3" size="H4">Title H4</Title>
        <Title level="H3" size="H5">Title H5</Title>
        <Title level="H3" size="H6">Title H6</Title>
      </div>
      <div className="max-w-sm">
        <Text maxLines={2}>
          Text with maxLines=2. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
        </Text>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link id="link-action" onClick={() => setLinkClicks((n) => n + 1)}>Action link</Link>
        <Link design="subtle" href="#subtle">Subtle</Link>
        <Link design="emphasized" href="#emphasized">Emphasized</Link>
        <span id="link-clicks" className="text-(--sapContent_LabelColor)">{`Activated ${linkClicks} times`}</span>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => setBusy((b) => !b)}>{busy ? "Stop" : "Load (1s delay)"}</Button>
        <BusyIndicator id="busy-demo" active={busy}>
          <div className="w-60 p-4">
            <Text>Content under the busy indicator.</Text>
          </div>
        </BusyIndicator>
      </div>
    </div>
  )
}

export default defineDemo({ title: "Title, Text, Link, BusyIndicator", order: 35, Demo: DisplayDemo })
