import * as React from "react"
import { Button } from "@/components/ui/button"
import { MediaGallery, MediaGalleryItem, type MediaGalleryLayout } from "@/components/ui/media-gallery"
import { failedMediaImage, mediaImage } from "../fixtures/media-gallery"
import { defineDemo } from "./types"

function MediaGalleryDemo() {
  const [sourceSelection, setSourceSelection] = React.useState(0)
  const [selected, setSelected] = React.useState("none"), [changes, setChanges] = React.useState(0)
  const [overflow, setOverflow] = React.useState(0), [displayClicks, setDisplayClicks] = React.useState(0)
  const [all, setAll] = React.useState(false), [interactive, setInteractive] = React.useState(true)
  const [layout, setLayout] = React.useState<MediaGalleryLayout>("Auto"), [count, setCount] = React.useState(7)
  const [mounted, setMounted] = React.useState(true), [refCleanups, setRefCleanups] = React.useState(0)
  const [contentlessSelection, setContentlessSelection] = React.useState("none"), [contentlessChanges, setContentlessChanges] = React.useState(0)
  const [additionalGallery, setAdditionalGallery] = React.useState(false)
  const [failedContent, setFailedContent] = React.useState<"failed" | "empty" | "replacement">("failed")
  const [failedThumbnail, setFailedThumbnail] = React.useState<"failed" | "empty" | "replacement">("failed")
  const [laterThumbnailFailed, setLaterThumbnailFailed] = React.useState(false)
  const cleanupRef = React.useCallback((element: HTMLDivElement | null) => {
    if (element) return () => setRefCleanups((value) => value + 1)
  }, [])
  return (
    <div id="media-gallery-demo" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button id="media-gallery-show-all" onClick={() => setAll((value) => !value)}>Show all: {String(all)}</Button>
        <Button id="media-gallery-interactive" onClick={() => setInteractive((value) => !value)}>Interactive: {String(interactive)}</Button>
        <Button id="media-gallery-layout" onClick={() => setLayout((value) => value === "Horizontal" ? "Vertical" : value === "Vertical" ? "Auto" : "Horizontal")}>Layout: {layout}</Button>
        <Button id="media-gallery-select-last" onClick={() => setSourceSelection(6)}>Select last item</Button>
        <Button id="media-gallery-clear" onClick={() => setCount(0)}>Remove all items</Button>
      </div>
      <MediaGallery id="media-gallery-basic" accessibleName="Product pictures" layout={layout}
        showAllThumbnails={all} interactiveDisplayArea={interactive} style={{ width: 640, height: 416 }}
        onSelectionChange={(item) => { setSelected(item.id + ":" + String(item.selected)); setChanges((value) => value + 1) }}
        onOverflowClick={() => setOverflow((value) => value + 1)} onDisplayAreaClick={() => setDisplayClicks((value) => value + 1)}>
        {Array.from({ length: count }, (_, index) => (
          <MediaGalleryItem key={index} id={"media-gallery-item-" + index} selected={index === sourceSelection} disabled={index === 1}
            layout={index === 3 ? "Wide" : "Square"} thumbnail={<img src={mediaImage(index, true)} alt={"Product thumbnail " + index} />}>
            {index === 3 ? <video poster={mediaImage(index)} preload="none" aria-label="Product video" /> : <img src={mediaImage(index)} alt={"Product picture " + index} />}
          </MediaGalleryItem>
        ))}
      </MediaGallery>
      <p id="media-gallery-selection">Selection: {selected}; changes: {changes}</p>
      <p id="media-gallery-events">Overflow: {overflow}; display: {displayClicks}</p>
      <MediaGallery id="media-gallery-invalid" accessibleName="Initial selection" layout="Horizontal" style={{ width: 640, height: 336 }}>
        {Array.from({ length: 4 }, (_, index) => <MediaGalleryItem key={index} id={"media-gallery-invalid-item-" + index}
          disabled={index === 1} selected={index === 1 || index === 3}><img src={mediaImage(index)} alt={"Initial picture " + index} /></MediaGalleryItem>)}
      </MediaGallery>
      <MediaGallery id="media-gallery-hidden" accessibleName="Hidden item navigation" showAllThumbnails layout="Horizontal" style={{ width: 640, height: 336 }}>
        {Array.from({ length: 4 }, (_, index) => <MediaGalleryItem key={index} id={"media-gallery-hidden-item-" + index} hidden={index === 1}>
          <img src={mediaImage(index)} alt={"Hidden example " + index} /></MediaGalleryItem>)}
      </MediaGallery>
      <MediaGallery id="media-gallery-disabled" accessibleName="Unavailable pictures" style={{ width: 320, height: 320 }}>
        <MediaGalleryItem disabled><img src={mediaImage(0)} alt="Unavailable picture" /></MediaGalleryItem>
      </MediaGallery>
      <MediaGallery id="media-gallery-contentless" accessibleName="Contentless item layout" layout="Horizontal" showAllThumbnails style={{ width: 720, height: 416 }}
        onSelectionChange={(item) => { setContentlessSelection(item.id + ":" + String(item.selected) + ":" + item.layout); setContentlessChanges((value) => value + 1) }}>
        <MediaGalleryItem id="media-gallery-contentless-square"><img src={mediaImage(0)} alt="Square picture" /></MediaGalleryItem>
        <MediaGalleryItem id="media-gallery-contentless-wide" layout="Wide" aria-label="Empty wide item"
          thumbnail={<img src={mediaImage(1, true)} alt="Empty wide item thumbnail" />} />
      </MediaGallery>
      <p id="media-gallery-contentless-selection">Selection: {contentlessSelection}; changes: {contentlessChanges}</p>
      <div className="flex flex-wrap gap-2">
        <Button id="media-gallery-failed-content-remove" onClick={() => setFailedContent("empty")}>Remove failed content</Button>
        <Button id="media-gallery-failed-content-replace" onClick={() => setFailedContent("replacement")}>Replace content</Button>
        <Button id="media-gallery-failed-thumbnail-remove" onClick={() => setFailedThumbnail("empty")}>Remove failed thumbnail</Button>
        <Button id="media-gallery-failed-thumbnail-replace" onClick={() => setFailedThumbnail("replacement")}>Replace thumbnail</Button>
      </div>
      <MediaGallery id="media-gallery-failures" accessibleName="Media recovery" layout="Horizontal" style={{ width: 640, height: 336 }}>
        <MediaGalleryItem><img src={mediaImage(0)} alt="Recovery example picture" /></MediaGalleryItem>
        <MediaGalleryItem id="media-gallery-failed-content" aria-label="Default media">
          {failedContent === "failed" ? <img src={failedMediaImage} alt="Failed default media" /> : failedContent === "replacement" ? <span>Content replacement</span> : undefined}
        </MediaGalleryItem>
        <MediaGalleryItem id="media-gallery-failed-thumbnail" aria-label="Thumbnail media"
          thumbnail={failedThumbnail === "failed" ? <img src={failedMediaImage} alt="Failed thumbnail media" /> : failedThumbnail === "replacement" ? <span>Thumbnail replacement</span> : undefined} />
      </MediaGallery>
      <MediaGallery id="media-gallery-siblings" accessibleName="Slotted media siblings" layout="Horizontal" style={{ width: 640, height: 336 }}>
        <MediaGalleryItem id="media-gallery-sibling-content">
          <img src={mediaImage(0)} alt="Default sibling image" />
          <video poster={mediaImage(1)} preload="none" aria-label="Default sibling video" />
        </MediaGalleryItem>
        <MediaGalleryItem id="media-gallery-sibling-thumbnail" thumbnail={[
          <img key="first" src={mediaImage(2, true)} alt="First sibling thumbnail" />,
          <img key="second" src={laterThumbnailFailed ? failedMediaImage : mediaImage(3, true)} alt="Later sibling thumbnail" />,
        ]}>
          <img src={mediaImage(2)} alt="Named-thumbnail default image" />
          <video poster={mediaImage(3)} preload="none" aria-label="Named-thumbnail default video" />
        </MediaGalleryItem>
      </MediaGallery>
      <Button id="media-gallery-sibling-thumbnail-fail-later" onClick={() => setLaterThumbnailFailed(true)}>Fail later thumbnail</Button>
      <Button id="media-gallery-add-gallery" onClick={() => setAdditionalGallery(true)}>Add gallery</Button>
      {additionalGallery && <MediaGallery id="media-gallery-additional" accessibleName="Additional pictures" style={{ width: 640, height: 416 }}>
        {[0, 1].map((index) => <MediaGalleryItem key={index}><img src={mediaImage(index)} alt={"Additional picture " + index} /></MediaGalleryItem>)}
      </MediaGallery>}
      <Button id="media-gallery-ref-remove" onClick={() => setMounted(false)}>Remove ref example</Button>
      <p id="media-gallery-ref-cleanups">Ref cleanups: {refCleanups}</p>
      {mounted && <MediaGallery id="media-gallery-ref-example" accessibleName="Ref cleanup pictures" ref={cleanupRef} style={{ width: 320, height: 320 }}>
        <MediaGalleryItem ref={cleanupRef}><img src={mediaImage(0)} alt="Ref example" /></MediaGalleryItem>
      </MediaGallery>}
    </div>
  )
}
export default defineDemo({ title: "MediaGallery", order: 63, Demo: MediaGalleryDemo })
