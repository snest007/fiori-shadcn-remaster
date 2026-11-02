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

export default defineDemo({ title: "Carousel", order: 62, Demo: CarouselDemo })
