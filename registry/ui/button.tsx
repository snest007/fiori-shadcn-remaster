import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Mirrors ui5-button (Horizon). Variants are Fiori's own button designs, not shadcn's.
// Every value comes from --sapButton_* tokens or --fiori-button-* parameters (density aware).
const buttonVariants = cva(
  [
    "fiori-button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none align-middle",
    "h-(--fiori-button-base-height) min-w-(--fiori-button-base-min-width) px-(--fiori-button-base-padding)",
    "rounded-(--fiori-button-border-radius) border-(length:--sapButton_BorderWidth) border-solid",
    "font-(family-name:--fiori-button-fontfamily) text-(length:--sapFontSize) leading-[normal]",
    "cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]",
    "gap-(--fiori-button-base-icon-margin) [&_svg]:shrink-0",
    // Keyboard focus: 2px inner ring inset by 1px (UI5 draws it with ::after).
    "focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:inset-px focus-visible:after:box-border",
    "focus-visible:after:rounded-(--fiori-button-focused-border-radius) focus-visible:after:content-['']",
    "disabled:cursor-default disabled:opacity-(--sapContent_DisabledOpacity) disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-(--sapButton_Background) border-(--sapButton_BorderColor) text-(--sapButton_TextColor)",
          "hover:bg-(--sapButton_Hover_Background) hover:border-(--sapButton_Hover_BorderColor) hover:text-(--sapButton_Hover_TextColor)",
          "active:bg-(--sapButton_Active_Background) active:border-(--sapButton_Active_BorderColor) active:text-(--sapButton_Active_TextColor)",
          "aria-pressed:bg-(--sapButton_Selected_Background) aria-pressed:border-(--sapButton_Selected_BorderColor) aria-pressed:text-(--sapButton_Selected_TextColor)",
          "aria-pressed:hover:bg-(--sapButton_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Selected_Hover_BorderColor)",
        ],
        emphasized: [
          "bg-(--sapButton_Emphasized_Background) border-(--sapButton_Emphasized_BorderColor) text-(--sapButton_Emphasized_TextColor)",
          "border-(length:--fiori-button-emphasized-border-width) font-(family-name:--sapButton_Emphasized_FontFamily)",
          "hover:bg-(--sapButton_Emphasized_Hover_Background) hover:border-(--sapButton_Emphasized_Hover_BorderColor) hover:text-(--sapButton_Emphasized_Hover_TextColor)",
          "active:bg-(--sapButton_Emphasized_Active_Background) active:border-(--sapButton_Emphasized_Active_BorderColor) active:text-(--sapButton_Emphasized_Active_TextColor)",
          // Emphasized focus: contrast ring (::after) over a focus-colored ring (::before).
          "focus-visible:before:pointer-events-none focus-visible:before:absolute focus-visible:before:inset-px focus-visible:before:box-border focus-visible:before:content-['']",
          "focus-visible:before:rounded-(--fiori-button-focused-border-radius) focus-visible:before:[border:var(--fiori-button-emphasized-focused-border-before)]",
        ],
        transparent: [
          "bg-(--sapButton_Lite_Background) border-(--sapButton_Lite_BorderColor) text-(--sapButton_Lite_TextColor)",
          "hover:bg-(--sapButton_Lite_Hover_Background) hover:border-(--sapButton_Lite_Hover_BorderColor) hover:text-(--sapButton_Lite_Hover_TextColor)",
          "active:bg-(--sapButton_Lite_Active_Background) active:border-(--sapButton_Lite_Active_BorderColor) active:text-(--sapButton_Active_TextColor)",
          "aria-pressed:bg-(--sapButton_Selected_Background) aria-pressed:border-(--sapButton_Selected_BorderColor) aria-pressed:text-(--sapButton_Selected_TextColor)",
        ],
        positive: [
          "bg-(--sapButton_Accept_Background) border-(--sapButton_Accept_BorderColor) text-(--sapButton_Accept_TextColor)",
          "hover:bg-(--sapButton_Accept_Hover_Background) hover:border-(--sapButton_Accept_Hover_BorderColor) hover:text-(--sapButton_Accept_Hover_TextColor)",
          "active:bg-(--sapButton_Accept_Active_Background) active:border-(--sapButton_Accept_Active_BorderColor) active:text-(--sapButton_Accept_Active_TextColor)",
        ],
        negative: [
          "bg-(--sapButton_Reject_Background) border-(--sapButton_Reject_BorderColor) text-(--sapButton_Reject_TextColor)",
          "hover:bg-(--sapButton_Reject_Hover_Background) hover:border-(--sapButton_Reject_Hover_BorderColor) hover:text-(--sapButton_Reject_Hover_TextColor)",
          "active:bg-(--sapButton_Reject_Active_Background) active:border-(--sapButton_Reject_Active_BorderColor) active:text-(--sapButton_Reject_Active_TextColor)",
        ],
        attention: [
          "bg-(--sapButton_Attention_Background) border-(--sapButton_Attention_BorderColor) text-(--sapButton_Attention_TextColor)",
          "hover:bg-(--sapButton_Attention_Hover_Background) hover:border-(--sapButton_Attention_Hover_BorderColor) hover:text-(--sapButton_Attention_Hover_TextColor)",
          "active:bg-(--sapButton_Attention_Active_Background) active:border-(--sapButton_Attention_Active_BorderColor) active:text-(--sapButton_Attention_Active_TextColor)",
        ],
      },
      size: {
        default: "",
        // Icon-only: square, no horizontal padding (ui5-button[icon-only]).
        icon: "px-0 w-(--fiori-button-base-min-width) min-w-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

/**
 * @accessibility Tab reaches the native button; Enter and Space activate it. The inner focus ring uses :focus-visible.
 * @accessibility Native aria-label, aria-labelledby and aria-describedby props land on the button (or the asChild host). Label icon-only actions with aria-label; keep the native button keyboard semantics when composing asChild.
 */
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
