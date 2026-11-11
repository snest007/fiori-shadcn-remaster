import * as React from "react"
import { Button } from "@/components/ui/button"
import { MediaGallery, MediaGalleryItem, type MediaGalleryLayout } from "@/components/ui/media-gallery"
import { mediaImage } from "../fixtures/media-gallery"
import { defineDemo } from "./types"

function MediaGalleryDemo() {
  const [sourceSelection, setSourceSelection] = React.useState(0)
  const [selected, setSelected] = React.useState("none"), [changes, setChanges] = React.useState(0)
  const [overflow, setOverflow] = React.useState(0), [displayClicks, setDisplayClicks] = React.useState(0)
  const [all, setAll] = React.useState(false), [interactive, setInteractive] = React.useState(true)
  const [layout, setLayout] = React.useState<MediaGalleryLayout>("Auto"), [count, setCount] = React.useState(7)
  const [mounted, setMounted] = React.useState(true), [refCleanups, setRefCleanups] = React.useState(0)
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
      <Button id="media-gallery-ref-remove" onClick={() => setMounted(false)}>Remove ref example</Button>
      <p id="media-gallery-ref-cleanups">Ref cleanups: {refCleanups}</p>
      {mounted && <MediaGallery id="media-gallery-ref-example" ref={cleanupRef} style={{ width: 320, height: 320 }}>
        <MediaGalleryItem ref={cleanupRef}><img src={mediaImage(0)} alt="Ref example" /></MediaGalleryItem>
      </MediaGallery>}
    </div>
  )
}
export default defineDemo({ title: "MediaGallery", order: 63, Demo: MediaGalleryDemo })
