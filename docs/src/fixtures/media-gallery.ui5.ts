import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/MediaGallery.js"
import "@ui5/webcomponents-fiori/dist/MediaGalleryItem.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Carousel.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/background.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type Ui5MediaGallery from "@ui5/webcomponents-fiori/dist/MediaGallery.js"
import type Ui5MediaGalleryItem from "@ui5/webcomponents-fiori/dist/MediaGalleryItem.js"
import { defineUi5, h } from "../fixture-types"
import set, { mediaImage } from "./media-gallery"

export default defineUi5(set, ({ width = 640, height = 416, count = 4, selected = 0, disabled, hidden, wide, wideIndex, contentless, thumbnail, rtl, video, activate, clearAfterActivate, ...props }) => {
  const gallery = h("ui5-media-gallery", {
    layout: props.layout, "show-all-thumbnails": props.showAllThumbnails, "interactive-display-area": props.interactiveDisplayArea,
    "menu-horizontal-align": props.menuHorizontalAlign, "menu-vertical-align": props.menuVerticalAlign, dir: rtl ? "rtl" : undefined,
  }, ...Array.from({ length: count }, (_, index) => {
    const image = video ? h("video", { poster: mediaImage(index), preload: "none", "aria-label": "Video " + (index + 1) })
      : h("img", { src: mediaImage(index), alt: "Picture " + (index + 1) })
    const item = h("ui5-media-gallery-item", { selected: index === selected, disabled: index === disabled, hidden: index === hidden, layout: wide || index === wideIndex ? "Wide" : "Square" })
    if (index !== contentless) item.append(image)
    if (thumbnail) item.append(h("img", { slot: "thumbnail", src: mediaImage(index, true), alt: "Thumbnail " + (index + 1) }))
    return item
  }))
  gallery.style.cssText = "width:" + width + "px;height:" + height + "px"
  if (activate !== undefined) Object.assign(gallery, { fixtureReady: (async () => {
    const native = gallery as Ui5MediaGallery
    const main = () => native.shadowRoot?.querySelector<Ui5MediaGalleryItem>("ui5-media-gallery-item")
    // Connected alone is insufficient: UI5 boot/lifecycle work may follow renderFinished.
    // Await the actual initial cloned content and onEnterDOM thumbnail state before clicking.
    while (!gallery.isConnected || !main()?.firstElementChild || !main()?.hasAttribute("_thumbnail-design"))
      await new Promise((resolve) => requestAnimationFrame(resolve))
    await renderFinished()
    const nextItem = native.items[activate]
    const expectedMainLayout = nextItem.displayedContent ? nextItem.layout : main()?.layout
    native.items[activate].click()
    while (!native.items[activate].selected || main()?.hasAttribute("_thumbnail-design")
      || main()?.layout !== expectedMainLayout
      || (activate === contentless ? !!main()?.firstElementChild
        : main()?.firstElementChild?.getAttribute(video ? "poster" : "src") !== mediaImage(activate)))
      await new Promise((resolve) => requestAnimationFrame(resolve))
    await renderFinished()
    if (clearAfterActivate) {
      native.items.forEach((item) => item.remove())
      while (native.items.length || main()?.firstElementChild || main()?.layout !== expectedMainLayout)
        await new Promise((resolve) => requestAnimationFrame(resolve))
      await renderFinished()
    }
  })() })
  return gallery
})
