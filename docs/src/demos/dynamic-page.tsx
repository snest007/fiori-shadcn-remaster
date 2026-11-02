import * as React from "react"

import { Bar } from "@/components/ui/bar"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { DynamicPage, DynamicPageHeader, DynamicPageTitle } from "@/components/ui/dynamic-page"
import { Label } from "@/components/ui/label"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"

import { defineDemo } from "./types"

function DynamicPageDemo() {
  const [footer, setFooter] = React.useState(true)
  const [log, setLog] = React.useState<string[]>([])
  const add = (s: string) => setLog((l) => [...l.slice(-3), s])
  return (
    <div className="grid gap-2">
      <DynamicPage
        id="dynamic-page-demo"
        className="h-[28rem] border border-(--sapGroup_TitleBorderColor)"
        showFooter={footer}
        // The docs page is a <main>: a nested "banner" landmark would be invalid there, so use a region.
        accessibilityAttributes={{ header: { role: "region", name: "Laptop 15 header" } }}
        onTitleToggle={(s) => add(s ? "snapped" : "expanded")}
        onPinButtonToggle={(p) => add(p ? "pinned" : "unpinned")}
        title={
          <DynamicPageTitle
            breadcrumbs={
              <Breadcrumbs aria-label="Dynamic page trail">
                <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
                <BreadcrumbsItem>Laptops</BreadcrumbsItem>
              </Breadcrumbs>
            }
            heading={<Title level="H2">Laptop 15</Title>}
            snappedHeading={<Title level="H2">Laptop 15</Title>}
            subheading={<Label>PO-48865</Label>}
            snappedSubheading={<Label>PO-48865 · In Stock</Label>}
            actions={
              <Toolbar aria-label="Page actions" design="transparent">
                <ToolbarButton variant="emphasized">Edit</ToolbarButton>
                <ToolbarButton variant="transparent" onClick={() => setFooter((f) => !f)}>
                  Toggle Footer
                </ToolbarButton>
              </Toolbar>
            }
          >
            <Label>KPI: 98% availability</Label>
          </DynamicPageTitle>
        }
        header={
          // Unique name: the docs page holds several dynamic pages (landmarks must be distinguishable).
          <DynamicPageHeader accessibleName="Laptop 15 details">
            <div className="flex flex-wrap gap-8">
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
                <Button variant="emphasized">Confirm</Button>
                <Button variant="transparent">Cancel</Button>
              </>
            }
          />
        }
      >
        <div className="grid gap-3">
          {Array.from({ length: 30 }, (_, i) => (
            <Label key={i}>{`Content line ${i + 1}`}</Label>
          ))}
        </div>
      </DynamicPage>
      <span id="dynamic-page-demo-log" className="text-(--sapContent_LabelColor)">{log.join(", ") || "No events"}</span>
    </div>
  )
}

export default defineDemo({ title: "DynamicPage", order: 70, Demo: DynamicPageDemo })
