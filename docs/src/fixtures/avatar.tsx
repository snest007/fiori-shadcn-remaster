import { Avatar, AvatarGroup, type AvatarColorScheme, type AvatarSize } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  width?: string
  customOverflow?: boolean
  count?: number
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
    ...(["group", "individual"] as const).flatMap((group) => (["S", "L"] as const).map((size) => ({
      id: `avatar-group-overflow-${group}-${size.toLowerCase()}`,
      props: { group, size, width: group === "group" ? size === "S" ? "7.5rem" : "12rem" : size === "S" ? "9rem" : "15rem" },
    }))),
    { id: "avatar-group-overflow-ultra-narrow-56", props: { group: "group", size: "S", width: "3.5rem", count: 4 } },
    { id: "avatar-group-overflow-ultra-narrow-80", props: { group: "group", size: "S", width: "5rem", count: 4 } },
    { id: "avatar-group-overflow-custom-group", props: { group: "group", width: "12rem", customOverflow: true, count: 2 } },
    { id: "avatar-group-overflow-custom", props: { group: "individual", width: "9rem", customOverflow: true } },
    { id: "avatar-group-overflow-custom-fitting", props: { group: "individual", width: "15rem", customOverflow: true, count: 2 } },
    { id: "avatar-group-overflow-cap", props: { group: "individual", width: "6rem", count: 105 } },
  ],
  react: ({ size, shape, scheme, initials, icon, image, interactive, disabled, group, width, customOverflow, count }) =>
    group ? (
      <AvatarGroup type={group} size={size} style={width ? { width } : undefined} aria-label={`Team ${group}`} overflowButton={customOverflow ? <Button>All</Button> : undefined}>
        {count ? Array.from({ length: count }, (_, index) => <Avatar key={index} initials="JD" />) : <>
          <Avatar initials="JD" />
          <Avatar initials="AB" />
          <Avatar icon={favorite} />
          <Avatar initials="XY" colorScheme="accent9" />
        </>}
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
