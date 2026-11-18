// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

import { decline } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

/**
 * @accessibility A token owns role=option and aria-selected and must be inside a named listbox or Tokenizer. text supplies its name; description overrides aria-description and deleteLabel overrides the icon tooltip.
 * @accessibility Space toggles selection. Backspace/Delete request removal when editable; the caller removes the token. A Tokenizer owns roving focus, multi-selection and neighbour focus return.
 */
type TokenProps = Omit<React.ComponentProps<"div">, "children" | "onSelect"> & {
  /** The token's text. */
  text: string
  /** Identifies the token in Tokenizer / MultiInput callbacks. Defaults to `text`. */
  value?: string
  selected?: boolean
  defaultSelected?: boolean
  /** Fires when the user toggles the selection (click, Space). */
  onSelectedChange?: (selected: boolean) => void
  /** No delete icon, can't be deleted; selection is shown as highlighted text. */
  readOnly?: boolean
  /** Fires when the delete icon is clicked or Backspace / Delete is pressed on the token. */
  onDelete?: (via: "click" | "backspace" | "delete") => void
  /** Tooltip of the delete icon. */
  deleteLabel?: string
  /** Screen-reader description (UI5: "Token", plus "Deletable" when it can be deleted). */
  description?: string
  texts?: Partial<TokenTexts>
}

// Mirrors ui5-token (Horizon). Host + .ui5-token--wrapper are merged into one focusable element with
// role="option" (it lives in a Tokenizer's listbox). Inside a <Tokenizer>, the tokenizer owns selection,
// keyboard navigation and deletion; on its own, a token toggles its selection on click / Space.
function Token({
  className,
  text,
  value: _value,
  selected: selectedProp,
  defaultSelected = false,
  onSelectedChange,
  readOnly,
  onDelete,
  deleteLabel: deleteLabelProp,
  description,
  texts,
  tabIndex = -1,
  onClick,
  onKeyDown,
  ...props
}: TokenProps) {
  const { t } = useFioriLocale()
  const resolvedTexts = useFioriTexts(defaultTokenTexts, defaultTokenTextsKeys, texts)
  const deleteLabel = deleteLabelProp ?? resolvedTexts.deleteLabel
  const [uncontrolled, setUncontrolled] = React.useState(defaultSelected)
  const selected = selectedProp ?? uncontrolled
  const deleting = React.useRef(false)
  const toggle = () => {
    if (selectedProp === undefined) setUncontrolled(!selected)
    onSelectedChange?.(!selected)
  }
  return (
    <div
      data-slot="token"
      role="option"
      aria-selected={selected}
      aria-description={description ?? (readOnly ? resolvedTexts.token : `${resolvedTexts.token} ${resolvedTexts.deletable}`)}
      data-readonly={readOnly ? "" : undefined}
      tabIndex={tabIndex}
      className={cn("fiori-token", className)}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || deleting.current) return
        toggle()
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        const plain = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
        if (!readOnly && plain && (e.key === "Backspace" || e.key === "Delete")) {
          e.preventDefault()
          onDelete?.(e.key === "Backspace" ? "backspace" : "delete")
        }
        if (e.key === " " && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          toggle()
        }
      }}
      {...props}
    >
      <span className="fiori-token__text">{text}</span>
      {!readOnly && (
        <span
          className="fiori-token__icon"
          title={deleteLabel}
          aria-hidden
          // UI5 deletes on mousedown (and keeps focus where it is), so the click never selects the token.
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            deleting.current = true
            onDelete?.("click")
            setTimeout(() => (deleting.current = false))
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon icon={decline} className="size-full" />
        </span>
      )}
    </div>
  )
}

export { Token, type TokenProps }

type TokenTexts = { token: string; deletable: string; deleteLabel: string }
const defaultTokenTexts: TokenTexts = { token: "Token", /* UI5 TOKEN_ARIA_LABEL */ deletable: "Deletable", /* UI5 TOKEN_ARIA_DELETABLE */ deleteLabel: "Delete" /* UI5 TOKEN_ARIA_DELETE */ }
const defaultTokenTextsKeys = { token: "TOKEN_ARIA_LABEL", deletable: "TOKEN_ARIA_DELETABLE", deleteLabel: "TOKEN_ARIA_DELETE" } as const
export type { TokenTexts }
