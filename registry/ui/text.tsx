import * as React from "react"

import { cn } from "@/lib/utils"

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
