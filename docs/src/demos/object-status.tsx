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

export default defineDemo({ title: "ObjectStatus, ObjectNumber, ObjectIdentifier", order: 72, Demo: ObjectDisplayDemo })
