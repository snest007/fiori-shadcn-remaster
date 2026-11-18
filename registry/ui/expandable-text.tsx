// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { Popover, PopoverBody, PopoverContent, PopoverFooter, PopoverTrigger } from "@/components/ui/popover"

// Mirrors ui5-expandable-text (Horizon, @ui5/webcomponents 2.28): text cut at `maxCharacters` with a
// Show More / Show Less link. overflowMode="InPlace" expands the text where it is; "Popover" shows the
// full text in a popover with a Close button (focus returns to the link). The link is role="button"
// with aria-expanded. Not implemented: UI5's full-screen dialog on phones (the popover is used there).

type ExpandableTextProps = React.ComponentProps<"div"> & {
  text?: string
  /** Characters shown while collapsed (default 100). */
  maxCharacters?: number
  overflowMode?: "InPlace" | "Popover"
  /** "On" shows a dash when there is no text. */
  emptyIndicatorMode?: "Off" | "On"
  /** Start expanded (InPlace only). */
  defaultExpanded?: boolean
  showMoreText?: string
  showLessText?: string
  closeText?: string
  /** Accessible descriptions of the link in Popover mode. */
  showFullTextLabel?: string
  closePopoverLabel?: string
  /** Announced in place of the dash (default "Empty Value"). */
  emptyIndicatorLabel?: string
}

function ExpandableText({
  text,
  maxCharacters = 100,
  overflowMode = "InPlace",
  emptyIndicatorMode = "Off",
  defaultExpanded = false,
  showMoreText = "Show More",
  showLessText = "Show Less",
  closeText = "Close",
  showFullTextLabel = "Show the full text",
  closePopoverLabel = "Close the popover",
  emptyIndicatorLabel = "Empty Value",
  className,
  ...props
}: ExpandableTextProps) {
  const popover = overflowMode === "Popover"
  const [expanded, setExpanded] = React.useState(defaultExpanded && !popover)
  const toggleRef = React.useRef<HTMLAnchorElement>(null)
  const exceeded = (text?.length ?? 0) > maxCharacters
  const inPlaceExpanded = expanded && !popover
  const displayed = inPlaceExpanded ? text : text?.substring(0, maxCharacters)

  const toggle = (
    <Link
      ref={toggleRef}
      className="fiori-expandable-text__toggle"
      role="button"
      aria-expanded={expanded}
      // UI5 uses these as the accessible name; that hides the visible text from it (WCAG 2.5.3).
      aria-description={popover ? (expanded ? closePopoverLabel : showFullTextLabel) : undefined}
      onClick={
        popover
          ? undefined
          : () => {
              const next = !expanded
              setExpanded(next)
              // The toggle moved down with the text: keep it on screen.
              if (next) requestAnimationFrame(() => toggleRef.current?.scrollIntoView?.({ block: "nearest" }))
            }
      }
    >
      {expanded ? showLessText : showMoreText}
    </Link>
  )

  return (
    <div data-slot="expandable-text" className={cn("fiori-expandable-text", className)} {...props}>
      <div>
        <span className="fiori-expandable-text__text">
          {text ? (
            displayed
          ) : emptyIndicatorMode === "On" ? (
            <>
              <span aria-hidden="true">–</span>
              <span className="sr-only">{emptyIndicatorLabel}</span>
            </>
          ) : null}
        </span>
        {exceeded && (
          <>
            <span className="fiori-expandable-text__ellipsis">{inPlaceExpanded ? " " : "... "}</span>
            {popover ? (
              <Popover open={expanded} onOpenChange={setExpanded}>
                <PopoverTrigger asChild>{toggle}</PopoverTrigger>
                <PopoverContent className="fiori-expandable-text__popover max-w-(--radix-popover-content-available-width)" aria-label={text}>
                  <PopoverBody>
                    <span className="fiori-expandable-text__popover-text">{text}</span>
                  </PopoverBody>
                  <PopoverFooter>
                    <div className="fiori-expandable-text__footer">
                      <Button variant="transparent" onClick={() => setExpanded(false)}>{closeText}</Button>
                    </div>
                  </PopoverFooter>
                </PopoverContent>
              </Popover>
            ) : (
              toggle
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { ExpandableText, type ExpandableTextProps }
