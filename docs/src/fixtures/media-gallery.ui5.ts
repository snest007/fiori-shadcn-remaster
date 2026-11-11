import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/MediaGallery.js"
import "@ui5/webcomponents-fiori/dist/MediaGalleryItem.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Carousel.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/background.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"
import { defineUi5, h } from "../fixture-types"
import set, { mediaImage } from "./media-gallery"

export default defineUi5(set, ({ width = 640, height = 416, count = 4, selected = 0, disabled, hidden, wide, thumbnail, rtl, video, ...props }) => {
  const gallery = h("ui5-media-gallery", {
    layout: props.layout, "show-all-thumbnails": props.showAllThumbnails, "interactive-display-area": props.interactiveDisplayArea,
    "menu-horizontal-align": props.menuHorizontalAlign, "menu-vertical-align": props.menuVerticalAlign, dir: rtl ? "rtl" : undefined,
  }, ...Array.from({ length: count }, (_, index) => {
    const image = video ? h("video", { poster: mediaImage(index), preload: "none", "aria-label": "Video " + (index + 1) })
      : h("img", { src: mediaImage(index), alt: "Picture " + (index + 1) })
    const item = h("ui5-media-gallery-item", { selected: index === selected, disabled: index === disabled, hidden: index === hidden, layout: wide ? "Wide" : "Square" }, image)
    if (thumbnail) item.append(h("img", { slot: "thumbnail", src: mediaImage(index, true), alt: "Thumbnail " + (index + 1) }))
    return item
  }))
  gallery.style.cssText = "width:" + width + "px;height:" + height + "px"
  return gallery
})
