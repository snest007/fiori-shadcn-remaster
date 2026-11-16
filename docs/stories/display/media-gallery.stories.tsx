import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { MediaGallery, MediaGalleryItem, type MediaGalleryProps } from "@/components/ui/media-gallery"
import { Button } from "@/components/ui/button"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

// Local illustration content avoids network requests while retaining intrinsic image ratios.
function picture(index: number, thumbnail = false) {
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${thumbnail ? 120 : 320}" height="${thumbnail ? 120 : 240}" viewBox="0 0 320 240"><circle cx="${80 + index * 15}" cy="70" r="30" fill="currentColor"/><path d="M0 240 100 100 175 170 235 115 320 240Z" fill="currentColor"/></svg>`)
}
const failedPicture = "data:image/png;base64,bm90LWEtcGljdHVyZQ=="
type Args = MediaGalleryProps & { count: number; selectedIndex: number; disabledIndex: number; hiddenIndex: number; itemLayout: "Square" | "Wide"; thumbnails: boolean; video: boolean; width: number; height: number; contentless: boolean; siblingSlot: "none" | "content" | "thumbnail"; recoverySlot: "none" | "content" | "thumbnail"; removeFailure: boolean; mixedLayout: boolean }
const textDefaults = [
  {
    "prop": "MediaGallery.overflowText(count)",
    "key": "Application text; UI5 builds \"+\" + count",
    "value": "+{0}"
  },
  {
    "prop": "MediaGallery.carouselProps.ofText",
    "key": "CAROUSEL_OF_TEXT",
    "value": "of"
  },
  {
    "prop": "MediaGallery.carouselProps.previousPageText",
    "key": "CAROUSEL_PREVIOUS_ARROW_TEXT",
    "value": "Previous Page"
  },
  {
    "prop": "MediaGallery.carouselProps.nextPageText",
    "key": "CAROUSEL_NEXT_ARROW_TEXT",
    "value": "Next Page"
  },
  {
    "prop": "MediaGallery.carouselProps.roleDescription",
    "key": "CAROUSEL_ARIA_ROLE_DESCRIPTION",
    "value": "Carousel"
  },
  {
    "prop": "MediaGallery.carouselProps.listLabel",
    "key": "CAROUSEL_ARIA_LIST_LABEL",
    "value": "Item Container"
  }
]
const base = fioriMeta({ name: "media-gallery", component: MediaGallery })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { accessibleName: "Product pictures", layout: "Horizontal", menuHorizontalAlign: "Left", menuVerticalAlign: "Bottom", showAllThumbnails: false, interactiveDisplayArea: false, count: 4, selectedIndex: 0, disabledIndex: -1, hiddenIndex: -1, itemLayout: "Square", thumbnails: false, video: false, width: 640, height: 416, contentless: false, siblingSlot: "none", recoverySlot: "none", removeFailure: false, mixedLayout: false, onSelectionChange: fn(), onOverflowClick: fn(), onDisplayAreaClick: fn() },
  argTypes: { ...base.argTypes, accessibleName: { control: "text" }, layout: { control: "select", options: ["Auto", "Horizontal", "Vertical"] }, menuHorizontalAlign: { control: "inline-radio", options: ["Left", "Right"] }, menuVerticalAlign: { control: "inline-radio", options: ["Top", "Bottom"] }, showAllThumbnails: { control: "boolean" }, interactiveDisplayArea: { control: "boolean" }, count: { control: "number" }, selectedIndex: { control: "number" }, disabledIndex: { control: "number" }, hiddenIndex: { control: "number" }, itemLayout: { control: "inline-radio", options: ["Square", "Wide"] }, thumbnails: { control: "boolean" }, video: { control: "boolean" }, width: { control: "number" }, height: { control: "number" }, contentless: { control: "boolean" }, siblingSlot: { control: "select", options: ["none", "content", "thumbnail"] }, recoverySlot: { control: "select", options: ["none", "content", "thumbnail"] }, removeFailure: { control: "boolean" }, mixedLayout: { control: "boolean" }, carouselProps: { control: "object" }, overflowText: { control: false }, onSelectionChange: { control: false }, onOverflowClick: { control: false }, onDisplayAreaClick: { control: false } },
  render: function ProductMedia(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [last, setLast] = React.useState("No media action")
    const [removed, setRemoved] = React.useState(false)
    const { count, selectedIndex, disabledIndex, hiddenIndex, itemLayout, thumbnails, video, width, height, contentless, siblingSlot, recoverySlot, removeFailure, mixedLayout, ...props } = args
    const recovery = <img src={failedPicture} alt="Unavailable media preview" onError={() => { if (removeFailure) setRemoved(true) }} />
    return <div className="grid gap-3"><MediaGallery {...props} style={{ width, height }} className="max-w-full" onSelectionChange={(item) => { args.onSelectionChange?.(item); setLast(item.id); updateArgs({ selectedIndex: Number(item.dataset.index) }) }} onOverflowClick={() => { args.onOverflowClick?.(); setLast("More pictures requested") }} onDisplayAreaClick={() => { args.onDisplayAreaClick?.(); setLast("Displayed picture activated") }}>{Array.from({ length: Math.max(0, count) }, (_, index) => <MediaGalleryItem key={index} id={`product-media-${index}`} data-index={index} selected={index === selectedIndex} disabled={index === disabledIndex} hidden={index === hiddenIndex} layout={mixedLayout ? index === 1 ? "Wide" : "Square" : itemLayout} aria-label={contentless && index === 1 ? "Empty product picture" : recoverySlot !== "none" && index === 1 ? "Media recovery example" : undefined} thumbnail={index === 1 && recoverySlot === "thumbnail" ? removed ? undefined : recovery : siblingSlot === "thumbnail" ? <><img src={picture(index, true)} alt={`Product thumbnail ${index + 1}`} /><img src={picture(index + 1, true)} alt={`Later thumbnail ${index + 1}`} /></> : thumbnails ? <img src={picture(index, true)} alt={`Product thumbnail ${index + 1}`} /> : undefined}>{contentless && index === 1 ? undefined : index === 1 && recoverySlot === "content" ? removed ? undefined : recovery : video ? <video preload="none" poster={picture(index)} aria-label={`Product video ${index + 1}`} /> : <img src={picture(index)} alt={`Product picture ${index + 1}`} />}{siblingSlot === "content" && <video preload="none" poster={picture(index + 1)} aria-label={`Later product video ${index + 1}`} />}</MediaGalleryItem>)}</MediaGallery><div className="flex flex-wrap gap-2"><Button onClick={() => updateArgs({ count: 0 })}>Clear pictures</Button><Button onClick={() => updateArgs({ count: 4, selectedIndex: 0 })}>Restore pictures</Button>{recoverySlot !== "none" && <Button onClick={() => setRemoved((value) => !value)}>{removed ? "Restore preview" : "Remove preview"}</Button>}</div><output>{last}</output></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Horizontal: Story = {}
export const HorizontalRight: Story = { args: { menuHorizontalAlign: "Right", selectedIndex: 2 } }
export const VerticalBottom: Story = { args: { layout: "Vertical", width: 420, height: 420 } }
export const VerticalTop: Story = { args: { layout: "Vertical", menuVerticalAlign: "Top", width: 420, height: 420 } }
export const HorizontalOverflow: Story = { args: { count: 8, height: 336 } }
export const VerticalOverflow: Story = { args: { layout: "Vertical", count: 8, width: 352, height: 400 } }
export const OnlyOverflow: Story = { args: { height: 80 } }
export const DisabledItem: Story = { args: { disabledIndex: 1, thumbnails: true } }
export const HiddenItem: Story = { args: { hiddenIndex: 1, count: 6 } }
export const WideSquareDisplay: Story = { args: { itemLayout: "Wide" } }
export const WideDisplay: Story = { args: { showAllThumbnails: true, itemLayout: "Wide", width: 720 } }
export const VideoDisplay: Story = { args: { showAllThumbnails: true, itemLayout: "Wide", thumbnails: true, video: true, width: 720 } }
export const SelectedDisplay: Story = { args: { selectedIndex: 2 } }
export const SelectedWideSquareDisplay: Story = { args: { selectedIndex: 2, itemLayout: "Wide" } }
export const SelectedWideDisplay: Story = { args: { selectedIndex: 2, showAllThumbnails: true, itemLayout: "Wide", width: 720 } }
export const ContentlessWideItem: Story = { args: { selectedIndex: 1, count: 2, contentless: true, thumbnails: true, mixedLayout: true, showAllThumbnails: true, width: 720 } }
export const RemoveAllAfterSelection: Story = { args: { selectedIndex: 2, showAllThumbnails: true, itemLayout: "Wide", width: 720 } }
export const FailedContentRemoved: Story = { args: { count: 2, recoverySlot: "content", removeFailure: true } }
export const FailedThumbnailRemoved: Story = { args: { count: 2, recoverySlot: "thumbnail", removeFailure: true } }
export const RecoverContent: Story = { args: { count: 2, recoverySlot: "content" } }
export const RecoverThumbnail: Story = { args: { count: 2, recoverySlot: "thumbnail" } }
export const ContentSiblings: Story = { args: { count: 2, siblingSlot: "content" } }
export const ThumbnailSiblings: Story = { args: { count: 2, siblingSlot: "thumbnail" } }
export const AllThumbnailsSmall: Story = { args: { showAllThumbnails: true, count: 9, width: 500 } }
export const AllThumbnailsMedium: Story = { args: { showAllThumbnails: true, count: 9, width: 720 } }
export const AllThumbnailsLarge: Story = { args: { showAllThumbnails: true, count: 9, width: 1024 } }
export const AllThumbnailsExtraLarge: Story = { args: { showAllThumbnails: true, count: 9, width: 1440 } }
export const AllThumbnailsVertical: Story = { args: { layout: "Vertical", showAllThumbnails: true, count: 9, width: 420, height: 420 } }
export const AutoSmall: Story = { args: { layout: "Auto", width: 599, height: 420 } }
export const AutoMedium: Story = { args: { layout: "Auto", width: 600 } }
export const InteractiveDisplay: Story = { args: { interactiveDisplayArea: true } }
export const Empty: Story = { args: { count: 0 } }
export const CustomTexts: Story = { args: { count: 8, overflowText: (count) => `More: ${count}`, carouselProps: { accessibleName: "Product picture collection", previousPageText: "Previous pictures", nextPageText: "Next pictures", listLabel: "Picture pages" } } }
export const RTL: Story = { globals: { dir: "rtl" } }
