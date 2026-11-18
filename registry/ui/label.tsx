// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts } from "@/lib/fiori-locale"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * @accessibility htmlFor identifies the native input or button being labelled. The colon and required marker are hidden from the accessible name.
 * @accessibility Use the field required prop together with the visual required marker. Label has no keyboard stop.
 */
type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  /** Adds the Fiori required marker (a magenta asterisk). */
  required?: boolean
  /** Appends a colon, as Fiori forms do for labels placed beside their field. */
  showColon?: boolean
  texts?: Partial<LabelTexts>
  /** Truncate to one line with an ellipsis instead of wrapping. */
  truncate?: boolean
}

// Mirrors ui5-label (Horizon).
function Label({ className, children, required, showColon, truncate, texts, ...props }: LabelProps) {
  const resolvedTexts = useFioriTexts(defaultLabelTexts, defaultLabelTextsKeys, texts)
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "inline-flex max-w-full cursor-text font-(family-name:--sapFontFamily) text-(length:--sapFontSize) leading-[normal] font-normal text-(--sapContent_LabelColor)",
        "peer-disabled:opacity-(--sapContent_DisabledOpacity) group-data-[disabled=true]:opacity-(--sapContent_DisabledOpacity)",
        truncate ? "whitespace-nowrap" : "whitespace-normal",
        className
      )}
      {...props}
    >
      <span className={cn("pe-[0.075rem]", truncate && "min-w-0 overflow-hidden text-ellipsis")}>{children}</span>
      {(showColon || required) && (
        <span aria-hidden className={cn("whitespace-pre", showColon && "-ms-[0.05rem]")}>
          {showColon && resolvedTexts.colon}
          {required && (
            <span
              className={cn(
                "relative align-middle text-(length:--sapFontLargeSize) leading-0 font-bold not-italic text-(--sapField_RequiredColor)",
                showColon && "ms-0.5"
              )}
            >
              *
            </span>
          )}
        </span>
      )}
    </LabelPrimitive.Root>
  )
}

export { Label, type LabelProps }

type LabelTexts = { colon: string }
const defaultLabelTexts: LabelTexts = { colon: ":" /* UI5 LABEL_COLON */ }
const defaultLabelTextsKeys = { colon: "LABEL_COLON" } as const
export type { LabelTexts }
