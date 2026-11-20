import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverBody, PopoverContent, PopoverFooter, PopoverHeader, PopoverTitle } from "@/components/ui/popover"

import { defineFixtures } from "../fixture-types"

/** Cell frame: clips the popup shadow and pins Radix's floating wrapper in place. */
export const inPlace = "overflow-hidden p-3 [&_[data-radix-popper-content-wrapper]]:static! [&_[data-radix-popper-content-wrapper]]:transform-none!"

type Props = { title?: boolean; footer?: boolean; arrow?: boolean; rtl?: boolean; reactHost?: boolean }

// The popover surface is rendered open, in place (no portal); the Radix positioning wrapper is made
// static so the surface sits inside the cell. UI5's side does the same (popover.ui5.ts).
const fixtureSet = defineFixtures<Props>({
  name: "popover",
  cases: [
    { id: "popover", props: {} },
    { id: "popover-header-footer", props: { title: true, footer: true } },
    { id: "popover-arrow", props: { title: true, arrow: true } },
  ],
  // The arrow's position depends on the live placement against the opener (UI5 computes it while
  // open, in the top layer), so the arrow case is visually checked only (see tests/popover.spec.ts).
  skipCompare: ["popover-arrow"],
  react: ({ title, footer, arrow, rtl }) =>
    arrow ? (
      // Positioned for real against an anchor; the transformed frame contains the fixed popper.
      <div className="relative h-44 w-64 overflow-hidden p-3 [transform:translateZ(0)]">
        <Popover open>
          <PopoverAnchor asChild>
            <Button>Opener</Button>
          </PopoverAnchor>
          <PopoverContent portal={false} side="bottom" align="start" onOpenAutoFocus={(e) => e.preventDefault()} className="w-56">
            <PopoverHeader>
              <PopoverTitle>Popover title</PopoverTitle>
            </PopoverHeader>
            <PopoverBody>Popover content text.</PopoverBody>
          </PopoverContent>
        </Popover>
      </div>
    ) : (
    <div className={inPlace} dir={rtl ? "rtl" : undefined}>
      <Popover open>
        <PopoverContent portal={false} aria-label={title ? undefined : "Popover"} hideArrow onOpenAutoFocus={(e) => e.preventDefault()} className="w-56">
          {title && (
            <PopoverHeader>
              <PopoverTitle>Popover title</PopoverTitle>
            </PopoverHeader>
          )}
          <PopoverBody>Popover content text.</PopoverBody>
          {footer && (
            <PopoverFooter>
              <Button variant="emphasized">OK</Button>
            </PopoverFooter>
          )}
        </PopoverContent>
      </Popover>
    </div>
    ),
})


// E4: consumer host replacement changes the DOM host while the component keeps
// the owning semantics. The native renderer uses the same underlying state.
function ChildrenOnlyHost({ children }: React.ComponentProps<"div">) {
  return <section data-custom-output="popover">{children}</section>
}
function customHost(node: React.ReactNode, reactHost = false, rtl = false): React.ReactNode {
  if (Array.isArray(node)) return node.map((child) => customHost(child, reactHost, rtl))
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node
  const children = customHost(node.props.children, reactHost, rtl)
  if (node.type === PopoverContent) {
    const descriptionId = `popover-host-description-${rtl ? "rtl" : "ltr"}`
    const hostile = { role: "presentation", tabIndex: 13, id: "popover-caller-host", "aria-label": "Wrong name", "aria-labelledby": "missing-title", "aria-describedby": "missing-description" }
    return React.cloneElement(node, { asChild: true, ...(reactHost ? { id: `popover-react-surface-${rtl ? "rtl" : "ltr"}`, "aria-label": "Popover title", "aria-describedby": descriptionId, ref: (host: HTMLDivElement | null) => host?.setAttribute("data-owned-ref", "true") } : {}) } as Partial<typeof node.props>,
      reactHost ? <ChildrenOnlyHost {...hostile}>{children}<span id={descriptionId} className="sr-only" aria-hidden="true">Popover description</span></ChildrenOnlyHost>
        : <div data-custom-host="popover" {...hostile}>{children}</div>)
  }
  return node.props.children === undefined ? node : React.cloneElement(node, {}, children)
}
const baseCase = fixtureSet.cases.find((entry) => entry.id === "popover-header-footer")!
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "popover-custom-host", props: { ...baseCase.props, customHost: true } },
    ...[false, true].map((rtl) => ({ id: `popover-react-host${rtl ? "-rtl" : ""}`, props: { ...baseCase.props, customHost: true, reactHost: true, rtl } }))],
  react: (props: typeof baseCase.props & { customHost?: boolean; reactHost?: boolean }) => props.customHost ? customHost(fixtureSet.react(props), props.reactHost, props.rtl) : fixtureSet.react(props),
}
