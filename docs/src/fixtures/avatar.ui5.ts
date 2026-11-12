import "@ui5/webcomponents/dist/Avatar.js"
import "@ui5/webcomponents/dist/AvatarGroup.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/favorite.js"
import "@ui5/webcomponents-icons/dist/employee.js"

import { defineUi5, h } from "../fixture-types"
import set, { AVATAR_IMG } from "./avatar"

const scheme = (s?: string) =>
  !s ? undefined : s.startsWith("accent") ? `Accent${s.slice(6)}` : s[0].toUpperCase() + s.slice(1)

export default defineUi5(set, ({ size, shape, scheme: sc, initials, icon, image, interactive, disabled, group, width, customOverflow, count }) => {
  if (group) {
    const g = h(
      "ui5-avatar-group",
      { type: group === "group" ? "Group" : "Individual" },
      ...(count ? Array.from({ length: count }, () => h("ui5-avatar", { initials: "JD", size })) : [
        h("ui5-avatar", { initials: "JD", size }),
        h("ui5-avatar", { initials: "AB", size }),
        h("ui5-avatar", { icon: "favorite", size }),
        h("ui5-avatar", { initials: "XY", "color-scheme": "Accent9", size }),
      ]),
      ...(customOverflow ? [h("ui5-button", { slot: "overflowButton" }, "All")] : [])
    )
    // Let AvatarGroup.js _overflowItems own sequential visibility at the fixed ultra-narrow
    // widths too; never pre-reveal items or pin an expected hidden count in the reference.
    // The group is width:100%; size it to its content as our inline group is.
    g.style.width = width ?? "max-content"
    // AvatarGroup.js _getWidthToItem measures from its offsetParent in RTL.
    // A positioned, content-sized frame keeps that parent local to this fixture.
    const frame = h("div", {}, g)
    frame.style.cssText = "position:relative;display:inline-flex"
    return frame
  }
  return h(
    "ui5-avatar",
    {
      size,
      shape: shape === "square" ? "Square" : undefined,
      "color-scheme": scheme(sc),
      initials,
      icon: icon ? "favorite" : undefined,
      interactive,
      disabled,
    },
    ...(image ? [h("img", { src: AVATAR_IMG, alt: "" })] : [])
  )
})
