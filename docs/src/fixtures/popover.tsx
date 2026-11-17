import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverBody, PopoverContent, PopoverFooter, PopoverHeader, PopoverTitle } from "@/components/ui/popover"

import { defineFixtures } from "../fixture-types"

/** Cell frame: clips the popup shadow and pins Radix's floating wrapper in place. */
export const inPlace = "overflow-hidden p-3 [&_[data-radix-popper-content-wrapper]]:static! [&_[data-radix-popper-content-wrapper]]:transform-none!"

type Props = { title?: boolean; footer?: boolean; arrow?: boolean }

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
  react: ({ title, footer, arrow }) =>
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
    <div className={inPlace}>
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
function customHost(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) return node.map(customHost)
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node
  const children = customHost(node.props.children)
  if (node.type === PopoverContent) return React.cloneElement(node, { asChild: true } as Partial<typeof node.props>, <div data-custom-host="popover" role="presentation" tabIndex={13} id="popover-caller-host">{children}</div>)
  return node.props.children === undefined ? node : React.cloneElement(node, {}, children)
}
const baseCase = fixtureSet.cases.find((entry) => entry.id === "popover-header-footer")!
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "popover-custom-host", props: { ...baseCase.props, customHost: true } }],
  react: (props: typeof baseCase.props & { customHost?: boolean }) => props.customHost ? customHost(fixtureSet.react(props)) : fixtureSet.react(props),
}
