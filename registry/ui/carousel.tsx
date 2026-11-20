// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale } from "@/lib/fiori-locale"

// UI5 2.28 Carousel fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { slimArrowLeft, slimArrowRight } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Mirrors ui5-carousel (Horizon, @ui5/webcomponents 2.28). A "page" starts at any item: with N items and
// P per page there are N-P+1 pages. Items per page come from the component's own width
// (S <600, M <1024, L <1440, XL). Children with the `hidden` prop are left out.
// Keyboard (focus on an item, or inside one): ←/↑ and →/↓ move item by item, changing page when needed;
// Home/End go to the first/last item; PageUp/PageDown jump 10 pages (UI5 maps PageUp forward and PageDown
// back; we keep that); F7 switches between the item and its content. Arrow keys inside a text field stay
// with the field. Content arrows appear on hover (always on touch devices); Navigation arrows stay.
// Swipe or mouse drag changes page. Unlike UI5, the item's focus ring is keyboard-only (project rule).

type CarouselArrowsPlacement = "Content" | "Navigation"
type CarouselPageIndicatorType = "Default" | "Numeric"
type CarouselBackgroundDesign = "Translucent" | "Solid" | "Transparent"
type CarouselBorderDesign = "Solid" | "None"

const PAGE_TYPE_LIMIT = 9
const PAGE_STEP = 10
const SWIPE_THRESHOLD = 10
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function parseItemsPerPage(spec: string, width: number | undefined) {
  const size = (prefix: string) => {
    const part = spec.split(" ").find((p) => p.startsWith(prefix) && (prefix !== "S" || !p.startsWith("XL")))
    return Number(part?.slice(prefix.length)) || 1
  }
  if (!width) return size("L")
  if (width < 600) return size("S")
  if (width < 1024) return size("M")
  if (width < 1440) return size("L")
  return size("XL")
}

/** @accessibility accessibleName names the carousel section; listLabel names its item list. Items own positional metadata and visible tab stops. Arrow keys move items, Home/End reach boundaries, PageUp/PageDown jump pages, and F7 moves between an item and its interactive content. previousPageText and nextPageText name arrows. */
type CarouselProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** Wrap around at both ends. */
  cyclic?: boolean
  /** Items per page by breakpoint, e.g. "S1 M2 L3 XL4" (default all 1). */
  itemsPerPage?: string
  hideNavigationArrows?: boolean
  hidePageIndicator?: boolean
  /** "Default" shows dots (up to 8 pages, then numbers); "Numeric" always shows "1 of 5". */
  pageIndicatorType?: CarouselPageIndicatorType
  /** "Content": arrows over the content, on hover. "Navigation": beside the page indicator. */
  arrowsPlacement?: CarouselArrowsPlacement
  backgroundDesign?: CarouselBackgroundDesign
  pageIndicatorBackgroundDesign?: CarouselBackgroundDesign
  pageIndicatorBorderDesign?: CarouselBorderDesign
  /** Controlled page (UI5's navigateTo). Doesn't fire onNavigate by itself. */
  pageIndex?: number
  defaultPageIndex?: number
  /** The user moved to another page. */
  onNavigate?: (pageIndex: number) => void
  accessibleName?: string
  ofText?: string
  previousPageText?: string
  nextPageText?: string
  roleDescription?: string
  listLabel?: string
}

function Carousel({
  cyclic = false,
  itemsPerPage = "S1 M1 L1 XL1",
  hideNavigationArrows = false,
  hidePageIndicator = false,
  pageIndicatorType = "Default",
  arrowsPlacement = "Content",
  backgroundDesign = "Translucent",
  pageIndicatorBackgroundDesign = "Solid",
  pageIndicatorBorderDesign = "Solid",
  pageIndex,
  defaultPageIndex = 0,
  onNavigate,
  accessibleName,
  ofText: ofTextProp,
  previousPageText: previousPageTextProp,
  nextPageText: nextPageTextProp,
  roleDescription: roleDescriptionProp,
  listLabel: listLabelProp,
  className,
  children,
  ...props
}: CarouselProps) {
  const { t } = useFioriLocale()
  const ofText = ofTextProp ?? t("CAROUSEL_OF_TEXT", "of") // UI5 CAROUSEL_OF_TEXT
  const previousPageText = previousPageTextProp ?? t("CAROUSEL_PREVIOUS_ARROW_TEXT", "Previous Page") // UI5 CAROUSEL_PREVIOUS_ARROW_TEXT
  const nextPageText = nextPageTextProp ?? t("CAROUSEL_NEXT_ARROW_TEXT", "Next Page") // UI5 CAROUSEL_NEXT_ARROW_TEXT
  const roleDescription = roleDescriptionProp ?? t("CAROUSEL_ARIA_ROLE_DESCRIPTION", "Carousel") // UI5 CAROUSEL_ARIA_ROLE_DESCRIPTION
  const listLabel = listLabelProp ?? t("CAROUSEL_ARIA_LIST_LABEL", "Item Container") // UI5 CAROUSEL_ARIA_LIST_LABEL

  const hostRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ width?: number; rtl: boolean }>({ rtl: false })
  const [innerPage, setInnerPage] = React.useState(defaultPageIndex)
  const [focusedState, setFocused] = React.useState(defaultPageIndex)
  const [hovered, setHovered] = React.useState(false)
  const [touchOnly, setTouchOnly] = React.useState(false)
  // Resizing moves the content without animation; the flag lasts for the render it causes (as UI5's _resizing).
  const resizing = React.useRef(false)
  // Bumped to move focus to the focused item after the render; always changes, so a request made when
  // nothing else changed (arrow key at the last item) can't linger and steal focus on a later render.
  const [focusRequest, setFocusRequest] = React.useState(0)
  const requestFocus = () => setFocusRequest((n) => n + 1)
  const lastInner = React.useRef<HTMLElement | null>(null)

  const items = React.Children.toArray(children).filter(
    (c) => !(React.isValidElement<{ hidden?: boolean }>(c) && c.props.hidden)
  )
  const count = items.length
  const perPage = parseItemsPerPage(itemsPerPage, size.width)
  const pagesCount = count > perPage ? count - perPage + 1 : 1
  const maxPage = Math.max(0, count - perPage)
  const page = clamp(pageIndex ?? innerPage, 0, maxPage)
  const itemWidth = size.width ? Math.floor(size.width / perPage) : 0
  // A controlled page change can leave the focused item off-page.
  const focused = count ? clamp(focusedState, page, Math.min(page + perPage - 1, count - 1)) : 0
  const isVisible = (i: number) => i >= page && i < page + perPage

  React.useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return
    const measure = () => {
      resizing.current = true
      setSize({ width: el.offsetWidth, rtl: getComputedStyle(el).direction === "rtl" })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    setTouchOnly(window.matchMedia("(hover: none)").matches)
    return () => ro.disconnect()
  }, [])

  // Fewer pages after a resize or fewer items: keep the page in range and report it.
  const navigateRef = React.useRef(onNavigate)
  React.useEffect(() => {
    navigateRef.current = onNavigate
  })
  React.useEffect(() => {
    if (pageIndex === undefined && innerPage > maxPage && size.width) {
      setInnerPage(maxPage)
      navigateRef.current?.(maxPage)
    }
  }, [innerPage, maxPage, pageIndex, size.width])

  const suppressAnimation = resizing.current
  React.useLayoutEffect(() => {
    resizing.current = false
  })
  const focusedRef = React.useRef(focused)
  focusedRef.current = focused
  React.useLayoutEffect(() => {
    if (focusRequest) listRef.current?.querySelectorAll<HTMLElement>(":scope > .fiori-carousel__item")[focusedRef.current]?.focus({ preventScroll: true })
  }, [focusRequest])

  const setPage = (next: number) => {
    if (next === page) return
    setInnerPage(next)
    onNavigate?.(next)
  }
  // UI5's _changePageIndex: go to the page that starts at `index`.
  const changePage = (index: number, moveFocus = false) => {
    const next = clamp(index, 0, maxPage)
    if (moveFocus || focused < next || focused > next + perPage - 1) setFocused(clamp(index, 0, count - 1))
    setPage(next)
  }
  // UI5's _changeFocusIndex: focus an item, scrolling just enough to show it.
  const changeFocus = (index: number) => {
    const to = clamp(index, 0, count - 1)
    let next = page
    if (to < page) next = to
    else if (to > page + perPage - 1) next = to - perPage + 1
    setPage(next)
    setFocused(to)
    requestFocus()
  }
  const navigateItem = (delta: 1 | -1) => {
    let to = focused + delta
    if (cyclic && to < 0) to = count - 1
    if (cyclic && to > count - 1) to = 0
    changeFocus(to)
  }
  const arrowForward = () => {
    let next = page + 1
    if (cyclic && next > count - perPage) next = 0
    changePage(next)
    requestFocus()
  }
  const arrowBack = () => {
    let next = page - 1
    if (cyclic && next < 0) next = count - 1
    changePage(next)
    requestFocus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const target = e.target as HTMLElement
    if (e.key === "F7") {
      const item = target.closest<HTMLElement>(".fiori-carousel__item")
        ?? listRef.current?.querySelectorAll<HTMLElement>(":scope > .fiori-carousel__item")[focused]
      if (!item) return
      e.preventDefault()
      if (target !== item) {
        lastInner.current = target
        item.focus()
      } else {
        const inner = lastInner.current && item.contains(lastInner.current) ? lastInner.current : item.querySelector<HTMLElement>(FOCUSABLE)
        inner?.focus()
      }
      return
    }
    if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
    const jump = (index: number) => {
      e.preventDefault()
      changePage(index, true)
      requestFocus()
    }
    if (e.key === "Home") jump(0)
    else if (e.key === "End") jump(count - 1)
    else if (e.key === "PageUp") jump(page + PAGE_STEP)
    else if (e.key === "PageDown") jump(page - PAGE_STEP)
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      navigateItem(-1)
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      navigateItem(1)
    }
  }

  const onFocus = (e: React.FocusEvent<HTMLElement>) => {
    const list = listRef.current
    if (!list) return
    const i = [...list.children].findIndex((item) => item.contains(e.target as Node))
    if (i >= 0) setFocused(i)
  }

  // Arrows don't take focus: it goes to the item once the page has changed.
  const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("[data-carousel-arrow]")) e.preventDefault()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest("[data-carousel-arrow]") || target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
    const startX = e.clientX
    const startY = e.clientY
    const stop = () => {
      document.removeEventListener("pointerup", up)
      document.removeEventListener("pointercancel", stop)
    }
    const up = (ev: PointerEvent) => {
      stop()
      const dx = ev.clientX - startX
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(ev.clientY - startY) < SWIPE_THRESHOLD) return
      if (dx === 0) return
      // Dragging towards the end of the line reveals the previous item; mirrored in RTL.
      navigateItem(dx > 0 === !size.rtl ? -1 : 1)
    }
    document.addEventListener("pointerup", up)
    document.addEventListener("pointercancel", stop)
  }

  const hasManyPages = pagesCount > 1
  const navigationArrows = !hideNavigationArrows && arrowsPlacement === "Navigation"
  const displayArrows = (arrowsPlacement === "Navigation" || hovered || touchOnly) && hasManyPages && !hideNavigationArrows
  const renderNavigation = hasManyPages && (navigationArrows || !hidePageIndicator)
  const withButtons = renderNavigation && navigationArrows
  const hasPrev = cyclic || (focused - 1 >= 0 && page !== 0)
  const hasNext = cyclic || (focused + 1 <= count - 1 && page < pagesCount - 1)
  const dots = pageIndicatorType !== "Numeric" && pagesCount < PAGE_TYPE_LIMIT

  const arrow = (forward: boolean) => (
    <button
      type="button"
      tabIndex={-1}
      data-carousel-arrow={forward ? "forward" : "back"}
      title={forward ? nextPageText : previousPageText}
      aria-label={forward ? nextPageText : previousPageText}
      className={cn("fiori-carousel__navigation-button", !(forward ? hasNext : hasPrev) && "fiori-carousel__navigation-button--hidden")}
      onClick={forward ? arrowForward : arrowBack}
    >
      <Icon icon={forward ? slimArrowRight : slimArrowLeft} className="size-full" />
    </button>
  )

  return (
    <div ref={hostRef} data-slot="carousel" data-sap-ui-fastnavgroup="true" className={cn("fiori-carousel", className)} {...props}>
      <section
        className={cn("fiori-carousel__root", `fiori-carousel__background-${backgroundDesign.toLowerCase()}`)}
        aria-label={accessibleName}
        aria-roledescription={roleDescription}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        onMouseDown={onMouseDown}
        onPointerDown={onPointerDown}
      >
        <div className={cn("fiori-carousel__viewport", pagesCount === 1 && "fiori-carousel__viewport--single")}>
          <div
            ref={listRef}
            role="list"
            aria-label={listLabel}
            className={cn(
              "fiori-carousel__content",
              suppressAnimation && "fiori-carousel__content-no-animation",
              renderNavigation && "fiori-carousel__content-has-navigation"
            )}
            style={{ transform: `translate3d(${size.rtl ? "" : "-"}${page * itemWidth}px, 0, 0)` }}
          >
            {items.map((item, i) => (
              <div
                key={React.isValidElement(item) && item.key != null ? item.key : i}
                role="listitem"
                aria-posinset={i + 1}
                aria-setsize={count}
                aria-hidden={!isVisible(i)}
                tabIndex={isVisible(i) ? 0 : -1}
                className={cn("fiori-carousel__item", !isVisible(i) && "fiori-carousel__item--hidden")}
                style={{ width: itemWidth }}
              >
                {item}
              </div>
            ))}
          </div>
          {displayArrows && arrowsPlacement === "Content" && (
            <div className="fiori-carousel__navigation-arrows">
              {arrow(false)}
              {arrow(true)}
            </div>
          )}
        </div>
        {renderNavigation && (
          <div
            className={cn(
              "fiori-carousel__navigation-wrapper",
              withButtons && "fiori-carousel__navigation-with-buttons",
              `fiori-carousel__navigation-wrapper-bg-${pageIndicatorBackgroundDesign.toLowerCase()}`,
              `fiori-carousel__navigation-wrapper-border-${pageIndicatorBorderDesign.toLowerCase()}`
            )}
          >
            {displayArrows && arrowsPlacement === "Navigation" && arrow(false)}
            <div className="fiori-carousel__navigation">
              {!hidePageIndicator &&
                (dots ? (
                  Array.from({ length: pagesCount }, (_, i) => (
                    <div key={i} aria-hidden="true" className={cn("fiori-carousel__navigation-dot", i === page && "fiori-carousel__navigation-dot--active")} />
                  ))
                ) : (
                  <div dir="auto" className="fiori-carousel__navigation-text">
                    {page + 1}&nbsp;{ofText}&nbsp;{pagesCount}
                  </div>
                ))}
            </div>
            {displayArrows && arrowsPlacement === "Navigation" && arrow(true)}
          </div>
        )}
      </section>
    </div>
  )
}

const FOCUSABLE = 'a[href],a[tabindex="0"],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'

export { Carousel, type CarouselProps, type CarouselArrowsPlacement, type CarouselPageIndicatorType, type CarouselBackgroundDesign, type CarouselBorderDesign }
