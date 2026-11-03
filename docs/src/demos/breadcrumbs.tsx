import * as React from "react"

import { Button } from "@/components/ui/button"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"

import { defineDemo } from "./types"

function BreadcrumbsDemo() {
  const [last, setLast] = React.useState("none")
  const [width, setWidth] = React.useState(192)
  const [noCurrent, setNoCurrent] = React.useState(false)
  const [linkedCurrent, setLinkedCurrent] = React.useState(false)
  const [hideHome, setHideHome] = React.useState(false)
  const [homeText, setHomeText] = React.useState("Home")
  const [overflowLast, setOverflowLast] = React.useState("none")
  const [blockAncestor, setBlockAncestor] = React.useState(false)
  const go = (name: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setLast(name)
  }
  return (
    <div id="breadcrumbs-demo" className="grid gap-4">
      <Breadcrumbs id="demo-breadcrumbs">
        <BreadcrumbsItem href="#home" onClick={go("Home")}>Home</BreadcrumbsItem>
        <BreadcrumbsItem href="#products" onClick={go("Products")}>Products</BreadcrumbsItem>
        <BreadcrumbsItem href="#laptops" onClick={go("Laptops")}>Laptops</BreadcrumbsItem>
        <BreadcrumbsItem>Notebook 15</BreadcrumbsItem>
      </Breadcrumbs>
      <Breadcrumbs separators="greater-than" aria-label="Folder path">
        <BreadcrumbsItem href="#root">Documents</BreadcrumbsItem>
        <BreadcrumbsItem href="#2026">2026</BreadcrumbsItem>
        <BreadcrumbsItem>Invoices</BreadcrumbsItem>
      </Breadcrumbs>
      <section id="breadcrumbs-overflow-demo" className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setWidth(192)}>Narrow trail</Button>
          <Button onClick={() => setWidth(640)}>Wide trail</Button>
          <Button onClick={() => setWidth(40)}>Tiny trail</Button>
          <Button onClick={() => setNoCurrent((value) => !value)}>Toggle current page</Button>
          <Button onClick={() => setLinkedCurrent((value) => !value)}>Toggle linked current page</Button>
          <Button onClick={() => setHomeText((value) => value === "Home" ? "A much longer home location" : "Home")}>Rename home</Button>
          <Button onClick={() => setHideHome((value) => !value)}>Toggle home visibility</Button>
          <Button onClick={() => setBlockAncestor((value) => !value)}>Block ancestor navigation</Button>
        </div>
        <Breadcrumbs id="breadcrumbs-overflow-demo-trail" aria-label="Responsive navigation trail" style={{ width }} design={noCurrent ? "no-current-page" : "standard"}>
          <BreadcrumbsItem hidden={hideHome} href="#breadcrumbs-home" onClick={(e) => { setOverflowLast(homeText); if (blockAncestor) e.preventDefault() }}>{homeText}</BreadcrumbsItem>
          <BreadcrumbsItem href="#breadcrumbs-products" onClick={() => setOverflowLast("Products")}>Products</BreadcrumbsItem>
          <BreadcrumbsItem href="#breadcrumbs-laptops" onClick={() => setOverflowLast("Laptops")}>Laptops</BreadcrumbsItem>
          <BreadcrumbsItem href={linkedCurrent || noCurrent ? "#breadcrumbs-notebook" : undefined}>Notebook 15</BreadcrumbsItem>
        </Breadcrumbs>
        <p>Selected ancestor: <b id="breadcrumbs-overflow-demo-last">{overflowLast}</b></p>
      </section>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        One Tab stop; ←/→ move between items, Home/End jump, Enter or Space follows a link. Last link: <b id="demo-breadcrumbs-last">{last}</b>
      </p>
    </div>
  )
}

export default defineDemo({ title: "Breadcrumbs", order: 40, Demo: BreadcrumbsDemo })
