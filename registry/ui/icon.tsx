import * as React from "react"

import type { FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"

type IconProps = Omit<React.ComponentProps<"svg">, "children"> & {
  icon: FioriIconData
  /** Accessible name. Omit for decorative icons (they get aria-hidden). */
  label?: string
}

function Icon({ icon, label, className, ...props }: IconProps) {
  return (
    <svg
      data-slot="icon"
      data-icon={icon.name}
      viewBox={icon.viewBox}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn("size-4 shrink-0", !icon.ltr && "rtl:-scale-x-100", className)}
      {...props}
    >
      <path d={icon.path} />
    </svg>
  )
}

export { Icon, type IconProps }
