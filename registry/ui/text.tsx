// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"

/** @accessibility Text remains readable body content; maxLines only limits its visual presentation. Supply meaningful text through children and retain label/description relationships in surrounding compositions. */
type TextProps = React.ComponentProps<"span"> & {
  /** Truncate after this many lines with an ellipsis. Default: unlimited. */
  maxLines?: number
}

// Mirrors ui5-text (Horizon): body text with optional multi-line truncation (line-clamp).
function Text({ maxLines, className, style, ...props }: TextProps) {
  return (
    <span
      data-slot="text"
      className={cn(
        // UI5 always lays the host out as a -webkit-inline-box; the clamp only applies when maxLines is set.
        "[display:-webkit-inline-box] [-webkit-box-orient:vertical] max-w-full cursor-text overflow-hidden whitespace-normal break-words",
        "font-(family-name:--sapFontFamily) text-(length:--sapFontSize) leading-[normal] text-(--sapTextColor)",
        maxLines != null && "[-webkit-line-clamp:var(--fiori-text-max-lines)] [line-clamp:var(--fiori-text-max-lines)]",
        maxLines === 1 && "break-all",
        className
      )}
      style={maxLines != null ? ({ "--fiori-text-max-lines": maxLines, ...style } as React.CSSProperties) : style}
      {...props}
    />
  )
}

export { Text, type TextProps }
