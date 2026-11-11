import * as React from "react"
import { background } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Carousel, type CarouselProps } from "@/components/ui/carousel"
import { Icon } from "@/components/ui/icon"

type MediaGalleryLayout = "Auto" | "Vertical" | "Horizontal"
type MediaGalleryItemLayout = "Square" | "Wide"
type MediaGalleryMenuHorizontalAlign = "Left" | "Right"
type MediaGalleryMenuVerticalAlign = "Top" | "Bottom"
type MediaGalleryItemProps = React.ComponentProps<"div"> & {
  selected?: boolean
  disabled?: boolean
  layout?: MediaGalleryItemLayout
  thumbnail?: React.ReactNode
}
type MediaGalleryItemElement = HTMLDivElement & { selected: boolean; disabled: boolean; layout: MediaGalleryItemLayout }
type MediaGalleryProps = React.ComponentProps<"div"> & {
  showAllThumbnails?: boolean
  interactiveDisplayArea?: boolean
  layout?: MediaGalleryLayout
  menuHorizontalAlign?: MediaGalleryMenuHorizontalAlign
  menuVerticalAlign?: MediaGalleryMenuVerticalAlign
  onSelectionChange?: (item: MediaGalleryItemElement) => void
  onOverflowClick?: () => void
  onDisplayAreaClick?: () => void
  accessibleName?: string
  carouselProps?: Pick<CarouselProps, "accessibleName" | "ofText" | "previousPageText" | "nextPageText" | "roleDescription" | "listLabel">
  overflowText?: (count: number) => React.ReactNode
}
// MediaGallery.js THUMBNAIL_HEIGHT/THUMBNAIL_MARGIN are fixed pixels without theme parameters.
const THUMBNAIL_HEIGHT = 80
const THUMBNAIL_MARGIN = 16
// MediaRange.js getCurrentRange floors the component width before choosing RANGE_4STEPS.
const mediaRange = (width: number) => Math.floor(width) < 600 ? "S" : Math.floor(width) < 1024 ? "M" : Math.floor(width) < 1440 ? "L" : "XL"

// Device.js internals._isPhone/detectTablet: narrow desktop width alone never selects the phone path.
function isPhonePlatform() {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent, touch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  if (!touch || /ipad/i.test(ua) || (/Macintosh/i.test(ua) && "ontouchend" in document)) return false
  const windows = navigator.platform.includes("Win"), version = ua.match(/Windows NT (\d+)\.(\d+)/)
  if (windows && version && Number(version[1] + "." + version[2]) >= 8) return false
  const android = !windows && /Android/.test(ua)
  if (/(Chrome|CriOS)/.test(ua) && android) return /Mobile Safari\/[.0-9]+/.test(ua)
  let density = window.devicePixelRatio || 1
  const webkit = ua.match(/webkit[ /]([\w.]+)/)
  if (android && webkit && parseFloat(webkit[1]) >= 537.1) density = 1
  return Math.min(window.screen.width / density, window.screen.height / density) < 600
}
const firstNode = (nodes: React.ReactNode) => React.Children.toArray(nodes)[0] ?? null
const selectable = (props: MediaGalleryItemProps) => !props.disabled && !props.hidden
const modified = (event: React.KeyboardEvent) => event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
// React 19 callback refs may return their own cleanup instead of accepting a later null.
function attachRef<T>(ref: React.Ref<T> | undefined, node: T) {
  if (typeof ref === "function") {
    const cleanup = ref(node)
    return typeof cleanup === "function" ? cleanup : () => { ref(null) }
  }
  if (ref) ref.current = node
  return () => { if (ref) ref.current = null }
}
type Presentation = {
  thumbnailDesign?: boolean; square?: boolean; interactive?: boolean; tabIndex?: number
  selected?: boolean; option?: boolean; activate?: () => void
  register?: (host: MediaGalleryItemElement | null, focus: HTMLDivElement | null) => void
}

function ItemSurface({ item, presentation }: { item: MediaGalleryItemProps; presentation: Presentation }) {
  const { selected: selectedProp = false, disabled = false, layout = "Square", thumbnail, children, className, ref, tabIndex, ...props } = item
  const { thumbnailDesign = false, square = true, interactive = false, selected = selectedProp, activate, register } = presentation
  const hostRef = React.useRef<MediaGalleryItemElement | null>(null), focusRef = React.useRef<HTMLDivElement | null>(null)
  const registerRef = React.useRef(register); registerRef.current = register
  const setHost = React.useCallback((host: HTMLDivElement | null) => {
    if (!host) return
    hostRef.current = host as MediaGalleryItemElement
    const cleanup = attachRef(ref, host)
    return () => { cleanup(); hostRef.current = null; registerRef.current?.(null, null) }
  }, [ref])
  const thumbRef = React.useRef<HTMLDivElement | null>(null), contentRef = React.useRef<HTMLDivElement | null>(null)
  const [thumbnailFailed, setThumbnailFailed] = React.useState(false), [contentFailed, setContentFailed] = React.useState(false)
  const thumb = firstNode(thumbnail), content = firstNode(children)
  const useThumbnail = thumbnailDesign && thumb !== null && !thumbnailFailed
  const useContent = !useThumbnail && content !== null && !contentFailed
  // MediaGalleryItem.js _monitorLoadingError/_attachListeners: first IMG (possibly nested),
  // thumbnail-to-content fallback, and recovery when the actual image finishes loading.
  React.useLayoutEffect(() => {
    const watch = (wrapper: HTMLDivElement | null, update: (failed: boolean) => void) => {
      const image = wrapper?.querySelector("img")
      if (!image) { update(false); return () => {} }
      const changed = () => update(image.naturalHeight === 0 && image.naturalWidth === 0)
      changed(); image.addEventListener("load", changed); image.addEventListener("error", changed)
      return () => { image.removeEventListener("load", changed); image.removeEventListener("error", changed) }
    }
    const stopThumb = thumbnailDesign ? watch(thumbRef.current, setThumbnailFailed) : () => {}
    const stopContent = !useThumbnail ? watch(contentRef.current, setContentFailed) : () => {}
    return () => { stopThumb(); stopContent() }
  }, [children, thumbnail, thumbnailDesign, useThumbnail])
  React.useLayoutEffect(() => {
    if (hostRef.current) Object.assign(hostRef.current, { selected, disabled, layout })
    register?.(hostRef.current, focusRef.current)
    return () => register?.(null, null)
  }, [selected, disabled, layout, register])
  return (
    <div {...props} ref={setHost} data-slot="media-gallery-item" data-layout={layout} data-square={square || undefined}
      data-thumbnail-design={thumbnailDesign || undefined} data-interactive={interactive || undefined}
      data-selected={selected || undefined} data-disabled={disabled || undefined}
      className={cn("fiori-media-gallery-item", className)}>
      <div ref={focusRef} className="fiori-media-gallery-item__root" tabIndex={disabled ? undefined : presentation.tabIndex ?? tabIndex}
        role={presentation.option ? "option" : interactive ? "button" : undefined}
        aria-checked={presentation.option ? selected : undefined}
        aria-disabled={presentation.option && disabled || undefined}
        aria-label={item["aria-label"]}
        aria-labelledby={item["aria-labelledby"]}
        onKeyDown={(event) => {
          if (modified(event)) return
          // MediaGalleryItem.js: Enter selects on keydown; Space prevents scrolling here and selects on keyup.
          if (event.key === " " || event.key === "Spacebar") event.preventDefault()
          if (event.key === "Enter") activate?.()
        }}
        onKeyUp={(event) => { if (!modified(event) && (event.key === " " || event.key === "Spacebar")) activate?.() }}>
        <div className="fiori-media-gallery-item__mask" />
        <div className="fiori-media-gallery-item__wrapper">
          {(thumbnailFailed || contentFailed) && <Icon icon={background} className="fiori-media-gallery-item__background-icon" />}
          {/* Keep the monitored nodes mounted while the native image fallback is painted. */}
          <div ref={contentRef} className="fiori-media-gallery-item__content" hidden={!useContent}>{content}</div>
          <div ref={thumbRef} className="fiori-media-gallery-item__content fiori-media-gallery-item__thumbnail" hidden={!useThumbnail}>{thumb}</div>
        </div>
      </div>
    </div>
  )
}
/** Supported as a direct MediaGallery child, like ui5-media-gallery-item. */
function MediaGalleryItem(props: MediaGalleryItemProps) {
  return <ItemSurface item={props} presentation={{ thumbnailDesign: !isPhonePlatform(), interactive: !isPhonePlatform() }} />
}

function MediaGallery({
  showAllThumbnails = false, interactiveDisplayArea = false, layout = "Auto", menuHorizontalAlign = "Left", menuVerticalAlign = "Bottom",
  onSelectionChange, onOverflowClick, onDisplayAreaClick, accessibleName, carouselProps, overflowText = (count) => "+" + count,
  className, children, onKeyDown, ref, ...props
}: MediaGalleryProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement<MediaGalleryItemProps>)
    .map((element, index) => ({ key: String(element.key ?? index), props: element.props }))
  const firstSelectable = () => items.find((item) => selectable(item.props))
  // MediaGallery.js _updateSelection considers the FIRST selected item, then falls back
  // to the FIRST selectable item if it is invalid; a later valid selected item is not preferred.
  const requestedSelection = () => {
    const first = items.find((item) => item.props.selected)
    return first && selectable(first.props) ? first : firstSelectable()
  }
  const [selection, setSelection] = React.useState(() => requestedSelection() ?? null)
  // MediaGalleryItem.js onEnterDOM runs after the initial MediaGallery._displayContent:
  // the newly mounted main item starts with _thumbnailDesign=true (also for Wide).
  // A later _displayContent explicitly clears it. Preserve this native initial border/crop,
  // rather than applying the later display mask to an untouched gallery.
  const [mainThumbnailDesign, setMainThumbnailDesign] = React.useState(true)
  const selectionRef = React.useRef(selection); selectionRef.current = selection
  const selectedKey = selection?.key
  const propSelection = new Map(items.map((item) => [item.key, !!item.props.selected]))
  const previousPropSelection = React.useRef(propSelection)
  const [phone, setPhone] = React.useState(isPhonePlatform), [phonePage, setPhonePage] = React.useState(0)
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const hostRef = React.useRef<HTMLDivElement | null>(null), displayRef = React.useRef<HTMLDivElement | null>(null)
  const setHost = React.useCallback((host: HTMLDivElement | null) => {
    if (!host) return
    hostRef.current = host
    const cleanup = attachRef(ref, host)
    return () => { cleanup(); hostRef.current = null }
  }, [ref])
  const mainRef = React.useRef<MediaGalleryItemElement | null>(null), overflowRef = React.useRef<HTMLButtonElement | null>(null)
  const hosts = React.useRef(new Map<string, MediaGalleryItemElement>()), focuses = React.useRef(new Map<string, HTMLDivElement>())
  const [currentIndex, setCurrentIndex] = React.useState(() => Math.max(0, items.filter((item) => !item.props.disabled).findIndex((item) => item.key === selectedKey)))
  const currentRef = React.useRef(currentIndex)
  const range = mediaRange(size.width)
  const effectiveLayout = phone || !size.width || !size.height ? "Vertical" : layout === "Auto" ? range === "S" ? "Vertical" : "Horizontal" : layout
  // _calculateOverflowSize/_getOverflowSize: original slot count, maximum five measuring
  // units, and one EXTRA hidden item to reserve a button unless overflow is zero or all items.
  const available = effectiveLayout === "Horizontal" ? size.height - THUMBNAIL_MARGIN : size.width - 2 * THUMBNAIL_MARGIN
  const capacity = Math.min(Math.floor(available / THUMBNAIL_HEIGHT), 5)
  const rawOverflow = Math.max(0, items.length - capacity)
  const overflow = showAllThumbnails || !size.width || !size.height || phone ? 0
    : rawOverflow === 0 || rawOverflow === items.length ? rawOverflow : rawOverflow + 1
  const visibleItems = items.slice(0, items.length - overflow), selectableItems = items.filter((item) => selectable(item.props))
  // _getFocusableItems filters disabled ONLY: a hidden host consumes the navigation slot.
  // Its focus() is a no-op, after which _canNavigate prevents further movement from the old focus.
  const navigation = visibleItems.filter((item) => !item.props.disabled).map((item) => item.key)
  if (overflow > 0) navigation.push("__overflow")
  const normalizedIndex = Math.max(0, Math.min(currentIndex, navigation.length - 1)); currentRef.current = normalizedIndex
  const wide = selection?.props.layout === "Wide" && showAllThumbnails && effectiveLayout === "Horizontal"
  React.useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const platformPhone = isPhonePlatform(); setPhone(platformPhone)
    if (platformPhone) return
    const measure = () => {
      // _updateLayout leaves state unchanged when either real dimension is zero.
      const width = host.offsetWidth, height = host.offsetHeight
      if (width && height) setSize((old) => old.width === width && old.height === height ? old : { width, height })
    }
    measure()
    const observer = new ResizeObserver(measure); observer.observe(host)
    return () => observer.disconnect()
  }, [])
  React.useLayoutEffect(() => {
    let next = selectionRef.current
    if (!items.length) next = null
    else if (items.some((item) => previousPropSelection.current.has(item.key)
      ? previousPropSelection.current.get(item.key) !== !!item.props.selected : !!item.props.selected)) next = requestedSelection() ?? next
    else if (!next || !items.some((item) => item.key === next?.key && selectable(item.props))) next = firstSelectable() ?? next
    previousPropSelection.current = propSelection
    if (next?.key !== selectionRef.current?.key) {
      selectionRef.current = next; setSelection(next)
      if (next) setMainThumbnailDesign(false)
      const index = navigation.indexOf(next?.key ?? "")
      if (index !== -1) setCurrentIndex(index)
      if (phone) setPhonePage(Math.max(0, selectableItems.findIndex((item) => item.key === next?.key)))
    }
  })
  React.useLayoutEffect(() => {
    // _selectItemOnPhone calls Carousel.navigateTo without a user event, including initialization.
    if (phone) setPhonePage(Math.max(0, selectableItems.findIndex((item) => item.key === selectedKey)))
  }, [phone, selectedKey])
  React.useLayoutEffect(() => {
    const display = displayRef.current, host = hostRef.current
    if (!display || !host || phone || !size.width || !size.height) return
    // MediaGallery.js _toggleDisplaySquareSize restores width before measuring actual flex geometry.
    display.style.width = ""
    if (!wide) {
      const availableHeight = host.offsetHeight - 2 * THUMBNAIL_MARGIN
        - (effectiveLayout === "Vertical" ? THUMBNAIL_HEIGHT + THUMBNAIL_MARGIN : 0)
      if (display.offsetWidth > availableHeight) display.style.width = availableHeight + "px"
    }
    // _toggleMainItem9x16size uses the main item's actual width, not the gallery's width.
    const wrapper = mainRef.current?.querySelector<HTMLElement>(".fiori-media-gallery-item__wrapper")
    if (wrapper) wrapper.style.height = wide ? mainRef.current!.offsetWidth / 16 * 9 + "px" : ""
  }, [size, effectiveLayout, wide, selection, phone])
  const register = (key: string) => (host: MediaGalleryItemElement | null, focus: HTMLDivElement | null) => {
    if (host) hosts.current.set(key, host); else hosts.current.delete(key)
    if (focus) focuses.current.set(key, focus); else focuses.current.delete(key)
  }
  const selectItem = (key: string) => {
    const item = items.find((candidate) => candidate.key === key)
    if (!item || item.props.disabled || selectionRef.current?.key === key) return
    selectionRef.current = item; setSelection(item)
    setMainThumbnailDesign(false)
    const index = navigation.indexOf(key)
    if (index !== -1) setCurrentIndex(index)
    // _updateSelectedFlag is synchronous before the selection-change callback.
    hosts.current.forEach((host, itemKey) => { host.selected = itemKey === key })
    const host = hosts.current.get(key)
    if (host) onSelectionChange?.(host)
  }
  const focusNode = (index: number) => navigation[index] === "__overflow" ? overflowRef.current : focuses.current.get(navigation[index])
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || phone || modified(event) || event.target !== focusNode(currentRef.current)) return
    // ItemNavigation.js Auto, rowSize=1, Static: both arrow axes, RTL left/right, no cycling.
    const rtl = getComputedStyle(hostRef.current!).direction === "rtl"
    let next = currentRef.current
    if (event.key === "Home" || event.key === "PageUp") next = 0
    else if (event.key === "End" || event.key === "PageDown") next = navigation.length - 1
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft" && !rtl || event.key === "ArrowRight" && rtl) next--
    else if (event.key === "ArrowDown" || event.key === "ArrowRight" && !rtl || event.key === "ArrowLeft" && rtl) next++
    else return
    event.preventDefault(); next = Math.max(0, Math.min(next, navigation.length - 1))
    currentRef.current = next; setCurrentIndex(next); focusNode(next)?.focus()
  }
  return (
    <div {...props} ref={setHost} data-slot="media-gallery" data-effective-layout={effectiveLayout} data-media-range={range}
      data-show-all-thumbnails={showAllThumbnails || undefined} data-menu-horizontal-align={menuHorizontalAlign}
      data-menu-vertical-align={menuVerticalAlign} data-phone={phone || undefined}
      className={cn("fiori-media-gallery", className)} onKeyDown={handleKeyDown}>
      <div className="fiori-media-gallery__root">
        <div className="fiori-media-gallery__display-wrapper">
          <div ref={displayRef} className="fiori-media-gallery__display" onClick={() => { if (interactiveDisplayArea) onDisplayAreaClick?.() }}>
            {phone ? (
              <Carousel hideNavigationArrows pageIndex={phonePage} {...carouselProps} onNavigate={(index) => {
                // _onCarouselNavigate is CALLBACK ONLY: the page moves without changing gallery selected flags.
                setPhonePage(index)
                const host = hosts.current.get(selectableItems[index]?.key)
                if (host) onSelectionChange?.(host)
              }}>
                {selectableItems.map((item) => <ItemSurface key={item.key} item={item.props}
                  presentation={{ selected: item.key === selectedKey, register: register(item.key) }} />)}
              </Carousel>
            ) : <ItemSurface item={{ children: selection?.props.children, layout: selection?.props.layout }}
              presentation={{ thumbnailDesign: mainThumbnailDesign, square: !wide, interactive: interactiveDisplayArea, tabIndex: interactiveDisplayArea ? 0 : undefined,
                activate: () => { if (interactiveDisplayArea) onDisplayAreaClick?.() },
                register: (host) => { mainRef.current = host } }} />}
          </div>
        </div>
        {!phone && <div className="fiori-media-gallery__thumbnails-wrapper">
          <ul role="listbox" aria-label={accessibleName}>
            {/* MediaGalleryTemplate.js wraps MediaGalleryItemTemplate's focusable button in
                an option. Keep the native focus element/keyboard path, but put option semantics
                on that element: Axe nested-interactive rejects the native option/button nest.
                This changes semantic placement only, keeping geometry and callback timing.
                A hidden item's host stays hidden while its original navigation slot is retained. */}
            {visibleItems.map((item) => <li key={item.key} className="fiori-media-gallery__thumbnail" role="presentation"
              onClick={() => selectItem(item.key)}>
              <ItemSurface item={item.props} presentation={{ option: true, thumbnailDesign: true, interactive: true, selected: item.key === selectedKey,
                tabIndex: navigation[normalizedIndex] === item.key ? 0 : -1, activate: () => selectItem(item.key), register: register(item.key) }} />
            </li>)}
            {overflow > 0 && <li className="fiori-media-gallery__overflow" role="presentation">
              {/* MediaGallery.css.js styles the ui5-button host at 4rem in both densities.
                  Inline host overrides also preserve those styles against Button's utility layer. */}
              <Button ref={overflowRef} role="option" aria-checked="false" tabIndex={navigation[normalizedIndex] === "__overflow" ? 0 : -1} onClick={onOverflowClick}
                style={{ width: "4rem", height: "4rem", background: "var(--fiori-media-gallery-overflow-btn-background)",
                  color: "var(--fiori-media-gallery-overflow-btn-color)", border: "var(--fiori-media-gallery-overflow-btn-border)" }}>
                {overflowText(overflow)}
              </Button>
            </li>}
          </ul>
        </div>}
      </div>
    </div>
  )
}
export {
  MediaGallery, MediaGalleryItem, type MediaGalleryProps, type MediaGalleryItemProps, type MediaGalleryItemElement,
  type MediaGalleryLayout, type MediaGalleryItemLayout, type MediaGalleryMenuHorizontalAlign, type MediaGalleryMenuVerticalAlign,
}
