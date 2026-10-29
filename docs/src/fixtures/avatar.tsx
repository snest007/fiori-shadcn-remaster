import { Avatar, AvatarGroup, type AvatarColorScheme, type AvatarSize } from "@/components/ui/avatar"
import { favorite } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

// Local image (no network): a simple square SVG portrait placeholder.
export const AVATAR_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#5b738b"/><circle cx="48" cy="38" r="18" fill="#d1efff"/><rect x="18" y="62" width="60" height="34" rx="30" fill="#d1efff"/></svg>`
  )

type Props = {
  size?: AvatarSize
  shape?: "circle" | "square"
  scheme?: AvatarColorScheme
  initials?: string
  icon?: boolean
  image?: boolean
  interactive?: boolean
  disabled?: boolean
  group?: "group" | "individual"
}
const sizes = ["XS", "S", "M", "L", "XL"] as const

export default defineFixtures<Props>({
  name: "avatar",
  cases: [
    ...sizes.map((size) => ({ id: `avatar-initials-${size.toLowerCase()}`, props: { size, initials: "JD" } })),
    ...sizes.map((size) => ({ id: `avatar-icon-${size.toLowerCase()}`, props: { size, icon: true } })),
    ...sizes.map((size) => ({ id: `avatar-square-${size.toLowerCase()}`, props: { size, shape: "square" as const, initials: "AB" } })),
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `avatar-accent${i + 1}`,
      props: { scheme: `accent${i + 1}` as AvatarColorScheme, initials: "JD" },
    })),
    { id: "avatar-placeholder", props: { scheme: "placeholder" } },
    { id: "avatar-transparent", props: { scheme: "transparent", icon: true } },
    { id: "avatar-fallback", props: {} },
    { id: "avatar-initials-overflow", props: { size: "XS", initials: "WWW" } },
    { id: "avatar-image", props: { size: "M", image: true } },
    { id: "avatar-image-square", props: { size: "M", image: true, shape: "square" } },
    { id: "avatar-interactive", props: { initials: "JD", interactive: true } },
    { id: "avatar-disabled", props: { initials: "JD", interactive: true, disabled: true } },
    { id: "avatar-group", props: { group: "group" } },
    { id: "avatar-group-individual", props: { group: "individual", size: "XS" } },
  ],
  react: ({ size, shape, scheme, initials, icon, image, interactive, disabled, group }) =>
    group ? (
      <AvatarGroup type={group} size={size} aria-label={`Team ${group}`}>
        <Avatar initials="JD" />
        <Avatar initials="AB" />
        <Avatar icon={favorite} />
        <Avatar initials="XY" colorScheme="accent9" />
      </AvatarGroup>
    ) : (
      <Avatar
        size={size}
        shape={shape}
        colorScheme={scheme}
        initials={initials}
        icon={icon ? favorite : undefined}
        src={image ? AVATAR_IMG : undefined}
        interactive={interactive}
        disabled={disabled}
      />
    ),
})
