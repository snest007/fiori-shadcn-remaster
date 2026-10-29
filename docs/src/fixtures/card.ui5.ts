import "@ui5/webcomponents/dist/Card.js"
import "@ui5/webcomponents/dist/CardHeader.js"
import "@ui5/webcomponents/dist/Avatar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/overflow.js"
import "@ui5/webcomponents-icons/dist/calendar.js"

import { defineUi5, h } from "../fixture-types"
import set, { CARD_CONTENT, CARD_LONG_TITLE, CARD_STATUS, CARD_SUBTITLE, CARD_TITLE, CARD_WIDTH } from "./card"

export default defineUi5(set, ({ subtitle, status, avatar, action, interactive, content, noHeader, long }) => {
  const children: (Node | string)[] = []
  if (!noHeader) {
    children.push(
      h(
        "ui5-card-header",
        {
          slot: "header",
          "title-text": long ? CARD_LONG_TITLE : CARD_TITLE,
          "subtitle-text": subtitle ? CARD_SUBTITLE : undefined,
          "additional-text": status ? CARD_STATUS : undefined,
          interactive,
        },
        ...(avatar === "avatar" ? [h("ui5-avatar", { slot: "avatar", initials: "QS" })] : []),
        ...(avatar === "icon" ? [h("ui5-icon", { slot: "avatar", name: "calendar" })] : []),
        ...(action ? [h("ui5-button", { slot: "action", design: "Transparent", icon: "overflow", "accessible-name": "More" })] : [])
      )
    )
  }
  if (content) {
    const c = h("div", {}, CARD_CONTENT)
    c.style.padding = "0 1rem 1rem"
    children.push(c)
  }
  const card = h("ui5-card", {}, ...children)
  card.style.width = CARD_WIDTH
  return card
})
