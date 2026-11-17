// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

// UI5 2.28 Bar fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { cn } from "@/lib/utils"

// Mirrors ui5-bar (Horizon): a header / subheader / footer bar with start, middle and end areas.
// Like UI5 it has no ARIA role by default (it takes its meaning from where it is placed). Pass
// role="toolbar" (plus an aria-label) only if it really behaves as a toolbar; for 3+ interactive
// items prefer <Toolbar>, which also provides arrow-key navigation.
type BarDesign = "header" | "subheader" | "footer" | "floating-footer"

type BarProps = React.ComponentProps<"div"> & {
  design?: BarDesign
  /** Content at the start (left in LTR). */
  startContent?: React.ReactNode
  /** Content at the end (right in LTR). */
  endContent?: React.ReactNode
}

const designClasses: Record<BarDesign, string> = {
  header: "h-(--fiori-bar-base-height) bg-(--sapPageHeader_Background) shadow-(--sapContent_HeaderShadow)",
  subheader:
    "h-(--fiori-bar-subheader-height) mt-(--fiori-bar-subheader-margin-top) bg-(--sapPageHeader_Background) shadow-(--sapContent_HeaderShadow)",
  footer:
    "h-(--fiori-bar-base-height) bg-(--sapPageFooter_Background) border-t-[0.0625rem] border-solid border-t-(--sapPageFooter_BorderColor) shadow-none",
  "floating-footer":
    "h-(--fiori-bar-base-height) rounded-(--sapElement_BorderCornerRadius) bg-(--sapPageFooter_Background) shadow-(--sapContent_Shadow1)",
}

function Bar({ design = "header", startContent, endContent, children, className, ...props }: BarProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [shrinked, setShrinked] = React.useState(false)

  // UI5: as soon as one area is wider than a third of the bar, the areas drop their minimum width.
  React.useLayoutEffect(() => {
    const bar = ref.current
    if (!bar) return
    const update = () => {
      const width = bar.offsetWidth
      setShrinked([...bar.children].some((c) => (c as HTMLElement).offsetWidth > width / 3))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(bar)
    for (const c of bar.children) ro.observe(c)
    return () => ro.disconnect()
  }, [])

  const area = cn(
    "fiori-bar__content flex items-center",
    shrinked
      ? "h-full min-w-0 overflow-x-clip"
      : "min-w-[calc(30%-calc(var(--fiori-bar-start-container-padding-start)+var(--fiori-bar-end-container-padding-end)+(2*var(--fiori-bar-mid-container-padding-start-end))))]"
  )

  return (
    <div
      data-slot="bar" data-sap-ui-fastnavgroup="true"
      data-design={design}
      // Content-box like the UI5 host, so the footer's top border adds to the height.
      className={cn("box-content block w-full", designClasses[design], className)}
      {...props}
    >
      {/* Inner root inherits background, shadow and radius (as .ui5-bar-root does, so the shadow is painted twice). */}
      <div
        ref={ref}
        className="flex size-full min-w-0 items-center justify-between overflow-x-clip [background-color:inherit] [border-radius:inherit] [box-shadow:inherit]"
      >
        <div data-slot="bar-start" className={cn(area, "flex-[0_1_auto] ps-(--fiori-bar-start-container-padding-start)")}>
          {startContent}
        </div>
        <div
          data-slot="bar-middle"
          className={cn(area, "flex-[1_1_auto] justify-center overflow-x-clip px-(--fiori-bar-mid-container-padding-start-end)")}
        >
          {children}
        </div>
        <div data-slot="bar-end" className={cn(area, "flex-[0_0_auto] pe-(--fiori-bar-end-container-padding-end)")}>
          {endContent}
        </div>
      </div>
    </div>
  )
}

export { Bar, type BarProps, type BarDesign }
