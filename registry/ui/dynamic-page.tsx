import * as React from "react"

// UI5 2.28 DynamicPageTitle fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { pushpinOff, pushpinOn, slimArrowDown, slimArrowUp } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { ToggleButton } from "@/components/ui/toggle-button"

// Mirrors ui5-dynamic-page / ui5-dynamic-page-title / ui5-dynamic-page-header / ui5-dynamic-page-header-actions
// (Horizon, @ui5/webcomponents-fiori 2.28).
// Layout: a scroll container holding a sticky title area, the header (scrolls away with the content), the
// expand/pin buttons centered on the header's bottom edge, the content, and a floating footer that sticks to
// the page's bottom edge.
// Behaviour (as UI5):
// - Scrolling past the header's height + 10px snaps the header; scrolling back above header height − 10px
//   expands it (scroll events debounced by 5ms). A pinned header never snaps on scroll.
// - Clicking the title (or Enter / Space on it) and the expand/collapse button toggle the header. Toggling at
//   the top hides the header entirely; toggling while scrolled shows the header in the sticky title area.
// - The pin button keeps the header in the sticky area while the content scrolls; snapping unpins it.
// - The title is a button with aria-expanded and aria-describedby "Toggle Header" while the page has a header;
//   the title+header area is a "banner" (overridable) labelled "Header Expanded" / "Header Snapped".
// Not yet implemented: the phone-only "snappedTitleOnMobile" title.

type DynamicPageTexts = {
  headerExpanded: string
  headerSnapped: string
  expandHeader: string
  collapseHeader: string
  pinHeader: string
  unpinHeader: string
  toggleHeader: string
}

const defaultDynamicPageTexts: DynamicPageTexts = {
  headerExpanded: "Header Expanded",
  headerSnapped: "Header Snapped",
  expandHeader: "Expand Header",
  collapseHeader: "Collapse Header",
  pinHeader: "Pin Header",
  unpinHeader: "Unpin Header",
  toggleHeader: "Toggle Header",
}

const SCROLL_DEBOUNCE_RATE = 5 // ms
const SCROLL_THRESHOLD = 10 // px

type AreaAttributes<R extends string> = { role?: R; name?: string }

type DynamicPageAccessibilityAttributes = {
  root?: AreaAttributes<"none" | "main" | "region">
  header?: AreaAttributes<"none" | "banner" | "region">
  content?: AreaAttributes<"none" | "main" | "region" | "form">
  footer?: AreaAttributes<"none" | "contentinfo" | "region">
}

type DynamicPageContextValue = {
  snapped: boolean
  interactive: boolean
  hovered: boolean
  texts: DynamicPageTexts
  onToggleTitle: () => void
  titleRef: React.RefObject<HTMLDivElement | null>
}
const DynamicPageContext = React.createContext<DynamicPageContextValue | null>(null)

type DynamicPageProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** A <DynamicPageTitle>. */
  title?: React.ReactNode
  /** A <DynamicPageHeader>. Without it the title is not interactive and there are no expand/pin buttons. */
  header?: React.ReactNode
  /** Footer content, usually a <Bar design="floating-footer">. Shown while `showFooter` is set. */
  footer?: React.ReactNode
  showFooter?: boolean
  /** Hides the pin button. */
  hidePinButton?: boolean
  /** Pinned header (controlled). */
  headerPinned?: boolean
  defaultHeaderPinned?: boolean
  /** Fired when the pin button is toggled (UI5 "pin-button-toggle"). */
  onPinButtonToggle?: (pinned: boolean) => void
  /** Snapped header. Changing it after mount toggles the header like a title click. */
  headerSnapped?: boolean
  defaultHeaderSnapped?: boolean
  /** Fired when the header snaps or expands, by scrolling or toggling (UI5 "title-toggle"). */
  onTitleToggle?: (snapped: boolean) => void
  /**
   * Content placed between the header and the page content that sticks below the title once the header has
   * scrolled away (not part of ui5-dynamic-page; ObjectPage uses it for its anchor bar).
   */
  subheader?: React.ReactNode
  accessibilityAttributes?: DynamicPageAccessibilityAttributes
  texts?: Partial<DynamicPageTexts>
  /** The element that scrolls (for scroll spies, programmatic scrolling). */
  scrollContainerRef?: React.Ref<HTMLDivElement>
  contentClassName?: string
}

const roleOf = (role?: string) => (role === "none" ? undefined : role)

function DynamicPage({
  title,
  header,
  footer,
  showFooter = false,
  hidePinButton = false,
  headerPinned: pinnedProp,
  defaultHeaderPinned = false,
  onPinButtonToggle,
  headerSnapped: snappedProp,
  defaultHeaderSnapped = false,
  onTitleToggle,
  subheader,
  accessibilityAttributes = {},
  texts: textsProp,
  scrollContainerRef,
  contentClassName,
  className,
  children,
  ...props
}: DynamicPageProps) {
  const texts = { ...defaultDynamicPageTexts, ...textsProp }
  const hasHeading = !!header
  const initialSnapped = snappedProp ?? defaultHeaderSnapped
  const [state, setState] = React.useState({ snapped: initialSnapped, stick: initialSnapped })
  const [innerPinned, setInnerPinned] = React.useState(defaultHeaderPinned)
  const pinned = pinnedProp ?? innerPinned
  const [hovered, setHovered] = React.useState(false)
  const [stickyTop, setStickyTop] = React.useState(0)

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const titleWrapperRef = React.useRef<HTMLDivElement>(null)
  const titleRef = React.useRef<HTMLDivElement>(null)
  const headerRef = React.useRef<HTMLDivElement>(null)
  const expandButtonRef = React.useRef<HTMLButtonElement>(null)
  const pinButtonRef = React.useRef<HTMLButtonElement>(null)
  const flags = React.useRef({ isToggled: false, skipSnapOnScroll: false, debounce: 0 as ReturnType<typeof setTimeout> | 0 })
  // Latest values for the event handlers (scroll handlers run outside React's render cycle).
  const live = React.useRef({ state, pinned })
  live.current = { state, pinned }
  const afterRender = React.useRef<(() => void)[]>([])

  const setScrollRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      scrollRef.current = el
      if (typeof scrollContainerRef === "function") scrollContainerRef(el)
      else if (scrollContainerRef) (scrollContainerRef as React.RefObject<HTMLDivElement | null>).current = el
    },
    [scrollContainerRef]
  )

  const setPinned = (p: boolean) => {
    if (pinnedProp === undefined) setInnerPinned(p)
    onPinButtonToggle?.(p)
  }
  const commit = (next: { snapped: boolean; stick: boolean }) => {
    const prev = live.current.state
    live.current = { ...live.current, state: next }
    setState(next)
    return prev.snapped !== next.snapped
  }

  const headerHeight = () => headerRef.current?.getBoundingClientRect().height ?? 0

  const snapTitleByScroll = () => {
    const container = scrollRef.current
    const { state: s, pinned: p } = live.current
    if (!title || !hasHeading || p || !container) return
    const f = flags.current
    if (f.isToggled) {
      f.isToggled = false
      return
    }
    if (f.skipSnapOnScroll) {
      f.skipSnapOnScroll = false
      return
    }
    const scrollTop = container.scrollTop
    const height = headerHeight()
    let next = { ...s }
    if (s.snapped && scrollTop > height) next.stick = false
    const shouldSnap = !s.snapped && scrollTop > height + SCROLL_THRESHOLD
    const shouldExpand = s.snapped && (scrollTop < height - SCROLL_THRESHOLD || (!scrollTop && !height))
    if (shouldSnap) {
      next = { snapped: true, stick: false }
      // At the very top, scroll down a bit so snapping and expanding don't loop.
      requestAnimationFrame(() => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0) scrollRef.current.scrollTop = SCROLL_THRESHOLD
      })
    } else if (shouldExpand) {
      next = { ...next, snapped: false }
    }
    if (next.snapped !== s.snapped || next.stick !== s.stick) {
      if (commit(next)) onTitleToggle?.(next.snapped)
    }
  }

  const onScroll = () => {
    const f = flags.current
    if (f.debounce) clearTimeout(f.debounce)
    f.debounce = setTimeout(() => {
      f.debounce = 0
      snapTitleByScroll()
    }, SCROLL_DEBOUNCE_RATE)
  }
  React.useEffect(() => () => {
    if (flags.current.debounce) clearTimeout(flags.current.debounce)
  }, [])

  const toggleHeader = () => {
    const container = scrollRef.current
    if (!container) return
    const s = live.current.state
    const height = headerHeight()
    const scrollTop = container.scrollTop
    if (!s.snapped && live.current.pinned) setPinned(false)
    if (scrollTop <= SCROLL_THRESHOLD) {
      commit({ snapped: !s.snapped, stick: !s.snapped })
      return
    }
    if (scrollTop > SCROLL_THRESHOLD && scrollTop < height) {
      if (!s.snapped) {
        commit({ snapped: true, stick: true })
        container.scrollTop = 0
      } else {
        commit({ snapped: false, stick: false })
      }
      return
    }
    commit({ snapped: !s.snapped, stick: !s.stick })
    flags.current.skipSnapOnScroll = true
    afterRender.current.push(() => {
      const c = scrollRef.current
      if (c && live.current.state.snapped && c.scrollTop < SCROLL_THRESHOLD) c.scrollTop = SCROLL_THRESHOLD
    })
  }

  const onToggleTitle = () => {
    if (!hasHeading) return
    flags.current.isToggled = true
    toggleHeader()
    onTitleToggle?.(live.current.state.snapped)
    afterRender.current.push(() => titleRef.current?.querySelector<HTMLElement>("[data-dp-focus-area]")?.focus({ preventScroll: true }))
  }
  const onExpandClick = () => {
    flags.current.isToggled = true
    toggleHeader()
    onTitleToggle?.(live.current.state.snapped)
    afterRender.current.push(() => expandButtonRef.current?.focus({ preventScroll: true }))
  }
  const onPinClick = () => {
    const next = !live.current.pinned
    setPinned(next)
    const s = live.current.state
    if (next) commit({ ...s, stick: true })
    else if (scrollRef.current && scrollRef.current.scrollTop === 0) commit({ ...s, stick: false })
    afterRender.current.push(() => pinButtonRef.current?.focus({ preventScroll: true }))
  }

  // `headerSnapped` changed from outside: toggle like the UI5 setter does.
  const lastSnappedProp = React.useRef(snappedProp)
  React.useEffect(() => {
    if (snappedProp === undefined || snappedProp === lastSnappedProp.current) return
    lastSnappedProp.current = snappedProp
    if (snappedProp !== live.current.state.snapped) toggleHeader()
  })

  React.useLayoutEffect(() => {
    const queued = afterRender.current
    afterRender.current = []
    queued.forEach((fn) => fn())
  })

  const { snapped, stick } = state
  const headerInTitle = !snapped && (stick || pinned)
  const headerInContent = !stick && !headerInTitle
  const actionsInTitle = snapped || stick || pinned
  const headerLabel = snapped ? texts.headerSnapped : texts.headerExpanded

  // Sticky offset of the header actions and the subheader: the title (plus the header when it sits in the title area).
  React.useLayoutEffect(() => {
    const el = titleWrapperRef.current
    if (!el) return
    const update = () => setStickyTop(el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ctx = React.useMemo<DynamicPageContextValue>(
    () => ({ snapped, interactive: hasHeading, hovered, texts, onToggleTitle, titleRef }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapped, hasHeading, hovered, JSON.stringify(texts)]
  )

  const a11y = accessibilityAttributes
  const headerNode = hasHeading && (
    <div
      ref={headerRef}
      data-slot="dynamic-page-header-area"
      className="fiori-dynamic-page__header-area"
      inert={snapped || undefined}
      aria-hidden={snapped || undefined}
    >
      {header}
    </div>
  )

  return (
    <DynamicPageContext.Provider value={ctx}>
      <div
        data-slot="dynamic-page"
        data-header-snapped={snapped ? "" : undefined}
        data-header-pinned={pinned ? "" : undefined}
        data-show-footer={showFooter ? "" : undefined}
        className={cn("fiori-dynamic-page", className)}
        {...props}
      >
        <div className="fiori-dynamic-page__root" role={roleOf(a11y.root?.role)} aria-label={a11y.root?.name}>
          <div ref={setScrollRef} className="fiori-dynamic-page__scroll" onScroll={onScroll}>
            <div
              ref={titleWrapperRef}
              className="fiori-dynamic-page__title-header"
              role={a11y.header?.role ? roleOf(a11y.header.role) : "banner"}
              aria-label={a11y.header?.name ?? (hasHeading ? headerLabel : undefined)}
            >
              {title}
              {headerInTitle && headerNode}
            </div>
            {headerInContent && headerNode}
            <div
              className="fiori-dynamic-page__header-actions-wrapper"
              style={actionsInTitle ? { top: stickyTop } : undefined}
            >
              {hasHeading && (
                <DynamicPageHeaderActions
                  snapped={snapped}
                  pinned={pinned}
                  hidePinButton={hidePinButton}
                  texts={texts}
                  expandButtonRef={expandButtonRef}
                  pinButtonRef={pinButtonRef}
                  onExpandClick={onExpandClick}
                  onPinClick={onPinClick}
                  onExpandHover={setHovered}
                />
              )}
            </div>
            {subheader && (
              <div data-slot="dynamic-page-subheader" className="fiori-dynamic-page__subheader" style={{ top: stickyTop }}>
                {subheader}
              </div>
            )}
            <div
              data-slot="dynamic-page-content"
              className="fiori-dynamic-page__content"
              role={roleOf(a11y.content?.role)}
              aria-label={a11y.content?.name}
            >
              <div className={cn("fiori-dynamic-page__fit-content", contentClassName)}>
                {children}
                {showFooter && <div className="fiori-dynamic-page__spacer" />}
              </div>
            </div>
          </div>
          <div
            data-slot="dynamic-page-footer"
            className="fiori-dynamic-page__footer"
            role={roleOf(a11y.footer?.role)}
            aria-label={a11y.footer?.name}
            inert={!showFooter || undefined}
          >
            {footer}
          </div>
        </div>
      </div>
    </DynamicPageContext.Provider>
  )
}

type DynamicPageTitleProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Title shown while the header is expanded (usually a <Title>; size H5 takes the object header size). */
  heading?: React.ReactNode
  /** Title shown while the header is snapped (as in UI5, nothing is shown when it is not set). */
  snappedHeading?: React.ReactNode
  /** Below the heading while expanded. */
  subheading?: React.ReactNode
  /** Below the heading while snapped. */
  snappedSubheading?: React.ReactNode
  /** <Breadcrumbs> above the heading. */
  breadcrumbs?: React.ReactNode
  /** Toolbar with the page's actions. */
  actions?: React.ReactNode
  /** Toolbar with navigation actions (e.g. full screen, close); moves to the top row below 1280px. */
  navigationActions?: React.ReactNode
  /** Content between heading and actions, e.g. KPIs (the default slot of ui5-dynamic-page-title). */
  children?: React.ReactNode
}

function DynamicPageTitle({
  heading,
  snappedHeading,
  subheading,
  snappedSubheading,
  breadcrumbs,
  actions,
  navigationActions,
  className,
  children,
  onClick,
  ...props
}: DynamicPageTitleProps) {
  const ctx = React.useContext(DynamicPageContext)
  const snapped = ctx?.snapped ?? false
  const interactive = ctx?.interactive ?? false
  const id = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)
  const [mobileNavigationActions, setMobile] = React.useState(false)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setMobile(el.offsetWidth < 1280)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el
    if (ctx) ctx.titleRef.current = el
  }

  const shownHeading = snapped ? (snappedHeading ?? null) : heading
  const shownSubheading = snapped ? snappedSubheading : subheading
  const hasContent = children != null && children !== false
  const needsSeparator = !!navigationActions && !!actions
  const navClass = "fiori-dynamic-page-title__navigation [&>[data-slot=toolbar]]:border-none [&>[data-slot=toolbar]]:px-0"

  return (
    <div
      ref={setRef}
      data-slot="dynamic-page-title" data-sap-ui-fastnavgroup="true"
      data-snapped={snapped ? "" : undefined}
      data-interactive={interactive ? "" : undefined}
      data-hovered={ctx?.hovered ? "" : undefined}
      className={cn("fiori-dynamic-page-title", className)}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || !interactive) return
        // Controls inside the title keep their own click.
        const target = e.target as HTMLElement
        const control = target.closest("a, button, input, select, textarea, [role=button], [role=link], [tabindex]")
        if (control && !control.hasAttribute("data-dp-focus-area")) return
        ctx?.onToggleTitle()
      }}
      {...props}
    >
      <span
        data-dp-focus-area=""
        className="fiori-dynamic-page-title__focus-area"
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        aria-expanded={interactive ? !snapped : undefined}
        aria-labelledby={interactive && shownHeading ? `${id}-heading` : undefined}
        aria-describedby={interactive ? `${id}-toggle-description` : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            ctx?.onToggleTitle()
          }
        }}
      />
      <div className="fiori-dynamic-page-title__top [&>[data-slot=breadcrumbs]]:pt-(--fiori-dynamic-page-title-breadcrumbs-padding-top) [&>[data-slot=breadcrumbs]]:pb-(--fiori-dynamic-page-title-breadcrumbs-padding-bottom)">
        {breadcrumbs}
        {mobileNavigationActions && navigationActions && <div className={navClass}>{navigationActions}</div>}
      </div>
      <div className="fiori-dynamic-page-title__wrapper">
        <div
          id={`${id}-heading`}
          className={cn(
            "fiori-dynamic-page-title__heading",
            // ::slotted([ui5-title]) in the heading slots: object header title font, color and size (size H5 only).
            "[&>[data-slot=title]]:pt-(--fiori-dynamic-page-title-heading-padding-top) [&>[data-slot=title]]:font-(family-name:--sapObjectHeader_Title_FontFamily) [&>[data-slot=title]]:text-(--sapObjectHeader_Title_TextColor)",
            snapped
              ? "[&>[data-slot=title][data-size=H5]]:text-(length:--sapObjectHeader_Title_SnappedFontSize)"
              : "[&>[data-slot=title][data-size=H5]]:text-(length:--sapObjectHeader_Title_FontSize)"
          )}
        >
          {shownHeading}
        </div>
        {hasContent && <div className="fiori-dynamic-page-title__content">{children}</div>}
        <div className="fiori-dynamic-page-title__actions">
          {actions && (
            <div className="fiori-dynamic-page-title__actions-bar [&>[data-slot=toolbar]]:border-none [&>[data-slot=toolbar]]:ps-4 [&>[data-slot=toolbar]]:pe-0">
              {actions}
            </div>
          )}
          {!mobileNavigationActions && (
            <>
              {needsSeparator && <div className="fiori-dynamic-page-title__actions-separator" />}
              {navigationActions && <div className={navClass}>{navigationActions}</div>}
            </>
          )}
        </div>
      </div>
      <div
        className={cn(
          "fiori-dynamic-page-title__subheading",
          // ::slotted([slot=snappedSubheading])
          snapped &&
            "[&>*]:min-w-0 [&>*]:mt-(--fiori-dynamic-page-title-subheading-margin-top) [&>*]:text-(length:--sapFontSize) [&>*]:text-(--sapObjectHeader_Subtitle_TextColor)"
        )}
      >
        {shownSubheading}
      </div>
      {interactive && (
        <span id={`${id}-toggle-description`} className="sr-only">
          {ctx?.texts.toggleHeader}
        </span>
      )}
    </div>
  )
}

type DynamicPageHeaderProps = React.ComponentProps<"div"> & {
  /** Accessible name of the header region. Default "Header Expanded" / "Header Snapped". */
  accessibleName?: string
}

function DynamicPageHeader({ accessibleName, className, children, ...props }: DynamicPageHeaderProps) {
  const ctx = React.useContext(DynamicPageContext)
  const label = accessibleName ?? (ctx?.snapped ? ctx.texts.headerSnapped : (ctx?.texts.headerExpanded ?? defaultDynamicPageTexts.headerExpanded))
  return (
    <div data-slot="dynamic-page-header" className={cn("fiori-dynamic-page-header", className)} {...props}>
      <div role="region" aria-label={label} className="fiori-dynamic-page-header__root">
        {children}
      </div>
    </div>
  )
}

type DynamicPageHeaderActionsProps = {
  snapped: boolean
  pinned: boolean
  hidePinButton: boolean
  texts: DynamicPageTexts
  expandButtonRef: React.Ref<HTMLButtonElement>
  pinButtonRef: React.Ref<HTMLButtonElement>
  onExpandClick: () => void
  onPinClick: () => void
  onExpandHover: (hovered: boolean) => void
}

// UI5 styles these buttons from the outside (outer styles beat the button's own :host rules in every state),
// hence the important modifiers.
const headerActionClass = cn(
  "relative z-[1] h-6 w-auto min-w-6 border-[0.0625rem]",
  "bg-(--fiori-dynamic-page-header-actions-background)! border-(--sapButton_BorderColor)! text-(--fiori-dynamic-page-header-actions-color)!",
  "shadow-(--fiori-dynamic-page-header-actions-box-shadow)",
  "aria-pressed:bg-(--fiori-dynamic-page-header-actions-background-pressed)! aria-pressed:text-(--fiori-dynamic-page-header-actions-color-pressed)!"
)

/** The expand/collapse and pin buttons on the header's bottom edge (rendered by DynamicPage). */
function DynamicPageHeaderActions({
  snapped,
  pinned,
  hidePinButton,
  texts,
  expandButtonRef,
  pinButtonRef,
  onExpandClick,
  onPinClick,
  onExpandHover,
}: DynamicPageHeaderActionsProps) {
  const expandLabel = snapped ? texts.expandHeader : texts.collapseHeader
  const pinLabel = pinned ? texts.unpinHeader : texts.pinHeader
  return (
    <div data-slot="dynamic-page-header-actions" className="fiori-dynamic-page-header-actions">
      <div className="fiori-dynamic-page-header-actions__wrapper">
        <Button
          ref={expandButtonRef}
          size="icon"
          aria-label={expandLabel}
          title={expandLabel}
          className={cn(headerActionClass, "fiori-dynamic-page-header-action--expand")}
          onClick={onExpandClick}
          onMouseOver={() => onExpandHover(true)}
          onMouseOut={() => onExpandHover(false)}
        >
          <Icon icon={snapped ? slimArrowDown : slimArrowUp} />
        </Button>
        {!hidePinButton && !snapped && (
          <ToggleButton
            ref={pinButtonRef}
            size="icon"
            pressed={pinned}
            aria-label={pinLabel}
            title={pinLabel}
            className={cn(headerActionClass, "fiori-dynamic-page-header-action--pin")}
            onPressedChange={onPinClick}
          >
            <Icon icon={pinned ? pushpinOn : pushpinOff} />
          </ToggleButton>
        )}
      </div>
    </div>
  )
}

export {
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  defaultDynamicPageTexts,
  type DynamicPageProps,
  type DynamicPageTitleProps,
  type DynamicPageHeaderProps,
  type DynamicPageTexts,
  type DynamicPageAccessibilityAttributes,
}
