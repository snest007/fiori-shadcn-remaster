import * as React from "react"

import { alert, decline, error, highPriority, information, navigationDownArrow, navigationRightArrow, overflow, sysEnter2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Link } from "@/components/ui/link"
import { ListCoreContext, navItems, useListCoreValue, useListItemBehaviour } from "@/components/ui/list"
import { Menu, MenuContent, MenuTrigger } from "@/components/ui/menu"
import { Tag } from "@/components/ui/tag"

// Mirrors ui5-notification-list / ui5-li-notification / ui5-li-notification-group (Horizon).
// Keyboard (as UI5 NotificationListInternal): ↑/↓/←/→ move between items (from a button inside an item,
// ↑/↓ go to the same button of the next item), Home/End stay within the group, PageUp/PageDown by 10.
// F2 toggles between the item and its content. Enter/Space activate. Delete closes the item (UI5 fires this even
// without a close button; here only when `showClose`, so an item that can't be closed by mouse can't be by key).
// Shift+Enter toggles More/Less, Shift+F10 opens the actions menu. On a group: Space toggles, +/→ expand, -/← collapse.
// Growing belongs to groups: the public UI5 NotificationList has no growing/loading properties.

type NotificationState = "negative" | "critical" | "positive" | "information"

type NotificationTexts = {
  /** aria-label of the list (default "Notifications"). */
  list: string
  /** Show-more link (default "More" / "Less"). */
  more: string
  less: string
  /** Group growing button, independent of the description's More/Less link (default "More"). */
  growingButton: string
  /** Accessible names of the show-more link. */
  moreLabel: string
  lessLabel: string
  /** Tooltip of the menu and close buttons (default "Actions" / "Close"). */
  actions: string
  close: string
  /** Hidden read state (default "Read" / "Unread"). */
  read: string
  unread: string
  /** Hidden state names and tooltips of the state icons. */
  states: Record<NotificationState, string>
  /** Text of the importance tag (default "Important"). */
  important: string
  /** Hidden name while loading (default "Loading"). */
  loading: string
  /** Busy indicator tooltip and accessible title, independent of the hidden loading name. */
  busyTitle: string
  /** Hidden group description and toggle tooltip. */
  group: string
  expanded: string
  collapsed: string
  toggle: string
}

const defaultTexts: NotificationTexts = {
  list: "Notifications",
  more: "More",
  less: "Less",
  growingButton: "More",
  moreLabel: "More button. Show the full texts",
  lessLabel: "Less button. Show the texts with truncation",
  actions: "Actions",
  close: "Close",
  read: "Read",
  unread: "Unread",
  states: { negative: "Status Negative", critical: "Status Critical", positive: "Status Positive", information: "Status Information" },
  important: "Important",
  loading: "Loading",
  // BusyIndicator.js/ariaTitle uses BUSY_INDICATOR_TITLE ("Please wait"), not the item's loading text.
  busyTitle: "Please wait",
  group: "Notification Group",
  expanded: "Expanded",
  collapsed: "Collapsed",
  toggle: "Expand/Collapse",
}

const stateIcons = { negative: error, critical: alert, positive: sysEnter2, information }

type ListContextValue = {
  texts: NotificationTexts
  close: (value: string) => void
  toggle: (value: string, collapsed: boolean) => void
}
const NotificationContext = React.createContext<ListContextValue | null>(null)
// Object identity is one native owner-render generation, independent of React bookkeeping.
type GroupRender = { loading: boolean }
const GroupRenderContext = React.createContext<GroupRender | null>(null)

const isVisible = (el: HTMLElement) => el.offsetParent !== null
const PAGE_SIZE = 10

// NotificationListInternal.js/getEnabledItems keeps More in the navigation order separately,
// and omits both children and More when a group is collapsed or loading.
function notificationNavigationItems(root: HTMLElement | null) {
  if (!root) return []
  return [...root.querySelectorAll<HTMLElement>("[data-nav-key], [data-nli-growing]")].filter((el) => {
    if (el.closest('[data-slot="list"]') !== root || !isVisible(el)) return false
    const group = el.parentElement?.closest<HTMLElement>("[data-nli-group]")
    return !group?.hasAttribute("data-loading") && !group?.hasAttribute("data-collapsed")
  })
}

// List.js/onEndIntersection uses the module-global debounce.js timer (250ms). Keep that
// cross-group debounce, but cancel a removed group's pending callback on cleanup.
let pendingScrollLoad: { owner: symbol; timer: ReturnType<typeof setTimeout> } | undefined

// BusyIndicator.js/_preventEvent swallows keyboard propagation once the indicator is busy.
// Keep inline spinner keys from activating its surrounding More button.
function stopBusyKeyboardEvent(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.currentTarget.hasAttribute("data-busy")) event.stopPropagation()
}

type NotificationListProps = Omit<React.ComponentProps<"div">, "onClick"> & {
  /** An item was activated (click, Enter, Space). */
  onItemClick?: (value: string) => void
  /** An item's close button or Delete. Remove it from your data here. */
  onItemClose?: (value: string) => void
  /** A group was expanded or collapsed. */
  onItemToggle?: (value: string, collapsed: boolean) => void
  /** Shown when the list has no items. */
  noDataText?: string
  texts?: Partial<NotificationTexts>
}

function NotificationList({ onItemClick, onItemClose, onItemToggle, noDataText, texts: textsProp, className, children, "aria-label": ariaLabel, ...props }: NotificationListProps) {
  const texts = { ...defaultTexts, ...textsProp, states: { ...defaultTexts.states, ...textsProp?.states } }
  const { core, focusArea } = useListCoreValue({
    mode: "none",
    itemRole: "listitem",
    separators: "all",
    onItemClick,
    deleteText: texts.close,
    selectedText: "",
    notSelectedText: "",
  })
  const closeRef = React.useRef(onItemClose)
  closeRef.current = onItemClose
  // A closed item takes the focus with it: hand it to whichever item takes its place.
  const closedAt = React.useRef<number | null>(null)
  React.useLayoutEffect(() => {
    const at = closedAt.current
    if (at === null) return
    const items = navItems(core.rootRef.current).filter(isVisible)
    if (document.activeElement === document.body || !document.activeElement) items[Math.min(at, items.length - 1)]?.focus()
    if (!core.rootRef.current?.contains(document.activeElement) || items.includes(document.activeElement as HTMLElement)) closedAt.current = null
  })
  const toggleRef = React.useRef(onItemToggle)
  toggleRef.current = onItemToggle
  const ctx = React.useMemo(
    () => ({
      texts,
      close: (v: string) => {
        const items = navItems(core.rootRef.current).filter(isVisible)
        const active = document.activeElement as HTMLElement | null
        const closing = items.find((el) => el.dataset.navKey === v)
        closedAt.current = closing && active && closing.contains(active) ? items.indexOf(closing) : null
        closeRef.current?.(v)
      },
      toggle: (v: string, c: boolean) => toggleRef.current?.(v, c),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(textsProp)]
  )
  const hasData = React.Children.toArray(children).length > 0
  // ItemNavigation.js/setCurrentItem retains the numeric enabled-item index when More
  // receives focus. Loading can change which real item occupies that index; _init does
  // not remap or clamp it, and NotificationListInternal's Home/End read it directly.
  const enabledItemIndex = React.useRef(0)

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const target = e.target as HTMLElement
    const item = target.closest<HTMLElement>("[data-nav-key], [data-nli-growing]")
    if (!item || !e.currentTarget.contains(item)) return
    const items = notificationNavigationItems(core.rootRef.current)
    const i = items.indexOf(item)
    const isGrowing = item.hasAttribute("data-nli-growing")
    if (i === -1 && !isGrowing) return
    if (e.key === "PageUp" || e.key === "PageDown") {
      if (e.shiftKey || target !== item) return
      // List.js passes getEnabledItems to ItemNavigation.js/_handlePageUpFlat and
      // _handlePageDownFlat. NotificationListInternal.js keeps More only in
      // _allNavigationItems; _canNavigate leaves page keys on More uncancelled.
      const pageItems = items.filter((el) => el.hasAttribute("data-nav-key"))
      const pageIndex = pageItems.indexOf(item)
      if (pageIndex === -1) return
      const next = e.key === "PageUp" ? Math.max(pageIndex - PAGE_SIZE, 0) : Math.min(pageIndex + PAGE_SIZE, pageItems.length - 1)
      e.preventDefault()
      pageItems[next]?.focus()
      return
    }
    const isGroup = (el?: HTMLElement) => el?.hasAttribute("data-nli-group")
    const up = e.key === "ArrowUp" || e.key === "ArrowLeft"
    const down = e.key === "ArrowDown" || e.key === "ArrowRight"
    if (target !== item) {
      // On content inside the item.
      if (!up && !down) return
      e.preventDefault()
      const next = items[i + (up ? -1 : 1)]
      if (!next) return
      const action = target.dataset.nliAction
      // NotificationListInternal.js/_focusSameItemOnNextRow focuses a loading item's row,
      // whose actions are inert, instead of attempting the same action on that next row.
      const same = !next.hasAttribute("data-loading") && (e.key === "ArrowUp" || e.key === "ArrowDown") ? next.querySelector<HTMLElement>(`[data-nli-action="${action}"]`) : null
      ;(same && same.closest("[data-nav-key]") === next ? same : next).focus()
      return
    }
    let to: number
    if (up) to = i - 1
    else if (down) to = i + 1
    else if (e.key === "Home") {
      e.preventDefault()
      if (isGrowing) e.stopPropagation()
      if (isGroup(item)) return
      // NotificationListInternal.js/_handleHomeKey uses the previously focused real item:
      // growing buttons are in _allNavigationItems but not ItemNavigation's enabled items.
      const from = isGrowing ? items.indexOf(items.filter((el) => el.hasAttribute("data-nav-key"))[enabledItemIndex.current]) : i
      if (from === -1) return
      to = 0
      for (let n = from - 1; n >= 0; n--) {
        if (isGroup(items[n])) {
          to = n + 1
          break
        }
      }
    } else if (e.key === "End") {
      e.preventDefault()
      if (isGrowing) e.stopPropagation()
      const from = isGrowing ? items.indexOf(items.filter((el) => el.hasAttribute("data-nav-key"))[enabledItemIndex.current]) : i
      if (from === -1) return
      to = items.length - 1
      for (let n = from + 1; n < items.length; n++) {
        if (isGroup(items[n])) {
          to = n - 1
          break
        }
        // NotificationListInternal.js/_handleEndKey: End first goes to the last item,
        // then reaches its immediately adjacent growing button on the next End.
        if (items[n].hasAttribute("data-nli-growing")) {
          to = n === from + 1 ? n : n - 1
          break
        }
      }
    } else return
    e.preventDefault()
    // NotificationListInternal.js/_focusSameItemOnNextRow still routes directly focused
    // busy More: its omitted index is -1, so Down/Right select the first root group.
    if (isGrowing) e.stopPropagation()
    items[to]?.focus()
  }

  return (
    <ListCoreContext.Provider value={core}>
      <NotificationContext.Provider value={ctx}>
        <div data-slot="notification-list" className={cn("fiori-notification-list", className)} {...props}>
          {/* navItems() looks for its root by this data-slot. */}
          <div ref={core.rootRef} data-slot="list" className="fiori-list__scroll">
            {hasData && focusArea("before")}
            <ul role="list" aria-label={ariaLabel ?? texts.list} className="fiori-list__ul" onKeyDown={onKeyDown} onFocusCapture={(e) => {
              const target = e.target as HTMLElement
              if (target.closest("[data-nli-growing]")) return
              const item = target.closest<HTMLElement>("[data-nav-key]")
              const index = notificationNavigationItems(core.rootRef.current).filter((el) => el.hasAttribute("data-nav-key")).indexOf(item!)
              if (index !== -1) enabledItemIndex.current = index
            }}>
              {children}
              {!hasData && noDataText && (
                <li tabIndex={0} role="listitem" className="fiori-list__nodata">
                  <div className="fiori-list__nodata-text">{noDataText}</div>
                </li>
              )}
            </ul>
            {hasData && focusArea("after")}
          </div>
        </div>
      </NotificationContext.Provider>
    </ListCoreContext.Provider>
  )
}

function useNotificationContext() {
  const ctx = React.useContext(NotificationContext)
  if (!ctx) throw new Error("Notification items must be rendered inside <NotificationList>.")
  return ctx
}

type NotificationListItemProps = Omit<React.ComponentProps<"li">, "value"> & {
  /** Identifies the item in the list's callbacks. */
  value?: string
  titleText?: string
  /** State icon before the title. */
  state?: NotificationState
  /** Regular instead of bold title. */
  read?: boolean
  /** "important" shows the Important tag. */
  importance?: "standard" | "important"
  showClose?: boolean
  /** <MenuItem>s: adds the actions button (the item's `menu` slot). */
  menu?: React.ReactNode
  /** An <Avatar size="XS">. */
  avatar?: React.ReactNode
  /** Shown below the description, separated by dots (e.g. author, time). */
  footnotes?: React.ReactNode[]
  /** "none" truncates title and description to two lines, with More / Less; "normal" shows all of it. */
  wrappingType?: "none" | "normal"
  /** Busy indicator over the item. */
  loading?: boolean
  loadingDelay?: number
  /** The description is the children. */
  children?: React.ReactNode
}

/** ui5-li-notification */
function NotificationListItem({
  value: valueProp,
  titleText,
  state,
  read,
  importance = "standard",
  showClose,
  menu,
  avatar,
  footnotes,
  wrappingType = "none",
  loading,
  loadingDelay = 1000,
  className,
  children,
  onKeyDown,
  onKeyUp,
  onClick,
  onFocus,
  onPointerDown,
  ...props
}: NotificationListItemProps) {
  const ctx = useNotificationContext()
  const groupRender = React.useContext(GroupRenderContext)
  // NotificationListGroupItem.js/onBeforeRendering clears children only when the OWNER
  // renders while loading. Its slot metadata does not invalidate it on a local child's
  // loading update. Keep that generation boundary and the latch until incoming false.
  const [childLoadingState, setChildLoadingState] = React.useState<{ group: GroupRender | null; cleared: boolean }>({ group: null, cleared: false })
  const childLoadingCleared = !!loading && (childLoadingState.cleared || (groupRender !== childLoadingState.group && !!groupRender?.loading))
  if (groupRender !== childLoadingState.group || childLoadingCleared !== childLoadingState.cleared) {
    setChildLoadingState({ group: groupRender, cleared: childLoadingCleared })
  }
  loading = !!loading && !childLoadingCleared
  const id = React.useId()
  const { texts } = ctx
  const core = React.useContext(ListCoreContext)
  const { value, handlers } = useListItemBehaviour({
    value: valueProp,
    type: "active",
    onKeyDown: (e) => {
      onKeyDown?.(e as React.KeyboardEvent<HTMLLIElement>)
      if (e.defaultPrevented || e.target !== e.currentTarget) return
      if (e.key === "Enter" && e.shiftKey) e.preventDefault() // Toggles on keyup; no item-click.
      if (e.key === "F10" && e.shiftKey) e.preventDefault()
    },
    onKeyUp: (e) => {
      onKeyUp?.(e as React.KeyboardEvent<HTMLLIElement>)
      if (e.defaultPrevented || e.target !== e.currentTarget) return
      if (e.key === "Delete" && showClose) ctx.close(value)
      if (e.key === "F10" && e.shiftKey && menu) setMenuOpen(true)
      if (e.key === "Enter" && e.shiftKey) setPressed((p) => !p)
    },
    onClick,
    onFocus,
    onPointerDown,
  })
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [showMore, setShowMore] = React.useState(false)
  const rootRef = React.useRef<HTMLLIElement>(null)
  const titleRef = React.useRef<HTMLDivElement>(null)
  const descRef = React.useRef<HTMLDivElement>(null)
  const clampedHeights = React.useRef({ title: 0, desc: 0 })
  const hasDesc = children != null && children !== false && children !== ""

  // UI5 onResize: "More" appears when a text is clamped, and stays while expanded if it would clamp again.
  const pressedRef = React.useRef(pressed)
  pressedRef.current = pressed
  React.useLayoutEffect(() => {
    const check = () => {
      const title = titleRef.current
      const desc = descRef.current
      if (!title) return
      if (wrappingType === "normal") return setShowMore(false)
      const seen = clampedHeights.current
      if (pressedRef.current) {
        if (title.offsetHeight > seen.title || (!!desc && desc.offsetHeight > seen.desc)) setShowMore(true)
        return
      }
      if (title.offsetHeight < title.scrollHeight || (!!desc && desc.offsetHeight < desc.scrollHeight)) {
        seen.title = title.offsetHeight
        seen.desc = desc?.offsetHeight ?? 0
        setShowMore(true)
      } else setShowMore(false)
    }
    check()
    // The 72 font changes how the text wraps once it has loaded.
    document.fonts?.ready.then(check)
    const ro = new ResizeObserver(check)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [wrappingType, titleText, children])

  const notes = footnotes ?? []
  const hasImportance = importance === "important"
  const buttons = (menu ? 1 : 0) + (showClose ? 1 : 0)
  const labelledBy = loading
    ? `${id}-loading`
    : cn(hasImportance && `${id}-importance`, titleText && `${id}-title`, `${id}-read`, hasDesc && `${id}-description`, notes.length > 0 && `${id}-footnotes`)
  return (
    <li
      ref={rootRef}
      data-slot="notification-list-item"
      data-loading={loading ? "" : undefined}
      data-nav-key={value}
      data-read={read ? "" : undefined}
      data-wrapping={wrappingType}
      data-show-more-pressed={pressed ? "" : undefined}
      data-buttons={buttons || undefined}
      role="listitem"
      tabIndex={core?.currentKey === value ? 0 : -1}
      aria-labelledby={labelledBy}
      className={cn("fiori-nli", className)}
      {...handlers}
      onFocus={(e) => {
        // NotificationListInternal.js/getEnabledItems excludes a busy group's children;
        // ItemNavigation.js/setCurrentItem ignores their focus without changing the owner
        // tab stop. More ArrowUp can still focus a child row. Keep the caller callback.
        if (groupRender?.loading) {
          onFocus?.(e)
          return
        }
        handlers.onFocus(e)
      }}
      {...props}
    >
      <div data-li-row="" className="fiori-nli__root">
        {loading && (
          <span id={`${id}-loading`} className="sr-only">
            {texts.loading}
          </span>
        )}
        {/* NotificationListItemTemplate.js makes the whole busy host inert immediately,
            independently of the delayed visual indicator. Group List loading differs. */}
        <BusyIndicator active={loading} delay={loadingDelay} title={texts.busyTitle} inert={loading || undefined} className="fiori-nli__busy">
          <div className="fiori-nli__wrapper">
            <div className="fiori-nli__content" data-importance={hasImportance ? "" : undefined}>
              {hasImportance && (
                <Tag id={`${id}-importance`} design="set2" colorScheme={2} wrappingType="none" icon={<Icon icon={highPriority} />} className="fiori-nli__importance">
                  {texts.important}
                </Tag>
              )}
              <div className="fiori-nli__title-wrapper">
                {state && <Icon icon={stateIcons[state]} label={texts.states[state]} className="fiori-nli__state" data-state={state} />}
                <div ref={titleRef} id={`${id}-title`} className="fiori-nli__title">
                  {state && <span className="sr-only">{texts.states[state]}</span>}
                  {titleText}
                </div>
              </div>
              <span id={`${id}-read`} className="sr-only">
                {read ? texts.read : texts.unread}
              </span>
              {hasDesc && (
                <div ref={descRef} id={`${id}-description`} className="fiori-nli__description">
                  {children}
                </div>
              )}
              <div className="fiori-nli__footer">
                <div id={`${id}-footnotes`} className="fiori-nli__footnotes">
                  {notes.map((note, i) => (
                    <React.Fragment key={i}>
                      <span className="fiori-nli__footnote">{note}</span>
                      {i < notes.length - 1 && (
                        <div className="fiori-nli__divider" aria-hidden="true">
                          ·
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {showMore && wrappingType === "none" && (
                  <Link
                    href="#"
                    role="button"
                    wrappingType="none"
                    data-nli-action="more"
                    aria-label={pressed ? texts.lessLabel : texts.moreLabel}
                    aria-expanded={pressed}
                    className="fiori-nli__more"
                    onClick={(e) => {
                      e.preventDefault()
                      setPressed((p) => !p)
                    }}
                  >
                    {pressed ? texts.less : texts.more}
                  </Link>
                )}
              </div>
            </div>
            <div className="fiori-nli__actions">
              {menu && (
                <Menu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
                  <MenuTrigger asChild>
                    <Button variant="transparent" size="icon" title={texts.actions} aria-label={texts.actions} data-nli-action="menu" className="fiori-nli__menu-btn">
                      <Icon icon={overflow} />
                    </Button>
                  </MenuTrigger>
                  <MenuContent align="end">{menu}</MenuContent>
                </Menu>
              )}
              {showClose && (
                <Button variant="transparent" size="icon" title={texts.close} aria-label={texts.close} data-nli-action="close" onClick={() => ctx.close(value)}>
                  <Icon icon={decline} />
                </Button>
              )}
            </div>
            <div className="fiori-nli__avatar" aria-hidden="true">
              {avatar}
            </div>
          </div>
        </BusyIndicator>
      </div>
    </li>
  )
}

type NotificationListGroupItemProps = Omit<React.ComponentProps<"li">, "value"> & {
  /** Identifies the group in the list's callbacks. */
  value?: string
  titleText?: string
  /** Regular instead of bold title. */
  read?: boolean
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** UI5 supports none/button; scroll is an additive B5 option using List's viewport semantics. */
  growing?: "none" | "button" | "scroll"
  /** Request more items. Append stable-keyed items and finish loading to focus the first new item. */
  onLoadMore?: () => void
  /** Button growing shows an inline indicator; other modes show an overlay over the group's items. */
  loading?: boolean
  loadingDelay?: number
}

/** ui5-li-notification-group */
function NotificationListGroupItem({
  value: valueProp,
  titleText,
  read,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  growing = "none",
  onLoadMore,
  loading = false,
  loadingDelay = 1000,
  className,
  children,
  onKeyDown,
  onKeyUp,
  onClick,
  onFocus,
  onPointerDown,
  ref: forwardedRef,
  ...props
}: NotificationListGroupItemProps) {
  const ctx = useNotificationContext()
  const id = React.useId()
  const [state, setState] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? state
  const { texts } = ctx
  const core = React.useContext(ListCoreContext)
  const rootRef = React.useRef<HTMLLIElement>(null)
  const setRootRef = React.useCallback((node: HTMLLIElement | null) => {
    rootRef.current = node
    if (typeof forwardedRef === "function") return forwardedRef(node)
    if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])
  const startRef = React.useRef<HTMLSpanElement>(null)
  const endRef = React.useRef<HTMLSpanElement>(null)
  const afterRef = React.useRef<HTMLDivElement>(null)
  const itemsRef = React.useRef<HTMLUListElement>(null)
  const [, markRequest] = React.useReducer((n: number) => n + 1, 0)
  const pendingAppend = React.useRef<{ keys: Set<string> } | null>(null)
  const ownItems = () => [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="notification-list-item"]') ?? [])]
    .filter((item) => item.closest("[data-nli-group]") === rootRef.current)
  const [slotGeneration, markSlotChange] = React.useReducer((n: number) => n + 1, 0)
  React.useLayoutEffect(() => {
    const items = itemsRef.current
    if (!items) return
    const observer = new MutationObserver(() => {
      if (items.isConnected) markSlotChange()
    })
    // UI5Element.js/_startObservingDOMChildren observes the group's HTMLElement slot
    // with childList only; _updateSlots also invalidates on a direct text mutation.
    // Real slot edits invalidate the owner, including replacement by a same-key item,
    // while the existing child's loading attributes and busy/content descendants do not.
    observer.observe(items, { childList: true })
    return () => observer.disconnect()
  }, [])
  const requestRef = React.useRef(() => {})
  requestRef.current = () => {
    if (collapsed || growing === "none") return
    // B5 addition (not implemented by UI5 List): snapshot only this requesting group.
    // The forced commit also expires a synchronous no-op request without stealing later focus.
    pendingAppend.current ??= { keys: new Set(ownItems().map((item) => item.dataset.navKey!)) }
    markRequest()
    onLoadMore?.()
  }
  React.useLayoutEffect(() => {
    const pending = pendingAppend.current
    if (!pending) return
    if (collapsed || growing === "none") {
      pendingAppend.current = null
      return
    }
    if (loading) return
    const root = rootRef.current
    if (!root) return
    // B5 requires first-new-item focus after loading. BusyIndicator.tsx clears delayed
    // busy state in a passive effect, so loading=false may still leave an inert ancestor.
    // Wait for its actual DOM release; consume the request only when focus succeeds.
    let observer: MutationObserver | undefined
    const focusWhenReady = () => {
      if (pendingAppend.current !== pending || !root.isConnected) return
      const firstNew = ownItems().find((item) => !pending.keys.has(item.dataset.navKey!))
      if (!firstNew) {
        pendingAppend.current = null
        observer?.disconnect()
        return
      }
      const blocked = firstNew.closest("[inert]")
      if (blocked) {
        observer?.observe(blocked, { attributes: true, attributeFilter: ["inert"] })
        return
      }
      firstNew.focus()
      if (document.activeElement === firstNew) {
        pendingAppend.current = null
        observer?.disconnect()
      }
    }
    observer = new MutationObserver(focusWhenReady)
    observer.observe(root, { attributes: true, attributeFilter: ["inert"], subtree: true })
    focusWhenReady()
    return () => observer?.disconnect()
  })
  React.useEffect(() => {
    if (growing !== "scroll" || collapsed || !startRef.current || !endRef.current) return
    const owner = Symbol("notification-growing")
    let startOut = false
    const options = { root: null, rootMargin: "0px", threshold: 1 }
    // List.js/getStartIntersectionObserver and getEndIntersectionObserver use viewport threshold 1.
    const start = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { startOut = !entry.isIntersecting })
    }, options)
    const end = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        if (pendingScrollLoad) clearTimeout(pendingScrollLoad.timer)
        pendingScrollLoad = { owner, timer: setTimeout(() => {
          pendingScrollLoad = undefined
          // List.js/hasGrowingComponent checks the start marker at debounce completion.
          if (startOut) requestRef.current()
        }, 250) }
      })
    }, options)
    start.observe(startRef.current)
    end.observe(endRef.current)
    return () => {
      start.disconnect()
      end.disconnect()
      if (pendingScrollLoad?.owner === owner) {
        clearTimeout(pendingScrollLoad.timer)
        pendingScrollLoad = undefined
      }
    }
  }, [growing, collapsed])
  const { value, handlers } = useListItemBehaviour({
    value: valueProp,
    type: "inactive",
    onKeyDown: (e) => {
      onKeyDown?.(e as React.KeyboardEvent<HTMLLIElement>)
      if (e.defaultPrevented || e.target !== e.currentTarget) return
      if (e.key === " ") {
        e.preventDefault()
        toggle()
      } else if ((e.key === "+" || e.key === "ArrowRight") && collapsed) {
        e.preventDefault()
        toggle()
      } else if ((e.key === "-" || e.key === "ArrowLeft") && !collapsed) {
        e.preventDefault()
        toggle()
      }
    },
    onKeyUp,
    onClick,
    onFocus,
    onPointerDown,
  })
  const groupTabIndex = Object.hasOwn(props, "tabIndex") ? props.tabIndex : core?.currentKey === value ? 0 : -1
  // List.js/loadMore and NotificationListGroupItem.js/_onLoadMore only emit an event.
  // Internal request commits and callbacks that only update an external counter must
  // not clear local child loading. Match the owner's template inputs and real slot
  // membership rather than treating every React render as native onBeforeRendering.
  // ItemNavigation.js/_applyTabIndex changes decorated ListItemBase.js/forcedTabIndex,
  // invalidating the owner too. Include its effective DOM value, with caller overrides.
  const groupRender = React.useMemo(() => ({ loading }), [
    titleText ?? "", !!read, collapsed, growing, loading, loadingDelay, slotGeneration, groupTabIndex,
    texts.group, texts.expanded, texts.collapsed, texts.toggle, texts.loading, texts.busyTitle, texts.growingButton,
  ])
  const toggle = () => {
    const next = !collapsed
    if (collapsedProp === undefined) setState(next)
    onCollapsedChange?.(next)
    ctx.toggle(value, next)
    // The tab stop can't stay on an item that is now hidden.
    if (next) core?.setCurrentKey(value)
  }
  return (
    <li
      ref={setRootRef}
      data-slot="notification-list-group-item"
      data-nav-key={value}
      data-nli-group=""
      data-read={read ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
      data-loading={loading ? "" : undefined}
      data-growing={growing}
      role="listitem"
      tabIndex={groupTabIndex}
      aria-labelledby={loading ? `${id}-loading` : `${id}-title`}
      aria-description={`${texts.group} ${collapsed ? texts.collapsed : texts.expanded}`}
      aria-level={1}
      className={cn("fiori-nli-group", className)}
      {...handlers}
      onKeyDown={(e) => {
        // NotificationListGroupItem.js/_onkeydown returns for focused More before
        // the inherited F2/Tab handlers. Keep caller callbacks and outer navigation.
        if ((e.target as HTMLElement).closest("[data-nli-growing]")) {
          onKeyDown?.(e)
          return
        }
        handlers.onKeyDown(e)
      }}
      {...props}
    >
      {loading && (
        <span id={`${id}-loading`} className="sr-only">
          {texts.loading}
        </span>
      )}
      <div data-li-row="" className="fiori-nli-group__wrapper">
        <div role="button" aria-expanded={!collapsed} aria-controls={`${id}-items`} title={texts.toggle} className="fiori-nli-group__header" onClick={toggle}>
          <Icon icon={collapsed ? navigationRightArrow : navigationDownArrow} className="fiori-nli-group__toggle" />
          <div id={`${id}-title`} role="heading" aria-level={2} className="fiori-nli-group__title">
            {titleText}
          </div>
          <div className="fiori-nli-group__divider" />
        </div>
      </div>
      <BusyIndicator active={loading && growing !== "button"} delay={loadingDelay} title={texts.busyTitle} className="fiori-nli-group__busy" onKeyDownCapture={stopBusyKeyboardEvent} onKeyUpCapture={stopBusyKeyboardEvent}>
        <div className="fiori-nli-group__list">
          <span ref={startRef} aria-hidden className="fiori-nli-group__start-marker" />
          <ul ref={itemsRef} id={`${id}-items`} role="list" aria-labelledby={`${id}-title`} className="fiori-nli-group__items">
            <GroupRenderContext.Provider value={groupRender}>{children}</GroupRenderContext.Provider>
          </ul>
          {growing === "button" && (
            <div className="fiori-list__growing fiori-nli-group__growing">
              <div
                role="button"
                tabIndex={0}
                data-nli-growing=""
                aria-labelledby={`${id}-growing-text`}
                className="fiori-list__growing-inner fiori-nli-group__growing-inner"
                onFocus={(e) => e.stopPropagation()}
                // List.js/_onLoadMoreClick requests once without stopping the DOM click.
                // The inherited group click handler already ignores this role=button target.
                onClick={() => requestRef.current()}
                onKeyDown={(e) => {
                  // Keys.js/isEnter, isSpace and isUp require no modifiers; only Shift+Tab is special.
                  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || (e.shiftKey && e.key !== "Tab")) return
                  // NotificationListGroupList.js/_onLoadMoreKeydown stops Space reaching the group.
                  if (e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    // ListTemplate.js emits ...inner-active, but List.css.js matches ...inner--active.
                    // UI5 2.28 therefore paints only native :active feedback, not a keyboard state class.
                  } else if (e.key === "Enter") {
                    // List.js/_onLoadMoreKeydown loads on Enter without cancelling or stopping it.
                    requestRef.current()
                  } else if (e.key === "ArrowUp") {
                    // List.js/_handleLodeMoreUp remains available on a directly focused More
                    // even during inline loading, when the outer navigation omits the group children.
                    e.preventDefault()
                    e.stopPropagation()
                    ownItems().at(-1)?.focus()
                  } else if (e.key === "Tab") {
                    if (e.shiftKey) {
                      e.preventDefault()
                      ownItems()[0]?.focus()
                    // List.js/focusAfterElement forwards plain More Tab beyond the notification
                    // list. The inline spinner's native Tab path still uses its own after marker.
                    } else core?.forwardAfter(e)
                  }
                }}
                onKeyUp={(e) => {
                  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
                  // List.js/_onLoadMoreKeyup loads Space without stopping its event, even if
                  // Escape intervened after keydown; Enter has no keyup activation.
                  if (e.key === " ") requestRef.current()
                }}
              >
                {loading && <BusyIndicator active delay={loadingDelay} title={texts.busyTitle} className="fiori-nli-group__growing-busy" onKeyDownCapture={stopBusyKeyboardEvent} onKeyUpCapture={stopBusyKeyboardEvent} />}
                <span id={`${id}-growing-text`} className="fiori-list__growing-text">{texts.growingButton}</span>
              </div>
            </div>
          )}
          {growing === "button" && <div ref={afterRef} tabIndex={0} role="none" className="fiori-list__focusarea" onFocus={(e) => e.stopPropagation()} />}
          <span ref={endRef} aria-hidden className="fiori-nli-group__end-marker" />
        </div>
      </BusyIndicator>
    </li>
  )
}

export {
  NotificationList,
  NotificationListGroupItem,
  NotificationListItem,
  type NotificationListGroupItemProps,
  type NotificationListItemProps,
  type NotificationListProps,
  type NotificationState,
  type NotificationTexts,
}
