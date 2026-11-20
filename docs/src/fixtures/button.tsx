import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { add, edit } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

const variants = ["default", "emphasized", "transparent", "positive", "negative", "attention"] as const
type Props = { variant: (typeof variants)[number]; text?: string; icon?: "edit" | "add"; disabled?: boolean }
const icons = { edit, add }

export default defineFixtures<Props>({
  name: "button",
  cases: [
    ...variants.map((variant) => ({ id: `button-${variant}`, props: { variant, text: "Button" } })),
    ...variants.map((variant) => ({ id: `button-${variant}-disabled`, props: { variant, text: "Button", disabled: true } })),
    { id: "button-icon-text", props: { variant: "default", text: "Edit", icon: "edit" } },
    { id: "button-icon-only", props: { variant: "transparent", icon: "add" } },
  ],
  react: ({ variant, text, icon, disabled }) => (
    <Button variant={variant} size={text ? "default" : "icon"} disabled={disabled} aria-label={text ? undefined : icon}>
      {icon && <Icon icon={icons[icon]} />}
      {text}
    </Button>
  ),
})
