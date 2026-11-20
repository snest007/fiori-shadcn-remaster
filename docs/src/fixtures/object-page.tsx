import { Avatar } from "@/components/ui/avatar"
import { DynamicPageTitle } from "@/components/ui/dynamic-page"
import { Form, FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { ObjectAttribute } from "@/components/ui/object-identifier"
import { ObjectNumber } from "@/components/ui/object-number"
import { ObjectPage, ObjectPageHeader, ObjectPageHeaderFacet, ObjectPageSection, ObjectPageSubSection } from "@/components/ui/object-page"
import { ObjectStatus } from "@/components/ui/object-status"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"
import { machine } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = { mode: "anchor" | "tabs"; snapped?: boolean }

// The object page is a floorplan from sap.uxap (SAPUI5); there is no UI5 Web Component to pixel-compare against.
// These cells are for the docs grid and screenshot review against the Fiori guideline image "Object Page – Size XL"
// (see tests/object-page.spec.ts for behaviour).
export default defineFixtures<Props>({
  name: "object-page",
  cases: [
    { id: "object-page-anchor", props: { mode: "anchor" } },
    { id: "object-page-snapped", props: { mode: "anchor", snapped: true } },
    { id: "object-page-tabs", props: { mode: "tabs" } },
  ],
  react: ({ mode, snapped }) => (
    <ObjectPage
      mode={mode}
      defaultHeaderSnapped={snapped}
      style={{ width: "64rem", height: "30rem", fontSize: "1rem" }}
      accessibilityAttributes={{ header: { role: "region", name: `Fixture header (${mode}${snapped ? ", snapped" : ""})` } }}
      anchorBarLabel={`Fixture sections (${mode}${snapped ? ", snapped" : ""})`}
      title={
        <DynamicPageTitle
          heading={<Title level="H2">Robot Arm Series 9</Title>}
          snappedHeading={<Title level="H2">Robot Arm Series 9</Title>}
          subheading={<Label>PO-48865</Label>}
          snappedSubheading={<Label>PO-48865</Label>}
          actions={
            <Toolbar aria-label="Object actions" design="transparent">
              <ToolbarButton variant="emphasized">Edit</ToolbarButton>
              <ToolbarButton>Delete</ToolbarButton>
            </Toolbar>
          }
        />
      }
      header={
        <ObjectPageHeader
          accessibleName={`Fixture details (${mode}${snapped ? ", snapped" : ""})`}
          avatar={<Avatar size="L" shape="square" icon={machine} accessibleName="Robot arm" />}
        >
          <ObjectPageHeaderFacet>
            <ObjectAttribute title="Manufacturer" text="Robotech" />
            <ObjectAttribute title="Factory" text="Orlando, FL" />
            <ObjectAttribute title="Supplier" text="Robotech (234242343)" active href="#" />
          </ObjectPageHeaderFacet>
          <ObjectPageHeaderFacet title="Status">
            <ObjectStatus large state="positive" text="Delivery" />
          </ObjectPageHeaderFacet>
          <ObjectPageHeaderFacet title="Assembly Option">
            <ObjectStatus large state="negative" text="To Be Selected" />
          </ObjectPageHeaderFacet>
          <ObjectPageHeaderFacet title="Leasing Installment">
            <ObjectNumber large number="379.99" unit="USD" emphasized={false} />
          </ObjectPageHeaderFacet>
        </ObjectPageHeader>
      }
    >
      <ObjectPageSection id="general" titleText="General Information">
        <ObjectPageSubSection titleText="Order Details">
          <Form layout="S1 M2 L4 XL4" labelSpan="S12 M12 L12 XL12">
            {[
              ["Order ID", "589946637"],
              ["Expected Delivery Date", "January 25, 2023"],
              ["Contract", "10045876"],
              ["Transaction Date", "August 6, 2022"],
            ].map(([l, v]) => (
              <FormItem key={l} label={<Label showColon>{l}</Label>}>
                <Text>{v}</Text>
              </FormItem>
            ))}
          </Form>
        </ObjectPageSubSection>
      </ObjectPageSection>
      <ObjectPageSection id="assembly" titleText="Assembly Options">
        <ObjectPageSubSection titleText="Products">
          <div className="h-40 px-4">
            <Text>Products table</Text>
          </div>
        </ObjectPageSubSection>
      </ObjectPageSection>
      <ObjectPageSection id="contact" titleText="Contact Information">
        <ObjectPageSubSection>
          <div className="h-40 px-4">
            <Text>Denise Smith</Text>
          </div>
        </ObjectPageSubSection>
      </ObjectPageSection>
    </ObjectPage>
  ),
  skipCompare: ["object-page-anchor", "object-page-snapped", "object-page-tabs"],
})
