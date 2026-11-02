import "@ui5/webcomponents/dist/Carousel.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"

import { defineUi5, h } from "../fixture-types"
import set, { slideStyle } from "./carousel"

export default defineUi5(set, ({ page, count = 5, width = "24rem", ...p }) => {
  const c = h(
    "ui5-carousel",
    {
      "accessible-name": "Fixture",
      cyclic: p.cyclic,
      "items-per-page": p.itemsPerPage,
      "hide-navigation-arrows": p.hideNavigationArrows,
      "hide-page-indicator": p.hidePageIndicator,
      "page-indicator-type": p.pageIndicatorType,
      "arrows-placement": p.arrowsPlacement,
      "background-design": p.backgroundDesign,
      "page-indicator-background-design": p.pageIndicatorBackgroundDesign,
      "page-indicator-border-design": p.pageIndicatorBorderDesign,
    },
    ...Array.from({ length: count }, (_, i) => {
      const d = h("div", {}, `Slide ${i + 1}`)
      d.style.cssText = slideStyle
      return d
    })
  )
  c.style.width = width
  // navigateTo needs the slots processed, which is too late here; these are what it sets.
  if (page) Object.assign(c, { _currentPageIndex: page, _focusedItemIndex: page })
  return c
})
