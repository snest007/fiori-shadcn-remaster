import * as React from "react"
import { MediaGallery, MediaGalleryItem, type MediaGalleryProps } from "@/components/ui/media-gallery"
import { defineFixtures } from "../fixture-types"

type Props = Pick<MediaGalleryProps, "showAllThumbnails" | "interactiveDisplayArea" | "layout" | "menuHorizontalAlign" | "menuVerticalAlign"> & {
  width?: number; height?: number; count?: number; selected?: number; disabled?: number; hidden?: number; wide?: boolean; wideIndex?: number; contentless?: number; thumbnail?: boolean; rtl?: boolean; video?: boolean; activate?: number; clearAfterActivate?: boolean; failureSlot?: "content" | "thumbnail"; removeFailure?: boolean; siblings?: "content" | "thumbnail"
}
export const failedMediaImage = "data:image/png;base64,bm90LWEtcGljdHVyZQ=="
// Deliberately simple local SVGs: intrinsic aspect ratio and thumbnail substitution are tested without network media.
export function mediaImage(index: number, thumbnail = false) {
  const color = ["#c6def1", "#fae0b9", "#bddfc7", "#e0c7ec"][index % 4]
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (thumbnail ? 120 : 320) + '" height="' + (thumbnail ? 120 : 240) + '" viewBox="0 0 320 240"><rect width="320" height="240" fill="' + color + '"/><circle cx="238" cy="60" r="28" fill="#fff" opacity=".7"/><path d="M0 240 100 100 175 170 235 115 320 240Z" fill="#45647d"/><rect x="20" y="20" width="' + (20 + index * 12) + '" height="10" fill="#45647d"/></svg>'
  return "data:image/svg+xml," + encodeURIComponent(svg)
}
function GalleryFixture({ width = 640, height = 416, count = 4, selected = 0, disabled, hidden, wide, wideIndex, contentless, thumbnail, rtl, video, activate, clearAfterActivate, failureSlot, removeFailure, siblings, ...props }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [activated, setActivated] = React.useState(false), [removed, setRemoved] = React.useState(false)
  const [failureRemoved, setFailureRemoved] = React.useState(false)
  React.useLayoutEffect(() => {
    if (activate !== undefined) {
      ref.current?.querySelectorAll<HTMLElement>(".fiori-media-gallery__thumbnail")[activate]?.click()
      setActivated(true)
    }
  }, [activate])
  React.useLayoutEffect(() => { if (clearAfterActivate && activated) setRemoved(true) }, [clearAfterActivate, activated])
  React.useLayoutEffect(() => {
    if (!failureSlot || !removeFailure) return
    let frame = 0
    const remove = () => {
      const target = ref.current?.querySelectorAll<HTMLElement>(".fiori-media-gallery__thumbnail")[1]
      const image = target?.querySelector<HTMLImageElement>("img")
      if (image?.complete && target?.querySelector(".fiori-media-gallery-item__background-icon")) setFailureRemoved(true)
      else frame = requestAnimationFrame(remove)
    }
    remove(); return () => cancelAnimationFrame(frame)
  }, [failureSlot, removeFailure])
  return <MediaGallery ref={ref} {...props} accessibleName="Pictures" dir={rtl ? "rtl" : undefined} style={{ width, height }}>
    {Array.from({ length: removed ? 0 : count }, (_, index) => (
      <MediaGalleryItem key={index} selected={index === selected} disabled={index === disabled} hidden={index === hidden}
        aria-label={index === 1 && failureSlot ? "Failed media" : index === contentless ? "Empty picture " + (index + 1) : undefined}
        layout={wide || index === wideIndex ? "Wide" : "Square"}
        thumbnail={index === 1 && failureSlot === "thumbnail" ? failureRemoved ? undefined : <img src={failedMediaImage} alt="Failed thumbnail" />
          : siblings === "thumbnail" ? [<img key="first" src={mediaImage(index, true)} alt={"Thumbnail " + (index + 1)} />,
            <img key="second" src={mediaImage(index + 1, true)} alt={"Later thumbnail " + (index + 1)} />]
            : thumbnail ? <img src={mediaImage(index, true)} alt={"Thumbnail " + (index + 1)} /> : undefined}>
        {index === 1 && failureSlot ? failureSlot === "content" && !failureRemoved ? <img src={failedMediaImage} alt="Failed content" /> : undefined
          : index === contentless ? undefined : video ? <video poster={mediaImage(index)} preload="none" aria-label={"Video " + (index + 1)} /> : <img src={mediaImage(index)} alt={"Picture " + (index + 1)} />}
        {siblings === "content" && <video poster={mediaImage(index + 1)} preload="none" aria-label={"Later video " + (index + 1)} />}
      </MediaGalleryItem>
    ))}
  </MediaGallery>
}
export default defineFixtures<Props>({
  name: "media-gallery",
  cases: [
    { id: "media-gallery-horizontal", props: { layout: "Horizontal" } },
    { id: "media-gallery-horizontal-right", props: { layout: "Horizontal", menuHorizontalAlign: "Right", selected: 2 } },
    { id: "media-gallery-vertical-bottom", props: { layout: "Vertical", width: 420, height: 420 } },
    { id: "media-gallery-vertical-top", props: { layout: "Vertical", menuVerticalAlign: "Top", width: 420, height: 420 } },
    { id: "media-gallery-horizontal-overflow", props: { layout: "Horizontal", count: 8, height: 336 } },
    { id: "media-gallery-vertical-overflow", props: { layout: "Vertical", count: 8, width: 352, height: 400 } },
    { id: "media-gallery-overflow-all", props: { layout: "Horizontal", count: 4, height: 80 } },
    { id: "media-gallery-disabled", props: { layout: "Horizontal", disabled: 1, thumbnail: true } },
    { id: "media-gallery-hidden-slots", props: { layout: "Horizontal", hidden: 1, count: 6 } },
    { id: "media-gallery-wide-square", props: { layout: "Horizontal", wide: true } },
    { id: "media-gallery-wide-display", props: { layout: "Horizontal", showAllThumbnails: true, wide: true, width: 720 } },
    { id: "media-gallery-video-display", props: { layout: "Horizontal", showAllThumbnails: true, wide: true, video: true, thumbnail: true, width: 720 } },
    { id: "media-gallery-selected-display", props: { layout: "Horizontal", activate: 2 } },
    { id: "media-gallery-selected-wide-square", props: { layout: "Horizontal", wide: true, activate: 2 } },
    { id: "media-gallery-selected-wide-display", props: { layout: "Horizontal", showAllThumbnails: true, wide: true, activate: 2, width: 720 } },
    { id: "media-gallery-contentless-wide-after-square", props: { layout: "Horizontal", showAllThumbnails: true, count: 2, wideIndex: 1, contentless: 1, thumbnail: true, activate: 1, width: 720 } },
    { id: "media-gallery-clear-after-wide-display", props: { layout: "Horizontal", showAllThumbnails: true, wide: true, activate: 2, clearAfterActivate: true, width: 720 } },
    { id: "media-gallery-failed-content-removed", props: { layout: "Horizontal", count: 2, failureSlot: "content", removeFailure: true } },
    { id: "media-gallery-failed-thumbnail-removed", props: { layout: "Horizontal", count: 2, failureSlot: "thumbnail", removeFailure: true } },
    { id: "media-gallery-default-slot-siblings", props: { layout: "Horizontal", count: 2, siblings: "content" } },
    { id: "media-gallery-thumbnail-slot-siblings", props: { layout: "Horizontal", count: 2, siblings: "thumbnail" } },
    { id: "media-gallery-show-all-s", props: { layout: "Horizontal", showAllThumbnails: true, count: 9, width: 500 } },
    { id: "media-gallery-show-all-m", props: { layout: "Horizontal", showAllThumbnails: true, count: 9, width: 720 } },
    { id: "media-gallery-show-all-l", props: { layout: "Horizontal", showAllThumbnails: true, count: 9, width: 1024 } },
    { id: "media-gallery-show-all-xl", props: { layout: "Horizontal", showAllThumbnails: true, count: 9, width: 1440 } },
    { id: "media-gallery-show-all-vertical", props: { layout: "Vertical", showAllThumbnails: true, count: 9, width: 420, height: 420 } },
    { id: "media-gallery-auto-small", props: { width: 599, height: 420 } },
    { id: "media-gallery-auto-medium", props: { width: 600 } },
    { id: "media-gallery-rtl", props: { layout: "Horizontal", rtl: true } },
    { id: "media-gallery-empty", props: { count: 0 } },
  ],
  react: (props) => <GalleryFixture {...props} />,
})
