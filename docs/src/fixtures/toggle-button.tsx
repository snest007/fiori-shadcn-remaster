import type { ButtonProps } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { ToggleButton } from "@/components/ui/toggle-button"
import { edit } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

const variants = ["default", "emphasized", "transparent", "positive", "negative", "attention"] as const
type Props = { variant: NonNullable<ButtonProps["variant"]>; pressed?: boolean; disabled?: boolean; icon?: boolean; text?: string }

export default defineFixtures<Props>({
  name: "toggle-button",
  cases: [
    ...variants.map((variant) => ({ id: `toggle-button-${variant}`, props: { variant, text: "Toggle" } })),
    ...variants.map((variant) => ({ id: `toggle-button-${variant}-pressed`, props: { variant, text: "Toggle", pressed: true } })),
    { id: "toggle-button-pressed-disabled", props: { variant: "default", text: "Toggle", pressed: true, disabled: true } },
    { id: "toggle-button-icon-pressed", props: { variant: "default", text: "Edit", icon: true, pressed: true } },
    { id: "toggle-button-icon-only-pressed", props: { variant: "transparent", icon: true, pressed: true } },
  ],
  react: ({ variant, pressed, disabled, icon, text }) => (
    <ToggleButton variant={variant} defaultPressed={pressed} disabled={disabled} size={text ? "default" : "icon"} aria-label={text ? undefined : "Edit"}>
      {icon && <Icon icon={edit} />}
      {text}
    </ToggleButton>
  ),
})
