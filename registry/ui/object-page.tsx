import * as React from "react"

import { cn } from "@/lib/utils"
import { DynamicPage, DynamicPageHeader, type DynamicPageHeaderProps, type DynamicPageProps } from "@/components/ui/dynamic-page"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Title } from "@/components/ui/title"

// ObjectPage after the SAP Fiori "Object Page" floorplan guideline and SAPUI5's sap.uxap.ObjectPageLayout (Horizon).
// There is no UI5 Web Component for it; it is built from our DynamicPage (title, snapping header, pin, footer) and
// Tabs (the IconTabBar-styled navigation bar). Section/subsection/block spacing follows sap.uxap's sap_horizon CSS.
// Anatomy: DynamicPageTitle (object title, subtitle, actions) · ObjectPageHeader (avatar + header facets)
// · navigation bar (sticky below the title) · sections, each with subsections whose content sits on a card ("block").
// Modes:
// - "anchor" (default): all sections are rendered one below the other. Selecting a tab scrolls its section to the
//   top (snapping the header like UI5); scrolling updates the selected tab (scroll spy). The first section's title
//   is visually hidden (the navigation bar names it), as in UI5.
// - "tabs": only the selected section is shown (the others stay in the DOM, empty and hidden, so every tab's
//   aria-controls resolves); section titles are hidden — the tab names them.
// Keyboard: the navigation bar is the Tabs strip (one Tab stop; ←/→/Home/End move, Enter/Space select).
// Not yet implemented: subsection menus in the navigation bar, the "Show More" (see more) blocks, lazy loading.

type ObjectPageMode = "anchor" | "tabs"

type ObjectPageContextValue = {
  mode: ObjectPageMode
  selected: string | undefined
  firstId: string | undefined
  domId: (id: string) => string
}
const ObjectPageContext = React.createContext<ObjectPageContextValue | null>(null)

const slug = (v: string) => v.replace(/[^\w-]/g, "_")

type ObjectPageProps = Omit<DynamicPageProps, "subheader"> & {
  mode?: ObjectPageMode
  /** Selected section id (controlled). */
  selectedSection?: string
  defaultSelectedSection?: string
  onSelectedSectionChange?: (id: string) => void
  /** Accessible name of the navigation bar. */
  anchorBarLabel?: string
  /** Hide the navigation bar (e.g. a single section). */
  showAnchorBar?: boolean
}

function isSection(child: React.ReactNode): child is React.ReactElement<ObjectPageSectionProps> {
  return React.isValidElement(child) && (child.type as unknown) === ObjectPageSection
}

// Distance from the top at which a section counts as reached by the scroll spy.
const SPY_SLACK = 2 // px

function ObjectPage({
  mode = "anchor",
  selectedSection,
  defaultSelectedSection,
  onSelectedSectionChange,
  anchorBarLabel = "Page Sections",
  showAnchorBar = true,
  scrollContainerRef,
  className,
  contentClassName,
  children,
  ...props
}: ObjectPageProps) {
  const baseId = React.useId()
  const sections = React.Children.toArray(children).filter(isSection)
  const ids = sections.map((s) => s.props.id)
  const [inner, setInner] = React.useState(defaultSelectedSection ?? ids[0])
  const selected = selectedSection ?? inner
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  // While navigating via the bar, the scroll spy keeps the chosen section until the user scrolls by themselves.
  const locked = React.useRef<string | null>(null)
  const latest = React.useRef({ ids, selected, mode })
  latest.current = { ids, selected, mode }

  const domId = React.useCallback((id: string) => `${baseId}-section-${slug(id)}`, [baseId])
  const setSelected = React.useCallback(
    (id: string) => {
      if (id === latest.current.selected) return
      if (selectedSection === undefined) setInner(id)
      onSelectedSectionChange?.(id)
    },
    [selectedSection, onSelectedSectionChange]
  )

  const setScrollRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      scrollRef.current = el
      if (typeof scrollContainerRef === "function") scrollContainerRef(el)
      else if (scrollContainerRef) (scrollContainerRef as React.RefObject<HTMLDivElement | null>).current = el
    },
    [scrollContainerRef]
  )

  /** Height of everything sticky at the top: the title area plus the navigation bar. */
  const stickyHeight = () => {
    const root = rootRef.current
    const title = root?.querySelector<HTMLElement>(".fiori-dynamic-page__title-header")
    const bar = root?.querySelector<HTMLElement>("[data-slot=dynamic-page-subheader]")
    return (title?.getBoundingClientRect().height ?? 0) + (bar?.getBoundingClientRect().height ?? 0)
  }
  const sectionTop = (container: HTMLElement, el: HTMLElement) =>
    el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop

  const scrollToSection = (id: string) => {
    const container = scrollRef.current
    const el = container && document.getElementById(domId(id))
    if (!container || !el) return
    const place = () => {
      const first = latest.current.ids[0] === id
      container.scrollTop = first && latest.current.mode === "anchor" ? 0 : Math.max(0, sectionTop(container, el) - stickyHeight())
    }
    place()
    // The header snaps once the page has scrolled past it (debounced): place again with the snapped title height.
    setTimeout(place, 60)
  }

  const onSelect = (id: string) => {
    locked.current = latest.current.mode === "anchor" ? id : null
    setSelected(id)
    requestAnimationFrame(() => scrollToSection(id))
  }

  // Scroll spy (anchor mode).
  React.useEffect(() => {
    const container = scrollRef.current
    if (!container || mode !== "anchor") return
    const onScroll = () => {
      if (locked.current) return
      const top = container.getBoundingClientRect().top + stickyHeight() + SPY_SLACK
      const { ids: list } = latest.current
      let current = list[0]
      for (const id of list) {
        const el = document.getElementById(domId(id))
        if (el && el.getBoundingClientRect().top <= top) current = id
      }
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        // At the bottom: the last section that starts inside the viewport wins.
        for (const id of list) {
          const el = document.getElementById(domId(id))
          if (el && el.getBoundingClientRect().top < container.getBoundingClientRect().bottom) current = id
        }
      }
      if (current) setSelected(current)
    }
    const unlock = () => (locked.current = null)
    container.addEventListener("scroll", onScroll, { passive: true })
    container.addEventListener("wheel", unlock, { passive: true })
    container.addEventListener("touchmove", unlock, { passive: true })
    container.addEventListener("keydown", unlock)
    container.addEventListener("pointerdown", unlock)
    return () => {
      container.removeEventListener("scroll", onScroll)
      container.removeEventListener("wheel", unlock)
      container.removeEventListener("touchmove", unlock)
      container.removeEventListener("keydown", unlock)
      container.removeEventListener("pointerdown", unlock)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, domId, setSelected])

  const ctx = React.useMemo<ObjectPageContextValue>(
    () => ({ mode, selected, firstId: ids[0], domId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, selected, ids[0], domId]
  )

  const anchorBar =
    showAnchorBar && sections.length > 0 ? (
      <Tabs value={selected} onValueChange={onSelect} className="fiori-object-page__anchor-bar">
        <TabsList aria-label={anchorBarLabel}>
          {sections.map((s) => (
            <TabsTrigger key={s.props.id} value={s.props.id} aria-controls={domId(s.props.id)} data-section={s.props.id}>
              {s.props.titleText}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ) : undefined

  return (
    <ObjectPageContext.Provider value={ctx}>
      <DynamicPage
        ref={rootRef}
        data-object-page=""
        data-mode={mode}
        className={cn("fiori-object-page", className)}
        contentClassName={cn("fiori-object-page__content", contentClassName)}
        scrollContainerRef={setScrollRef}
        subheader={anchorBar}
        {...props}
      >
        {children}
      </DynamicPage>
    </ObjectPageContext.Provider>
  )
}

type ObjectPageSectionProps = Omit<React.ComponentProps<"section">, "id" | "title"> & {
  /** Unique section id (also the navigation bar value). */
  id: string
  titleText: string
  /** Show the section title (default: true, except the first section in anchor mode and every section in tabs mode). */
  showTitle?: boolean
}

function ObjectPageSection({ id, titleText, showTitle, className, children, ...props }: ObjectPageSectionProps) {
  const ctx = React.useContext(ObjectPageContext)
  if (!ctx) throw new Error("<ObjectPageSection> must be used inside <ObjectPage>")
  const domId = ctx.domId(id)
  const first = ctx.firstId === id
  const titleVisible = showTitle ?? (ctx.mode === "anchor" ? !first : false)
  const hidden = ctx.mode === "tabs" && ctx.selected !== id
  return (
    <section
      id={domId}
      data-slot="object-page-section"
      data-section={id}
      data-first={first ? "" : undefined}
      aria-labelledby={`${domId}-title`}
      hidden={hidden}
      className={cn("fiori-object-page-section", className)}
      {...props}
    >
      <div className={cn("fiori-object-page-section__header", !titleVisible && "sr-only")}>
        <Title id={`${domId}-title`} level="H2" size="H4" wrappingType="None" className="fiori-object-page-section__title">
          {titleText}
        </Title>
      </div>
      {!hidden && <div className="fiori-object-page-section__container">{children}</div>}
    </section>
  )
}

type ObjectPageSubSectionProps = Omit<React.ComponentProps<"div">, "title"> & {
  titleText?: string
  /** Actions shown at the end of the subsection title row. */
  actions?: React.ReactNode
  /** Drop the card background around the content (for content that brings its own, e.g. a table). */
  transparent?: boolean
}

function ObjectPageSubSection({ titleText, actions, transparent, className, children, ...props }: ObjectPageSubSectionProps) {
  const id = React.useId()
  return (
    <div
      data-slot="object-page-subsection"
      role={titleText ? "region" : undefined}
      aria-labelledby={titleText ? `${id}-title` : undefined}
      className={cn("fiori-object-page-subsection", className)}
      {...props}
    >
      {(titleText || actions) && (
        <div className="fiori-object-page-subsection__header">
          {titleText && (
            <Title id={`${id}-title`} level="H3" size="H5" wrappingType="None" className="fiori-object-page-subsection__title">
              {titleText}
            </Title>
          )}
          {actions && <div className="fiori-object-page-subsection__actions">{actions}</div>}
        </div>
      )}
      <div className="fiori-object-page-subsection__block" data-transparent={transparent ? "" : undefined}>
        {children}
      </div>
    </div>
  )
}

type ObjectPageHeaderProps = DynamicPageHeaderProps & {
  /** Avatar or image shown first (guideline: avatar size L / XL, square for objects, circle for people). */
  avatar?: React.ReactNode
}

/** DynamicPageHeader with the object page header layout: avatar, then facets flowing in a wrapping row. */
function ObjectPageHeader({ avatar, className, children, ...props }: ObjectPageHeaderProps) {
  return (
    <DynamicPageHeader className={cn("fiori-object-page-header", className)} {...props}>
      <div className="fiori-object-page-header__content">
        {avatar && <div className="fiori-object-page-header__avatar">{avatar}</div>}
        {children}
      </div>
    </DynamicPageHeader>
  )
}

type ObjectPageHeaderFacetProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Facet title (e.g. "Status"); omit for attribute lists. */
  title?: React.ReactNode
}

/** One header facet: a key-value block, KPI, rating, progress, or a list of ObjectAttributes. */
function ObjectPageHeaderFacet({ title, className, children, ...props }: ObjectPageHeaderFacetProps) {
  const id = React.useId()
  return (
    <div
      data-slot="object-page-header-facet"
      role={title ? "group" : undefined}
      aria-labelledby={title ? `${id}-title` : undefined}
      className={cn("fiori-object-page-header-facet", className)}
      {...props}
    >
      {title && (
        <div id={`${id}-title`} className="fiori-object-page-header-facet__title">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

export {
  ObjectPage,
  ObjectPageSection,
  ObjectPageSubSection,
  ObjectPageHeader,
  ObjectPageHeaderFacet,
  type ObjectPageProps,
  type ObjectPageMode,
  type ObjectPageSectionProps,
  type ObjectPageSubSectionProps,
  type ObjectPageHeaderProps,
  type ObjectPageHeaderFacetProps,
}
