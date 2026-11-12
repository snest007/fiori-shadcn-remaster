import * as React from "react"

import { ObjectAttribute, ObjectIdentifier } from "@/components/ui/object-identifier"
import { ObjectNumber } from "@/components/ui/object-number"
import { ObjectStatus } from "@/components/ui/object-status"
import { alert, error, sysEnter2 } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function ObjectDisplayDemo() {
  const [presses, setPresses] = React.useState(0)
  return (
    <div id="object-status-demo" className="flex flex-wrap gap-10">
      <div className="flex flex-col items-start gap-2">
        <ObjectStatus title="Status" text="Delivered" state="positive" icon={sysEnter2} />
        <ObjectStatus text="Delayed" state="critical" icon={alert} />
        <ObjectStatus text="Blocked" state="negative" icon={error} inverted />
        <ObjectStatus id="object-status-demo-active" text="3 Issues" state="negative" active onClick={() => setPresses((n) => n + 1)} />
        <span id="object-status-demo-presses" className="text-(--sapContent_LabelColor)">{`Pressed ${presses} times`}</span>
      </div>
      <div className="flex flex-col items-start gap-2">
        <ObjectNumber number="379.99" unit="USD" />
        <ObjectNumber number="-25.00" unit="EUR" state="negative" />
        <ObjectNumber number="379.99" unit="USD" large />
      </div>
      <div className="flex flex-col items-start gap-2">
        <ObjectIdentifier title="Robot Arm Series 9" text="PO-48865" />
        <ObjectAttribute title="Manufacturer" text="Robotech" />
        <ObjectAttribute title="Supplier" text="Robotech (234242343)" active href="#object-status-demo" />
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Data",
  docs: [
    {
      name: "object-status",
      description: "Semantic status text, icons and interactive status actions.",
      props: [
        { name: "ObjectStatus.text", type: "ReactNode", description: "Status text." },
        { name: "ObjectStatus.state", type: "ObjectStatusState", description: "Semantic state, including numbered indication states.", defaultValue: "none" },
        { name: "ObjectStatus.inverted", type: "boolean", description: "Use a filled status presentation." },
        { name: "ObjectStatus.active", type: "boolean", description: "Activate the status as a link-styled button." },
        { name: "ObjectStatus.stateAnnouncementText", type: "string | null", description: "Override the hidden state announcement; null disables it." },
      ],
    },
    {
      name: "object-number",
      description: "Numeric object KPIs with units and semantic states.",
      fixtureSet: "object-status",
      fixtureId: "object-status-number",
      props: [
        { name: "ObjectNumber.number", type: "ReactNode", description: "Number to display." },
        { name: "ObjectNumber.unit", type: "ReactNode", description: "Unit beside the number." },
        { name: "ObjectNumber.state", type: "ObjectNumberState", description: "Semantic state.", defaultValue: "none" },
        { name: "ObjectNumber.emphasized", type: "boolean", description: "Use a bold number.", defaultValue: "true" },
        { name: "ObjectNumber.large", type: "boolean", description: "Use the large header KPI presentation." },
      ],
    },
    {
      name: "object-identifier",
      description: "Object titles and attributes with optional navigation actions.",
      fixtureSet: "object-status",
      fixtureId: "object-status-identifier",
      props: [
        { name: "ObjectIdentifier.title", type: "ReactNode", description: "Primary object title." },
        { name: "ObjectIdentifier.text", type: "ReactNode", description: "Secondary identifier text." },
        { name: "ObjectIdentifier.titleActive", type: "boolean", description: "Make the title a link." },
        { name: "ObjectIdentifier.titleHref", type: "string", description: "Destination of an active title." },
        { name: "ObjectAttribute.active", type: "boolean", description: "Make attribute text interactive." },
      ],
    },
  ],
 title: "ObjectStatus, ObjectNumber, ObjectIdentifier", order: 72, Demo: ObjectDisplayDemo })
