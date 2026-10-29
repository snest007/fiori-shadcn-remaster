import "@ui5/webcomponents/dist/Avatar.js"
import "@ui5/webcomponents/dist/AvatarGroup.js"
import "@ui5/webcomponents-icons/dist/favorite.js"
import "@ui5/webcomponents-icons/dist/employee.js"

import { defineUi5, h } from "../fixture-types"
import set, { AVATAR_IMG } from "./avatar"

const scheme = (s?: string) =>
  !s ? undefined : s.startsWith("accent") ? `Accent${s.slice(6)}` : s[0].toUpperCase() + s.slice(1)

export default defineUi5(set, ({ size, shape, scheme: sc, initials, icon, image, interactive, disabled, group }) => {
  if (group) {
    const g = h(
      "ui5-avatar-group",
      { type: group === "group" ? "Group" : "Individual" },
      h("ui5-avatar", { initials: "JD", size }),
      h("ui5-avatar", { initials: "AB", size }),
      h("ui5-avatar", { icon: "favorite", size }),
      h("ui5-avatar", { initials: "XY", "color-scheme": "Accent9", size })
    )
    // The group is width:100%; size it to its content as our inline group is.
    g.style.width = "max-content"
    return g
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
