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
// Not ported: `growing` (load-more button) on the list and on groups.

type NotificationState = "negative" | "critical" | "positive" | "information"

type NotificationTexts = {
  /** aria-label of the list (default "Notifications"). */
  list: string
  /** Show-more link (default "More" / "Less"). */
  more: string
  less: string
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
  moreLabel: "More button. Show the full texts",
  lessLabel: "Less button. Show the texts with truncation",
  actions: "Actions",
  close: "Close",
  read: "Read",
  unread: "Unread",
  states: { negative: "Status Negative", critical: "Status Critical", positive: "Status Positive", information: "Status Information" },
  important: "Important",
  loading: "Loading",
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

const isVisible = (el: HTMLElement) => el.offsetParent !== null
const PAGE_SIZE = 10

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
  const toggleRef = React.useRef(onItemToggle)
  toggleRef.current = onItemToggle
  const ctx = React.useMemo(
    () => ({ texts, close: (v: string) => closeRef.current?.(v), toggle: (v: string, c: boolean) => toggleRef.current?.(v, c) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(textsProp)]
  )
  const hasData = React.Children.toArray(children).length > 0

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    const target = e.target as HTMLElement
    const item = target.closest<HTMLElement>("[data-nav-key]")
    if (!item || !e.currentTarget.contains(item)) return
    const items = navItems(core.rootRef.current).filter(isVisible)
    const i = items.indexOf(item)
    if (i === -1) return
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
      const same = e.key === "ArrowUp" || e.key === "ArrowDown" ? next.querySelector<HTMLElement>(`[data-nli-action="${action}"]`) : null
      ;(same && same.closest("[data-nav-key]") === next ? same : next).focus()
      return
    }
    let to: number
    if (up) to = i - 1
    else if (down) to = i + 1
    else if (e.key === "PageUp") to = Math.max(i - PAGE_SIZE, 0)
    else if (e.key === "PageDown") to = Math.min(i + PAGE_SIZE, items.length - 1)
    else if (e.key === "Home") {
      e.preventDefault()
      if (isGroup(item)) return
      to = 0
      for (let n = i - 1; n >= 0; n--) {
        if (isGroup(items[n])) {
          to = n + 1
          break
        }
      }
    } else if (e.key === "End") {
      to = items.length - 1
      for (let n = i + 1; n < items.length; n++) {
        if (isGroup(items[n])) {
          to = n - 1
          break
        }
      }
    } else return
    e.preventDefault()
    items[to]?.focus()
  }

  return (
    <ListCoreContext.Provider value={core}>
      <NotificationContext.Provider value={ctx}>
        <div data-slot="notification-list" className={cn("fiori-notification-list", className)} {...props}>
          {/* navItems() looks for its root by this data-slot. */}
          <div ref={core.rootRef} data-slot="list" className="fiori-list__scroll">
            {hasData && focusArea("before")}
            <ul role="list" aria-label={ariaLabel ?? texts.list} className="fiori-list__ul" onKeyDown={onKeyDown}>
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
  const id = React.useId()
  const { texts } = ctx
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
      data-nav-key={value}
      data-read={read ? "" : undefined}
      data-wrapping={wrappingType}
      data-show-more-pressed={pressed ? "" : undefined}
      data-buttons={buttons || undefined}
      role="listitem"
      tabIndex={React.useContext(ListCoreContext)?.currentKey === value ? 0 : -1}
      aria-labelledby={labelledBy}
      className={cn("fiori-nli", className)}
      {...handlers}
      {...props}
    >
      <div data-li-row="" className="fiori-nli__root">
        {loading && (
          <span id={`${id}-loading`} className="sr-only">
            {texts.loading}
          </span>
        )}
        <BusyIndicator active={loading} delay={loadingDelay} className="fiori-nli__busy">
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
  /** Busy indicator over the group's items. */
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
}: NotificationListGroupItemProps) {
  const ctx = useNotificationContext()
  const id = React.useId()
  const [state, setState] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? state
  const { texts } = ctx
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
  const toggle = () => {
    const next = !collapsed
    if (collapsedProp === undefined) setState(next)
    onCollapsedChange?.(next)
    ctx.toggle(value, next)
  }
  return (
    <li
      data-slot="notification-list-group-item"
      data-nav-key={value}
      data-nli-group=""
      data-read={read ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
      role="listitem"
      tabIndex={React.useContext(ListCoreContext)?.currentKey === value ? 0 : -1}
      aria-labelledby={loading ? `${id}-loading` : `${id}-title`}
      aria-description={`${texts.group} ${collapsed ? texts.collapsed : texts.expanded}`}
      aria-level={1}
      className={cn("fiori-nli-group", className)}
      {...handlers}
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
      <BusyIndicator active={loading} delay={loadingDelay} className="fiori-nli-group__busy">
        <ul id={`${id}-items`} role="list" aria-labelledby={`${id}-title`} className="fiori-nli-group__items">
          {children}
        </ul>
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
