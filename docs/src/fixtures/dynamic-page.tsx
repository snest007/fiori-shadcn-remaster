import { Bar } from "@/components/ui/bar"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { DynamicPage, DynamicPageHeader, DynamicPageTitle } from "@/components/ui/dynamic-page"
import { Label } from "@/components/ui/label"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"

import { defineFixtures } from "../fixture-types"

/** Fixed page size so both pages lay out identically (M range: 600px ≤ width < 1024px). */
export const DP_WIDTH = "50rem"
export const DP_HEIGHT = "26rem"

type Props = { snapped?: boolean; footer?: boolean; pinned?: boolean; breadcrumbs?: boolean; hidePin?: boolean }

export const dpContent = "Content of the dynamic page."

export default defineFixtures<Props>({
  name: "dynamic-page",
  cases: ([
    { id: "dynamic-page-expanded", props: {} },
    { id: "dynamic-page-snapped", props: { snapped: true } },
    { id: "dynamic-page-footer", props: { footer: true } },
    { id: "dynamic-page-snapped-footer", props: { snapped: true, footer: true } },
    { id: "dynamic-page-pinned", props: { pinned: true, breadcrumbs: true } },
    { id: "dynamic-page-no-pin", props: { hidePin: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "dynamic-page-rtl" }] : [fixture]),
  react: ({ snapped, footer, pinned, breadcrumbs, hidePin }) => (
    <DynamicPage
      // 1rem: the font size the UI5 page inherits from its <body> (line boxes in the title/content depend on it).
      style={{ width: DP_WIDTH, height: DP_HEIGHT, fontSize: "1rem" }}
      defaultHeaderSnapped={snapped}
      defaultHeaderPinned={pinned}
      hidePinButton={hidePin}
      showFooter={footer}
      title={
        <DynamicPageTitle
          breadcrumbs={
            breadcrumbs && (
              <Breadcrumbs aria-label="Fixture trail">
                <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
                <BreadcrumbsItem>Laptops</BreadcrumbsItem>
              </Breadcrumbs>
            )
          }
          heading={<Title level="H2">Laptop 15</Title>}
          snappedHeading={<Title level="H2">Laptop 15 (snapped)</Title>}
          subheading={<Label>PO-48865</Label>}
          snappedSubheading={<Label>PO-48865</Label>}
          actions={
            <Toolbar aria-label="Page actions" design="transparent">
              <ToolbarButton variant="emphasized">Edit</ToolbarButton>
              <ToolbarButton variant="transparent">Delete</ToolbarButton>
            </Toolbar>
          }
        />
      }
      header={
        <DynamicPageHeader>
          <div className="flex gap-8">
            <div className="flex flex-col gap-1">
              <Label>Manufacturer: Robotech</Label>
              <Label>Factory: Orlando, FL</Label>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Status</Label>
              <Label>Delivery in 12 days</Label>
            </div>
          </div>
        </DynamicPageHeader>
      }
      footer={
        <Bar
          design="floating-footer"
          endContent={
            <>
              <Button variant="emphasized">Save</Button>
              <Button variant="transparent">Cancel</Button>
            </>
          }
        />
      }
    >
      <Label>{dpContent}</Label>
    </DynamicPage>
  ),
})
