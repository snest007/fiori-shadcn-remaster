import * as React from "react"

import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"

import { defineDemo } from "./types"

function BreadcrumbsDemo() {
  const [last, setLast] = React.useState("none")
  const go = (name: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setLast(name)
  }
  return (
    <div className="grid gap-4">
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
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        One Tab stop; ←/→ move between items, Home/End jump, Enter or Space follows a link. Last link: <b id="demo-breadcrumbs-last">{last}</b>
      </p>
    </div>
  )
}

export default defineDemo({ title: "Breadcrumbs", order: 40, Demo: BreadcrumbsDemo })
