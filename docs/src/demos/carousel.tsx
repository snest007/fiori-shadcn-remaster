import * as React from "react"

import { Button } from "@/components/ui/button"
import { Carousel } from "@/components/ui/carousel"

import { defineDemo } from "./types"

const slide = "flex h-32 w-full items-center justify-center rounded-lg bg-(--sapNeutralBackground) text-(--sapTextColor)"

function CarouselDemo() {
  const [page, setPage] = React.useState(0)
  const [clicks, setClicks] = React.useState(0)
  return (
    <div className="grid gap-6">
      <div id="carousel-basic" className="max-w-xl">
        <Carousel accessibleName="Products" onNavigate={setPage}>
          <div className={slide}>Laptop</div>
          <div className={slide}>
            <Button onClick={() => setClicks((n) => n + 1)}>Monitor clicked {clicks}×</Button>
          </div>
          <div className={slide}>Keyboard</div>
          <div className={slide}>Mouse</div>
        </Carousel>
        <p id="carousel-basic-page" className="mt-2 text-(--sapContent_LabelColor)">Page index: {page}</p>
      </div>
      <div id="carousel-cyclic" className="max-w-xl">
        <Carousel accessibleName="Offers" cyclic arrowsPlacement="Navigation" pageIndicatorType="Numeric">
          <div className={slide}>Offer 1</div>
          <div className={slide}>Offer 2</div>
          <div className={slide}>Offer 3</div>
        </Carousel>
      </div>
      <div id="carousel-multi">
        <Carousel accessibleName="Team" itemsPerPage="S1 M3 L3 XL3">
          {["Ann", "Ben", "Carla", "Dan", "Eva"].map((n) => (
            <div key={n} className={slide}>{n}</div>
          ))}
        </Carousel>
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Display",
  docs: [
    {
      name: "carousel",
      description: "Responsive paged content with arrows, indicators and optional cyclic navigation.",
      props: [
        { name: "Carousel.pageIndex", type: "number", description: "Controlled page index, starting at zero." },
        { name: "Carousel.defaultPageIndex", type: "number", description: "Initial page index when uncontrolled.", defaultValue: "0" },
        { name: "Carousel.onNavigate", type: "(pageIndex: number) => void", description: "Receive page changes made by the user." },
        { name: "Carousel.itemsPerPage", type: "string", description: "Items per page at each responsive breakpoint.", defaultValue: "S1 M1 L1 XL1" },
        { name: "Carousel.cyclic", type: "boolean", description: "Wrap navigation at either end.", defaultValue: "false" },
        { name: "Carousel.pageIndicatorType", type: "Default | Numeric", description: "Dots, switching to numbers for many pages, or always numeric.", defaultValue: "Default" },
        { name: "Carousel.arrowsPlacement", type: "Content | Navigation", description: "Show arrows over content or beside the indicator.", defaultValue: "Content" },
      ],
    },
  ], title: "Carousel", order: 62, Demo: CarouselDemo })
