// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"

type CardProps = React.ComponentProps<"div"> & {
  /** Accessible name; announced as "Card <name>". */
  accessibleName?: string
}

// Mirrors ui5-card (Horizon): a tile surface with an optional <CardHeader> and free content.
function Card({ accessibleName, className, children, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      role="region"
      aria-label={accessibleName ? `Card ${accessibleName}` : "Card"}
      className={cn("fiori-card", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** @accessibility accessibleName names the Card region. CardHeader owns a focusable group or button named by titleText and subtitleText; additionalText describes status. Enter/Space activate an interactive header. roleDescription describes its main focus target; icon-only actions need their own aria-label. */
type CardHeaderProps = Omit<React.ComponentProps<"div">, "title"> & {
  titleText?: React.ReactNode
  subtitleText?: React.ReactNode
  /** Status text shown at the end, e.g. "3 of 10". */
  additionalText?: React.ReactNode
  /** An <Avatar>, <Icon> or <img> shown before the title. */
  avatar?: React.ReactNode
  /** Actions (e.g. a transparent <Button>) shown at the end. */
  action?: React.ReactNode
  /** Makes the header a button (Enter / Space / click fire onClick) with hover and active states. */
  interactive?: boolean
  /** aria-level of the title heading. Default 3. */
  titleLevel?: number
  /** aria-roledescription (defaults: "Card Header" / "Interactive Card Header"). */
  roleDescription?: string
}

// Mirrors ui5-card-header (Horizon).
function CardHeader({
  titleText,
  subtitleText,
  additionalText,
  avatar,
  action,
  interactive,
  titleLevel = 3,
  roleDescription,
  className,
  onClick,
  onKeyDown,
  onKeyUp,
  ...props
}: CardHeaderProps) {
  const id = React.useId()
  const [active, setActive] = React.useState(false)
  const [actionFocus, setActionFocus] = React.useState(false)
  // UI5 labels the focusable element by title, subtitle, status and avatar. For the interactive
  // (button) header we let the name come from its content (title + subtitle) and describe it by the
  // status text, so the accessible name matches the visible label (WCAG 2.5.3).
  const labelledBy = interactive
    ? undefined
    : [titleText && `${id}-title`, subtitleText && `${id}-subtitle`, additionalText && `${id}-additional`].filter(Boolean).join(" ")
  // Only key events on the header itself count, not ones bubbling from the action slot.
  const own = (e: React.SyntheticEvent) => interactive && !(e.target as HTMLElement).closest(".fiori-card-header__end")
  return (
    <div
      data-slot="card-header"
      data-interactive={interactive ? "" : undefined}
      data-active={active ? "" : undefined}
      data-action-focus={actionFocus ? "" : undefined}
      className={cn("fiori-card-header", className)}
      onClick={(e) => {
        if (own(e)) onClick?.(e)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (!own(e)) return
        const enter = e.key === "Enter"
        const space = e.key === " "
        setActive(enter || space)
        if (enter) onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        if (space) e.preventDefault()
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (!own(e)) return
        setActive(false)
        if (e.key === " ") onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
      }}
      {...props}
    >
      <div
        className="fiori-card-header__main"
        role={interactive ? "button" : "group"}
        tabIndex={0}
        aria-labelledby={labelledBy || undefined}
        aria-describedby={interactive && additionalText ? `${id}-additional` : undefined}
        aria-roledescription={roleDescription ?? (interactive ? "Interactive Card Header" : "Card Header")}
      >
        {avatar && (
          <div className="fiori-card-header__avatar">
            {avatar}
          </div>
        )}
        <div className="fiori-card-header__text">
          {titleText && (
            <div id={`${id}-title`} className="fiori-card-header__title" role="heading" aria-level={titleLevel}>
              {titleText}
            </div>
          )}
          {subtitleText && (
            <div id={`${id}-subtitle`} className="fiori-card-header__subtitle">
              {subtitleText}
            </div>
          )}
        </div>
      </div>
      {(action || additionalText) && (
        <div className="fiori-card-header__end" onFocus={() => setActionFocus(true)} onBlur={() => setActionFocus(false)}>
          {action && <div className="fiori-card-header__action">{action}</div>}
          {additionalText && (
            <div className="fiori-card-header__additional">
              <span id={`${id}-additional`} dir="auto">
                {additionalText}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Content area of a Card (UI5's role="group" "Card Content" part). */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" role="group" aria-label="Card Content" className={className} {...props} />
}

export { Card, CardHeader, CardContent, type CardProps, type CardHeaderProps }
