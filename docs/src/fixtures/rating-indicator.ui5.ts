import "@ui5/webcomponents/dist/RatingIndicator.js"
import "@ui5/webcomponents-icons/dist/favorite.js"
import "@ui5/webcomponents-icons/dist/unfavorite.js"

import { defineUi5, h } from "../fixture-types"
import set from "./rating-indicator"

export default defineUi5(set, ({ value, max, size, readOnly, displayOnly, disabled }) =>
  h("ui5-rating-indicator", {
    value: String(value),
    max: max ? String(max) : undefined,
    size,
    readonly: readOnly,
    "display-only": displayOnly,
    disabled,
    "accessible-name": "Rating",
  })
)
