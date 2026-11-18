// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"

// ObjectIdentifier and ObjectAttribute after SAPUI5's sap.m.ObjectIdentifier / sap.m.ObjectAttribute (Horizon) and
// the Fiori guidelines "Object Identifier" / "Object Display Components". No UI5 Web Components exist: styles follow
// sap.m's compiled sap_horizon CSS with --sap* tokens.
// ObjectIdentifier: a bold title (a link when `titleActive`) with a secondary text below, in the label color.
// ObjectAttribute: "Title: text" in the label color; `active` turns the text into a link.

/**
 * @accessibility title/text name the object. Native aria-label / aria-labelledby land on the outer div; titleActive creates the inner link named by title. ObjectAttribute links take their name from text.
 * @accessibility Tab reaches active title/attribute links. Enter invokes onTitlePress/onPress when no href is supplied; href enables native link navigation. titleLevel sets the title heading element.
 */
type ObjectIdentifierProps = Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode
  text?: React.ReactNode
  /** Title as a link (pass `href`, or `onTitlePress`). */
  titleActive?: boolean
  titleHref?: string
  onTitlePress?: (event: React.MouseEvent<HTMLAnchorElement>) => void
  /** Heading level for the title (SAPUI5 renders it as text by default). */
  titleLevel?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6"
}

function ObjectIdentifier({ title, text, titleActive, titleHref, onTitlePress, titleLevel, className, ...props }: ObjectIdentifierProps) {
  const titleNode =
    title == null || title === "" ? null : titleActive ? (
      <a
        className="fiori-object-identifier__link"
        href={titleHref}
        role={titleHref ? undefined : "link"}
        tabIndex={0}
        onClick={onTitlePress}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !titleHref) {
            e.preventDefault()
            e.currentTarget.click()
          }
        }}
      >
        {title}
      </a>
    ) : (
      <span className="fiori-object-identifier__title-text">{title}</span>
    )
  const TitleTag = (titleLevel ? titleLevel.toLowerCase() : "div") as "div"
  return (
    <div data-slot="object-identifier" className={cn("fiori-object-identifier", className)} {...props}>
      {titleNode && <TitleTag className="fiori-object-identifier__title">{titleNode}</TitleTag>}
      {text != null && text !== "" && (
        <div className={cn("fiori-object-identifier__text", titleNode && "fiori-object-identifier__text--below")}>{text}</div>
      )}
    </div>
  )
}

type ObjectAttributeProps = Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode
  text?: React.ReactNode
  /** Text as a link (pass `href`, or `onPress`). */
  active?: boolean
  href?: string
  onPress?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

function ObjectAttribute({ title, text, active, href, onPress, className, ...props }: ObjectAttributeProps) {
  const hasTitle = title != null && title !== ""
  return (
    <div data-slot="object-attribute" data-active={active ? "" : undefined} className={cn("fiori-object-attribute", className)} {...props}>
      {hasTitle && (
        <>
          <span className="fiori-object-attribute__title">{title}</span>
          <span className="fiori-object-attribute__colon">{": "}</span>
        </>
      )}
      {active ? (
        <a
          className="fiori-object-attribute__text fiori-object-attribute__link"
          href={href}
          role={href ? undefined : "link"}
          tabIndex={0}
          onClick={onPress}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !href) {
              e.preventDefault()
              e.currentTarget.click()
            }
          }}
        >
          {text}
        </a>
      ) : (
        <span className="fiori-object-attribute__text">{text}</span>
      )}
    </div>
  )
}

export { ObjectIdentifier, ObjectAttribute, type ObjectIdentifierProps, type ObjectAttributeProps }
