// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

// Pressed colors per design, from ui5-toggle-button (Horizon). Default and transparent already get
// their pressed look from Button's aria-pressed styles; the others switch to the *_Selected_* tokens.
const pressedStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "",
  transparent: "aria-pressed:hover:bg-(--sapButton_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Selected_Hover_BorderColor)",
  emphasized: [
    "aria-pressed:bg-(--sapButton_Selected_Background) aria-pressed:border-(--sapButton_Selected_BorderColor) aria-pressed:text-(--sapButton_Selected_TextColor)",
    "aria-pressed:hover:bg-(--sapButton_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Selected_Hover_BorderColor) aria-pressed:hover:text-(--sapButton_Selected_TextColor)",
  ].join(" "),
  positive: [
    "aria-pressed:bg-(--sapButton_Accept_Selected_Background) aria-pressed:border-(--sapButton_Accept_Selected_BorderColor) aria-pressed:text-(--sapButton_Accept_Selected_TextColor)",
    "aria-pressed:hover:bg-(--sapButton_Accept_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Accept_Selected_Hover_BorderColor) aria-pressed:hover:text-(--sapButton_Accept_Selected_TextColor)",
  ].join(" "),
  negative: [
    "aria-pressed:bg-(--sapButton_Reject_Selected_Background) aria-pressed:border-(--sapButton_Reject_Selected_BorderColor) aria-pressed:text-(--sapButton_Reject_Selected_TextColor)",
    "aria-pressed:hover:bg-(--sapButton_Reject_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Reject_Selected_Hover_BorderColor) aria-pressed:hover:text-(--sapButton_Reject_Selected_TextColor)",
  ].join(" "),
  attention: [
    "aria-pressed:bg-(--sapButton_Attention_Selected_Background) aria-pressed:border-(--sapButton_Attention_Selected_BorderColor) aria-pressed:text-(--sapButton_Attention_Selected_TextColor)",
    "aria-pressed:hover:bg-(--sapButton_Attention_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Attention_Selected_Hover_BorderColor) aria-pressed:hover:text-(--sapButton_Attention_Selected_TextColor)",
  ].join(" "),
}

/**
 * @accessibility Native aria-label, aria-labelledby and aria-describedby reach the button; aria-pressed is owned by ToggleButton.
 * @accessibility Space and Enter toggle the pressed state; disabled buttons are removed from keyboard navigation.
 */
type ToggleButtonProps = Omit<ButtonProps, "asChild"> &
  Pick<React.ComponentProps<typeof TogglePrimitive.Root>, "pressed" | "defaultPressed" | "onPressedChange">

// Mirrors ui5-toggle-button: a Button that stays pressed (aria-pressed) until activated again.
// Space and Enter toggle (native <button>).
function ToggleButton({ className, variant = "default", pressed, defaultPressed, onPressedChange, disabled, ...props }: ToggleButtonProps) {
  return (
    <TogglePrimitive.Root asChild pressed={pressed} defaultPressed={defaultPressed} onPressedChange={onPressedChange} disabled={disabled}>
      <Button
        data-slot="toggle-button"
        variant={variant}
        disabled={disabled}
        className={cn(pressedStyles[variant ?? "default"], className)}
        {...props}
      />
    </TogglePrimitive.Root>
  )
}

export { ToggleButton, type ToggleButtonProps }
