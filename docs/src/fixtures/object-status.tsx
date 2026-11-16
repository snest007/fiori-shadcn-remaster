import { ObjectAttribute, ObjectIdentifier } from "@/components/ui/object-identifier"
import { ObjectNumber } from "@/components/ui/object-number"
import { ObjectStatus, type ObjectStatusState } from "@/components/ui/object-status"
import { alert, error, information, sysEnter2 } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = { kind: "status" | "inverted" | "large" | "number" | "identifier" }

const states: [ObjectStatusState, string, typeof error | undefined][] = [
  ["none", "Draft", undefined],
  ["positive", "Delivered", sysEnter2],
  ["critical", "Delayed", alert],
  ["negative", "Blocked", error],
  ["information", "In Process", information],
  ["indication5", "Indication 5", undefined],
]

// sap.m ObjectStatus / ObjectNumber / ObjectIdentifier / ObjectAttribute have no UI5 Web Component to pixel-compare
// against. These cells are for the docs grid and screenshot review against the Fiori guideline images ("Object
// Status", "Object Number", "Object Display Components"); see tests/object-status.spec.ts.
export default defineFixtures<Props>({
  name: "object-status",
  cases: ([
    { id: "object-status-states", props: { kind: "status" } },
    { id: "object-status-inverted", props: { kind: "inverted" } },
    { id: "object-status-large", props: { kind: "large" } },
    { id: "object-status-number", props: { kind: "number" } },
    { id: "object-status-identifier", props: { kind: "identifier" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "object-status-rtl" }] : [fixture]),
  react: ({ kind }) => {
    if (kind === "status" || kind === "inverted")
      return (
        <div className="flex w-[14rem] flex-col items-start gap-2">
          {states.map(([s, t, i]) => (
            <ObjectStatus key={s} state={s} text={t} icon={i} inverted={kind === "inverted"} title={kind === "status" && s === "none" ? "Status" : undefined} />
          ))}
        </div>
      )
    if (kind === "large")
      return (
        <div className="flex w-[14rem] flex-col items-start gap-2">
          <ObjectStatus large state="positive" text="Delivery" />
          <ObjectStatus large state="negative" text="To Be Selected" />
        </div>
      )
    if (kind === "number")
      return (
        <div className="flex w-[14rem] flex-col items-start gap-2">
          <ObjectNumber number="379.99" unit="USD" />
          <ObjectNumber number="12,897.00" unit="EUR" emphasized={false} />
          <ObjectNumber number="-25.00" unit="EUR" state="negative" />
          <ObjectNumber number="1,200" unit="PC" state="positive" inverted />
          <ObjectNumber number="379.99" unit="USD" large />
        </div>
      )
    return (
      <div className="flex w-[14rem] flex-col items-start gap-3">
        <ObjectIdentifier title="Robot Arm Series 9" text="PO-48865" />
        <ObjectIdentifier title="10223882001820" text="Jologa" titleActive titleHref="#" />
        <ObjectAttribute title="Manufacturer" text="Robotech" />
        <ObjectAttribute title="Supplier" text="Robotech (234242343)" active href="#" />
      </div>
    )
  },
  skipCompare: ["object-status-states", "object-status-inverted", "object-status-large", "object-status-number", "object-status-identifier"],
})
