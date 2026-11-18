// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import type { FioriIconData } from "@/lib/fiori-icons"
import { favorite, unfavorite } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

/**
 * @accessibility Native aria-label and aria-labelledby name the root slider. roleDescription overrides aria-roledescription and requiredText overrides the required aria-description.
 * @accessibility Arrow keys change the rating; Home/End reach zero/maximum, digit keys set it, and Space/Enter increment with wrapping. readOnly remains focusable; displayOnly and disabled have no keyboard stop.
 */
type RatingIndicatorProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Number of stars. Default 5. */
  max?: number
  size?: "S" | "M" | "L"
  disabled?: boolean
  /** Focusable but not changeable. */
  readOnly?: boolean
  /** Not focusable, display only (smaller stars, no unrated outline). */
  displayOnly?: boolean
  required?: boolean
  ratedIcon?: FioriIconData
  unratedIcon?: FioriIconData
  /** aria-roledescription (default "Rating Indicator"). */
  roleDescription?: string
  /** aria-description when required (default "Required"). */
  requiredText?: string
}

// Mirrors ui5-rating-indicator (Horizon). role="slider" with aria-valuenow / aria-valuetext "n of max".
// Keyboard (as UI5): ←/↓ decrease, →/↑ increase, Home → 0, End → max, Space/Enter increase and wrap
// to 0 past max, digit keys set the value (capped at max). Clicking the current value clears it.
// Fractional values render a half star when the fraction is between .3 and .7, else round.
function RatingIndicator({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  size = "M",
  disabled,
  readOnly,
  displayOnly,
  required,
  ratedIcon = favorite,
  unratedIcon = unfavorite,
  roleDescription = "Rating Indicator",
  requiredText = "Required",
  title = "Rating",
  className,
  onKeyDown,
  onClick,
  ...props
}: RatingIndicatorProps) {
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const set = (v: number) => {
    if (v === value) return
    if (valueProp === undefined) setInner(v)
    onValueChange?.(v)
  }
  const inactive = disabled || readOnly || displayOnly
  const stars = []
  const remainder = Math.round((value - Math.floor(value)) * 10)
  for (let i = 1; i <= max; i++) {
    let half = false
    let temp = value
    if (Math.floor(value) + 1 === i && remainder > 2 && remainder < 8) half = true
    else if (remainder <= 2) temp = Math.floor(value)
    else if (remainder >= 8) temp = Math.ceil(value)
    stars.push({ index: i, selected: i <= temp, half })
  }
  const unratedIconFor = readOnly || displayOnly || disabled ? ratedIcon : unratedIcon

  return (
    <div
      data-slot="rating-indicator"
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-display-only={displayOnly ? "" : undefined}
      role="slider"
      aria-roledescription={roleDescription}
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuetext={`${value} of ${max}`}
      aria-orientation="horizontal"
      aria-disabled={disabled || displayOnly || undefined}
      aria-readonly={!displayOnly && readOnly ? true : undefined}
      aria-description={required ? requiredText : undefined}
      tabIndex={disabled || displayOnly ? -1 : 0}
      title={title}
      className={cn("fiori-rating-indicator", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (inactive) {
          if (e.key === " ") e.preventDefault()
          return
        }
        const k = e.key
        let next: number | undefined
        if (k === "ArrowDown" || k === "ArrowLeft") next = value > 0 ? Math.round(value - 1) : value
        else if (k === "ArrowUp" || k === "ArrowRight") next = value < max ? Math.round(value + 1) : value
        else if (k === " " || k === "Enter") {
          const p = Math.round(value + 1)
          next = p > max ? 0 : p
        } else if (k === "Home") next = 0
        else if (k === "End") next = max
        else if (/^[0-9]$/.test(k)) next = Math.min(Number(k), max)
        if (next === undefined) return
        e.preventDefault()
        set(next)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (inactive) return
        const star = (e.target as HTMLElement).closest<HTMLElement>("[data-value]")
        if (!star) return
        const v = Number(star.dataset.value)
        set(v === value ? 0 : v)
      }}
      {...props}
    >
      <ul className="fiori-rating-indicator__list" aria-hidden>
        {stars.map((s) =>
          s.half ? (
            <li key={s.index} className="fiori-rating-indicator__item" data-half="" data-value={s.index}>
              <div className="fiori-rating-indicator__half fiori-rating-indicator__half--left">
                <Icon icon={ratedIcon} className="size-[1em]" />
              </div>
              <div className="fiori-rating-indicator__half fiori-rating-indicator__half--right">
                <Icon icon={unratedIcon} className="size-[1em]" />
              </div>
            </li>
          ) : (
            <li
              key={s.index}
              className="fiori-rating-indicator__item"
              data-selected={s.selected ? "" : undefined}
              data-value={s.index}
            >
              <Icon icon={s.selected ? ratedIcon : unratedIconFor} className="size-full" />
            </li>
          )
        )}
      </ul>
    </div>
  )
}

export { RatingIndicator, type RatingIndicatorProps }
