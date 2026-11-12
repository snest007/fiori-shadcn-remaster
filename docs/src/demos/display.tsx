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

export default defineDemo({
  category: "Display",
  docs: [
    {
      name: "title",
      description: "Semantic headings with independently selectable visual sizes.",
      props: [
        { name: "Title.level", type: "H1 | H2 | H3 | H4 | H5 | H6", description: "Semantic heading level.", defaultValue: "H2" },
        { name: "Title.size", type: "H1 | H2 | H3 | H4 | H5 | H6", description: "Visual size independent of the heading level.", defaultValue: "H5" },
        { name: "Title.wrappingType", type: "Normal | None", description: "Wrap the title or truncate it to one line.", defaultValue: "Normal" },
        { name: "Title.children", type: "ReactNode", description: "Heading content." },
      ],
    },
    {
      name: "text",
      description: "Body text with optional multiline truncation.",
      props: [
        { name: "Text.maxLines", type: "number", description: "Maximum visible lines; omit for unlimited text." },
        { name: "Text.children", type: "ReactNode", description: "Text content." },
      ],
    },
    {
      name: "link",
      description: "Navigation and action links with semantic designs and keyboard activation.",
      props: [
        { name: "Link.href", type: "string", description: "Navigation destination; omit to use an action link." },
        { name: "Link.onClick", type: "React.MouseEventHandler<HTMLAnchorElement>", description: "Receive activation by pointer or keyboard." },
        { name: "Link.design", type: "default | subtle | emphasized", description: "Link presentation.", defaultValue: "default" },
        { name: "Link.wrappingType", type: "normal | none", description: "Wrap or truncate the link text.", defaultValue: "normal" },
        { name: "Link.disabled", type: "boolean", description: "Prevent link activation." },
        { name: "Link.interactiveAreaSize", type: "normal | large", description: "Use the normal or enlarged interaction target.", defaultValue: "normal" },
      ],
    },
    {
      name: "busy-indicator",
      description: "Delayed loading feedback that dims and disables the wrapped content.",
      props: [
        { name: "BusyIndicator.active", type: "boolean", description: "Show the indicator after the configured delay.", defaultValue: "false" },
        { name: "BusyIndicator.delay", type: "number", description: "Delay before showing loading feedback, in milliseconds.", defaultValue: "1000" },
        { name: "BusyIndicator.size", type: "S | M | L", description: "Indicator size.", defaultValue: "M" },
        { name: "BusyIndicator.text", type: "string", description: "Visible loading text and accessible name." },
        { name: "BusyIndicator.textPlacement", type: "top | bottom", description: "Position of the loading text.", defaultValue: "bottom" },
        { name: "BusyIndicator.title", type: "string", description: "Accessible title of the busy area.", defaultValue: "Please wait" },
      ],
    },
  ], title: "Title, Text, Link, BusyIndicator", order: 35, Demo: DisplayDemo })
