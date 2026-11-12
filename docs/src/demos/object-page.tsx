import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DynamicPageTitle } from "@/components/ui/dynamic-page"
import { Form, FormGroup, FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { ObjectAttribute } from "@/components/ui/object-identifier"
import { ObjectNumber } from "@/components/ui/object-number"
import {
  ObjectPage,
  ObjectPageHeader,
  ObjectPageHeaderFacet,
  ObjectPageSection,
  ObjectPageSubSection,
  type ObjectPageMode,
} from "@/components/ui/object-page"
import { ObjectStatus } from "@/components/ui/object-status"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"
import { machine } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const detail = (label: string, value: string) => (
  <FormItem key={label} label={<Label showColon>{label}</Label>}>
    <Text>{value}</Text>
  </FormItem>
)

function ObjectPageDemo() {
  const [mode, setMode] = React.useState<ObjectPageMode>("anchor")
  const [selected, setSelected] = React.useState("general")
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Button id="object-page-demo-anchor" aria-pressed={mode === "anchor"} onClick={() => setMode("anchor")}>Anchor navigation</Button>
        <Button id="object-page-demo-tabs" aria-pressed={mode === "tabs"} onClick={() => setMode("tabs")}>Tabs</Button>
        <span className="text-(--sapContent_LabelColor)">
          Selected: <b id="object-page-demo-selected">{selected}</b>
        </span>
      </div>
      <ObjectPage
        id="object-page-demo"
        className="h-[32rem] border border-(--sapGroup_TitleBorderColor)"
        mode={mode}
        selectedSection={selected}
        onSelectedSectionChange={setSelected}
        // The docs page is a <main>: use a region instead of a nested "banner" landmark.
        accessibilityAttributes={{ header: { role: "region", name: "Robot Arm Series 9 header" } }}
        title={
          <DynamicPageTitle
            heading={<Title level="H2">Robot Arm Series 9</Title>}
            snappedHeading={<Title level="H2">Robot Arm Series 9</Title>}
            subheading={<Label>PO-48865</Label>}
            snappedSubheading={<Label>PO-48865</Label>}
            actions={
              <Toolbar aria-label="Object actions" design="transparent">
                <ToolbarButton variant="emphasized">Edit</ToolbarButton>
                <ToolbarButton variant="transparent">Delete</ToolbarButton>
              </Toolbar>
            }
          />
        }
        header={
          <ObjectPageHeader accessibleName="Robot Arm Series 9 details" avatar={<Avatar size="L" shape="square" icon={machine} accessibleName="Robot arm" />}>
            <ObjectPageHeaderFacet>
              <ObjectAttribute title="Manufacturer" text="Robotech" />
              <ObjectAttribute title="Factory" text="Orlando, FL" />
            </ObjectPageHeaderFacet>
            <ObjectPageHeaderFacet title="Status">
              <ObjectStatus large state="positive" text="Delivery" />
            </ObjectPageHeaderFacet>
            <ObjectPageHeaderFacet title="Leasing Installment">
              <ObjectNumber large number="379.99" unit="USD" emphasized={false} />
            </ObjectPageHeaderFacet>
          </ObjectPageHeader>
        }
      >
        <ObjectPageSection id="general" titleText="General Information">
          <ObjectPageSubSection titleText="Order Details">
            <Form layout="S1 M2 L2 XL2" labelSpan="S12 M12 L12 XL12">
              <FormGroup>
                {detail("Order ID", "589946637")}
                {detail("Contract", "10045876")}
              </FormGroup>
              <FormGroup>
                {detail("Expected Delivery Date", "January 25, 2023")}
                {detail("Transaction Date", "August 6, 2022")}
              </FormGroup>
            </Form>
          </ObjectPageSubSection>
        </ObjectPageSection>
        <ObjectPageSection id="assembly" titleText="Assembly Options">
          <ObjectPageSubSection titleText="Configuration">
            <Form layout="S1 M2 L2 XL2" labelSpan="S12 M12 L12 XL12">
              {detail("Model", "Robot Arm Series 9")}
              {detail("Color", "White (default)")}
              {detail("Axis", "6 Axis")}
              {detail("Socket", "Default Socket 10")}
            </Form>
          </ObjectPageSubSection>
          <ObjectPageSubSection titleText="Notes">
            <div className="h-48 px-4">
              <Text>Assembly takes place at the Orlando factory.</Text>
            </div>
          </ObjectPageSubSection>
        </ObjectPageSection>
        <ObjectPageSection id="contact" titleText="Contact Information">
          <ObjectPageSubSection>
            <div className="h-72 px-4">
              <Text>Denise Smith, +1 555 0100</Text>
            </div>
          </ObjectPageSubSection>
        </ObjectPageSection>
      </ObjectPage>
    </div>
  )
}

export default defineDemo({
  title: "ObjectPage", order: 73, Demo: ObjectPageDemo, category: "Layout",
  docs: [{
    name: "object-page",
    description: "Object details with a dynamic header and section anchors or tabs.",
    props: [
      { name: "ObjectPage.mode", type: "anchor | tabs", description: "Scroll between sections or show one tab at a time.", defaultValue: "anchor" },
      { name: "ObjectPage.selectedSection", type: "string", description: "Controlled selected section ID." },
      { name: "ObjectPage.onSelectedSectionChange", type: "(id: string) => void", description: "Receive section navigation and scroll-spy changes." },
      { name: "ObjectPage.showAnchorBar", type: "boolean", description: "Show section navigation.", defaultValue: "true" },
      { name: "ObjectPageSection.id / ObjectPageSection.titleText", type: "string", description: "Required section identity and navigation label." },
      { name: "ObjectPageSubSection.titleText", type: "string", description: "Optional subsection heading." },
    ],
  }],
})
