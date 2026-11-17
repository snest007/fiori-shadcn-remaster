// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"

type TitleLevel = "H1" | "H2" | "H3" | "H4" | "H5" | "H6"

type TitleProps = Omit<React.ComponentProps<"h2">, "size"> & {
  /** Semantic heading level (h1–h6). Default H2, as in UI5. */
  level?: TitleLevel
  /** Visual size, independent of the level. Default H5 (1rem), as in UI5. */
  size?: TitleLevel
  /** "Normal" wraps; "None" keeps one line and truncates with an ellipsis. */
  wrappingType?: "Normal" | "None"
}

const sizes: Record<TitleLevel, string> = {
  H1: "text-(length:--sapFontHeader1Size)",
  H2: "text-(length:--sapFontHeader2Size)",
  H3: "text-(length:--sapFontHeader3Size)",
  H4: "text-(length:--sapFontHeader4Size)",
  H5: "text-(length:--sapFontHeader5Size)",
  H6: "text-(length:--sapFontHeader6Size)",
}

// Mirrors ui5-title (Horizon). The heading element is the block; the inner span carries the
// truncation box UI5 puts on its .ui5-title-root.
function Title({ level = "H2", size = "H5", wrappingType = "Normal", className, children, ...props }: TitleProps) {
  const Tag = level.toLowerCase() as "h2"
  return (
    <Tag
      data-slot="title"
      data-size={size}
      className={cn(
        "m-0 block max-w-full cursor-text font-(family-name:--sapFontHeaderFamily) font-normal leading-[normal]",
        "text-(--sapGroup_TitleTextColor) [text-shadow:var(--sapContent_TextShadow)]",
        sizes[size],
        wrappingType === "None" ? "whitespace-nowrap" : "whitespace-pre-line",
        className
      )}
      {...props}
    >
      <span className="relative inline-block max-w-full overflow-hidden text-ellipsis whitespace-[inherit] align-bottom">{children}</span>
    </Tag>
  )
}

export { Title, type TitleProps, type TitleLevel }
