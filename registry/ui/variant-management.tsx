// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"
import { decline, edit, favorite, messageError, resizeCorner, search, slimArrowDown, unfavorite } from "@/lib/fiori-icons"
import NoEntries from "@/lib/fiori-illustrations/NoEntries"
import NoSearchResults from "@/lib/fiori-illustrations/NoSearchResults"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { IllustratedMessage } from "@/components/ui/illustrated-message"
import { Input, InputIcon } from "@/components/ui/input"
import { List, ListItemCustom } from "@/components/ui/list"
import { Popover, PopoverContent, PopoverFooter, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableCell, TableHeaderCell, TableHeaderRow, TableRow } from "@/components/ui/table"
import { Title, type TitleLevel } from "@/components/ui/title"
import { Toolbar } from "@/components/ui/toolbar"

type VariantContexts = { role?: string[]; [context: string]: unknown }
type VariantItem = {
  key: string
  title: string
  sharing?: "Public" | "Private"
  remove?: boolean
  rename?: boolean
  favorite?: boolean
  executeOnSelect?: boolean
  changeable?: boolean
  author?: string
  contexts?: VariantContexts
  visible?: boolean
}
type VariantSaveEvent = {
  name: string
  overwrite: boolean
  key: string | null
  def: boolean
  execute?: boolean
  public?: boolean
  contexts?: VariantContexts
  tile?: boolean
}
type VariantManageEvent = {
  renamed?: { key: string; name: string }[]
  deleted?: string[]
  exe?: { key: string; exe: boolean }[]
  fav?: { key: string; visible: boolean }[]
  def?: string
  contexts?: { key: string; contexts: VariantContexts }[]
}

// sap/m/messagebundle{,_en}.properties (OpenUI5 1.154). Keys mirror the English resource bundle;
// callers may also use its full VARIANT_MANAGEMENT_ prefix.
const variantManagementTexts = {
  SAVE: "Save", SAVE_TT: "CTRL + Enter", SAVE_TT_MAC: "CMD + Enter",
  SAVE_MAIN_TT: "CTRL + S", SAVE_MAIN_TT_MAC: "CMD + S", SAVEAS: "Save As",
  OK: "OK", CANCEL: "Cancel", MANAGE: "Manage", NAME: "View",
  SETASDEFAULT: "Set as Default", SETASPUBLIC: "Public", VARIANTTYPE: "Sharing",
  PUBLIC: "Public", PRIVATE: "Private", SAVEDIALOG: "Save View", MANAGEDIALOG: "Manage Views",
  NODATA_FOUND: "No views found", NODATA_FOUND_DESCR: "Try adjusting the search criteria.",
  NODATA: "No views available", NODATA_DESCR: "Please create views.", DEFAULT: "Default",
  EXECUTEONSELECT: "Apply Automatically", AUTHOR: "Created By", FAVORITE_COLUMN: "Favorite",
  ACTION_COLUMN: "Action", SEL_VARIANT: "View {0}.", SEL_VARIANT_MOD: "Modified view {0}.",
  VARIANTS: "My Views", ERROR_DUPLICATE: "The view name already exists. Please enter a different name.",
  ERROR_DUPLICATE_SAVE: "The view name already exists. Please enter a different name or re-check without active search.",
  ERROR_EMPTY: "Please enter a name.", NOT_ALLOWED_CHAR: "Character {0} not allowed for view names",
  MAX_LEN: "View names are restricted to {0} characters", TRIGGER_TT: "Select View", DELETE: "Delete View",
  FAV_ADD_ACC: "Favorite icon not checked", FAV_DEL_ACC: "Favorite icon checked",
  FAV_DEL_TOOLTIP: "Selected as Favorite", FAV_ADD_TOOLTIP: "Unselected as Favorite",
  ERROR_TEXT1: "Unable to load the data.",
  ERROR_TEXT2: "This can happen if you are not connected to the Internet, or if an underlying system or component is not available.",
  VISIBILITY: "Visibility", CHANGE_VISIBILITY: "Change Visibility for {0}",
  VISIBILITY_NON_RESTRICTED: "All Users", VISIBILITY_RESTRICTED: "Restricted",
  VISIBILITY_ICON_TT: "To change visibility, press space.", SELECTROLES_DIALOG: "Select Roles",
  CREATETILE: "Create Tile", NO_DEFAULT_ON_RESTRICTED_VIEWS: "The visibility of this view is based on a role. You can't select it as the default view.",
  VIEW_LIST: "List of assigned Views", SEARCH: "Search", SEARCH_RESET: "Reset", SELECTED: "Selected", NOT_SELECTED: "Not Selected",
  DRAG_RESIZE_LABEL: "Drag and resize dialog", DRAG_RESIZE_DESCRIPTION: "Use Arrow keys to move, Shift+Arrow keys to resize",
  RESIZE_LABEL: "Resize popover", RESIZE_DESCRIPTION: "Use Shift+Arrow keys to resize",
  RESIZE_TOOLTIP: "Drag handle to resize (Shift+Arrow)", HANDLE_ROLE: "Handle",
} as const
type TextKey = keyof typeof variantManagementTexts
type VariantManagementTexts = Partial<Record<TextKey | `VARIANT_MANAGEMENT_${TextKey}`, string>>
type VariantRole = { key: string; title: string }
type Surface = "list" | "save" | "manage"
type VariantManagementProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  items: VariantItem[]
  selectedKey?: string
  defaultKey?: string
  modified?: boolean
  onSelect?: (event: { key: string }) => void
  onSave?: (event: VariantSaveEvent) => void
  onManage?: (event: VariantManageEvent) => void
  onManageCancel?: () => void
  onCancel?: () => void
  supportDefault?: boolean
  supportFavorites?: boolean
  supportApplyAutomatically?: boolean
  supportPublic?: boolean
  supportContexts?: boolean
  showSaveAs?: boolean
  creationAllowed?: boolean
  showFooter?: boolean
  popoverTitle?: string
  inErrorState?: boolean
  level?: TitleLevel | "Auto"
  titleStyle?: TitleLevel | "Auto"
  maxWidth?: React.CSSProperties["maxWidth"]
  texts?: VariantManagementTexts
  /** Host-owned role candidates, replacing OpenUI5's injected roles ComponentContainer. */
  roles?: VariantRole[]
  /** Render surfaces inside this component (useful for embedded previews). */
  portal?: boolean
  /** Initial surface for an embedded preview. */
  defaultOpen?: Surface
}

// VariantItem.js property defaults also apply when optional React properties are
// explicitly undefined (common when an app maps sparse onManage changes).
const normalize = (item: VariantItem) => ({
  ...item, sharing: item.sharing ?? "Private", remove: item.remove ?? false,
  rename: item.rename ?? true, favorite: item.favorite ?? true,
  executeOnSelect: item.executeOnSelect ?? false, changeable: item.changeable ?? false,
  author: item.author ?? "", contexts: item.contexts ?? {}, visible: item.visible ?? true,
})
const restricted = (contexts?: VariantContexts) => !!contexts?.role?.length

/** Local adapter for Dialog.js#onmousedown/_handleKeyboardDragResize and
 * PopoverResize.js#onmousedown/_resize/_keyboardResize (OpenUI5 1.154).
 * Dialogs move inside the viewport; resize keeps the opposite corner fixed,
 * respects the source CSS minimum plus footer, and keyboard steps are one rem. */
function useVariantSurfaceGeometry(ref: React.RefObject<HTMLDivElement | null>, open: boolean, draggable: boolean) {
  const [geometry, setGeometry] = React.useState<React.CSSProperties>()
  const gestureCleanup = React.useRef<(() => void) | undefined>(undefined)
  const active = React.useRef(false)
  const reset = React.useCallback(() => { gestureCleanup.current?.(); setGeometry(undefined) }, [])
  React.useLayoutEffect(() => { if (!open) reset(); return () => gestureCleanup.current?.() }, [open, reset])
  function getBounds() {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const win = node.ownerDocument.defaultView!
    const css = win.getComputedStyle(node)
    const rem = parseFloat(win.getComputedStyle(node.ownerDocument.documentElement).fontSize)
    const header = node.querySelector<HTMLElement>('[data-slot="popover-header"], [data-slot="dialog-header"]')?.getBoundingClientRect().height ?? 0
    const footer = node.querySelector<HTMLElement>('[data-slot="popover-footer"], [data-slot="dialog-footer"]')?.getBoundingClientRect().height ?? 0
    return { rect, win, rtl: css.direction === "rtl", topCorner: !draggable && node.dataset.side === "top",
      // Source Dialog.less: desktop 20rem/6rem; PopoverResize.js: 100px/32px content.
      minWidth: parseFloat(css.minWidth) || (draggable ? 20 * rem : 100),
      minHeight: draggable ? (parseFloat(css.minHeight) || 6 * rem) + footer : 32 + header + footer,
      margin: draggable ? 0 : 10, rem }
  }
  function apply(bounds: NonNullable<ReturnType<typeof getBounds>>, dx: number, dy: number, resize: boolean) {
    const { rect, win, rtl, topCorner, minWidth, minHeight, margin } = bounds
    const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(value, Math.max(low, high)))
    if (!resize) {
      setGeometry({ position: "fixed", inset: "auto", margin: 0,
        left: clamp(rect.left + dx, margin, win.innerWidth - rect.width - margin),
        top: clamp(rect.top + dy, margin, win.innerHeight - rect.height - margin),
        width: rect.width, height: rect.height })
      return
    }
    const width = clamp(rect.width + (rtl ? -dx : dx), Math.min(minWidth, win.innerWidth),
      rtl ? rect.right - margin : win.innerWidth - rect.left - margin)
    const height = clamp(rect.height + (topCorner ? -dy : dy), Math.min(minHeight, win.innerHeight),
      topCorner ? rect.bottom - margin : win.innerHeight - rect.top - margin)
    setGeometry(draggable ? { position: "fixed", inset: "auto", margin: 0,
      left: rtl ? rect.right - width : rect.left, top: rect.top, width, height } : { width, height })
  }
  function pointer(event: React.PointerEvent<HTMLElement>, resize: boolean) {
    if (event.button !== 0 || event.pointerType === "touch") return
    const bounds = getBounds()
    if (!bounds) return
    gestureCleanup.current?.()
    event.preventDefault(); event.stopPropagation()
    const target = event.currentTarget
    const start = { x: event.clientX, y: event.clientY }
    active.current = true
    const oldSelect = bounds.win.document.documentElement.style.userSelect
    bounds.win.document.documentElement.style.userSelect = "none"
    target.setPointerCapture(event.pointerId)
    const move = (next: PointerEvent) => {
      if (next.pointerId === event.pointerId) apply(bounds, next.clientX - start.x, next.clientY - start.y, resize)
    }
    const cleanup = () => {
      active.current = false
      bounds.win.document.documentElement.style.userSelect = oldSelect
      target.removeEventListener("pointermove", move)
      target.removeEventListener("pointerup", cleanup)
      target.removeEventListener("pointercancel", cleanup)
      target.removeEventListener("lostpointercapture", cleanup)
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
      gestureCleanup.current = undefined
    }
    gestureCleanup.current = cleanup
    target.addEventListener("pointermove", move)
    target.addEventListener("pointerup", cleanup)
    target.addEventListener("pointercancel", cleanup)
    target.addEventListener("lostpointercapture", cleanup)
  }
  function keyboard(event: React.KeyboardEvent<HTMLElement>) {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!direction || (!draggable && !event.shiftKey)) return
    const bounds = getBounds()
    if (!bounds) return
    event.preventDefault(); event.stopPropagation()
    // OpenUI5 Dialog.js _handleKeyboardDragResize uses physical width deltas and
    // retains left in RTL, unlike its pointer resize handler. PopoverResize.js
    // _keyboardResize instead delegates to its direction-aware pointer geometry.
    const keyboardBounds = draggable && event.shiftKey ? { ...bounds, rtl: false } : bounds
    apply(keyboardBounds, direction[0] * bounds.rem, direction[1] * bounds.rem, event.shiftKey)
  }
  return { style: geometry, manual: geometry ? "" : undefined, active,
    drag: (event: React.PointerEvent<HTMLElement>) => pointer(event, false),
    resize: (event: React.PointerEvent<HTMLElement>) => pointer(event, true), keyboard, reset }
}

// Portals retain theme/density from a subtree, as SAPUI5's dependent popups do.
function useVariantAppearance(ref: React.RefObject<HTMLDivElement | null>) {
  const [appearance, setAppearance] = React.useState<{ "data-theme"?: string; "data-density"?: string }>({})
  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => setAppearance({
      "data-theme": node.closest("[data-theme]")?.getAttribute("data-theme") ?? undefined,
      "data-density": node.closest("[data-density]")?.getAttribute("data-density") ?? undefined,
    })
    update()
    const observer = new MutationObserver(update)
    for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement)
      observer.observe(parent, { attributes: true, attributeFilter: ["data-theme", "data-density"] })
    return () => observer.disconnect()
  }, [ref])
  return appearance
}

function VariantManagement({
  items, selectedKey = "", defaultKey = "", modified = false, onSelect, onSave, onManage,
  onManageCancel, onCancel, supportDefault = true, supportFavorites = true,
  supportApplyAutomatically = true, supportPublic = true, supportContexts = false,
  showSaveAs = true, creationAllowed = true, showFooter = true, popoverTitle = "",
  inErrorState = false, level = "Auto", titleStyle = "Auto", maxWidth = "100%",
  texts, roles = [], portal = true, defaultOpen, className, style, onKeyDown, ...props
}: VariantManagementProps) {
  const id = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const saveInputRef = React.useRef<HTMLInputElement>(null)
  const saveDefaultRef = React.useRef<HTMLButtonElement>(null)
  const manageSearchRef = React.useRef<HTMLInputElement>(null)
  const listSearchRef = React.useRef<HTMLInputElement>(null)
  const manageRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const rolesRef = React.useRef<HTMLDivElement>(null)
  const roleOpenerRef = React.useRef<HTMLButtonElement>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const saving = React.useRef(false)
  const t = (key: TextKey, ...args: (string | number)[]) => {
    let value: string = texts?.[key] ?? texts?.[`VARIANT_MANAGEMENT_${key}`] ?? variantManagementTexts[key]
    args.forEach((arg, index) => { value = value.replaceAll(`{${index}}`, String(arg)) })
    return value
  }
  const normalized = items.map(normalize)
  const selected = normalized.find((item) => item.key === selectedKey)
  // VariantManagement.js#getStandardVariantKey/_getFirstVisibleVariant: the
  // standalone control uses the first favorite (or first item without favorites).
  const standardKey = normalized.find((item) => !supportFavorites || item.favorite)?.key ?? ""
  const [surface, setSurface] = React.useState<Surface | undefined>(defaultOpen)
  const [query, setQuery] = React.useState("")
  const [name, setName] = React.useState(selected?.title ?? "")
  const [nameTouched, setNameTouched] = React.useState(false)
  const [saveDefault, setSaveDefault] = React.useState(false)
  const [savePublic, setSavePublic] = React.useState(false)
  const [saveExecute, setSaveExecute] = React.useState(false)
  const [saveContexts, setSaveContexts] = React.useState<VariantContexts>({ role: [] })
  const [defaultError, setDefaultError] = React.useState(false)
  const [draft, setDraft] = React.useState(normalized)
  const [original, setOriginal] = React.useState(normalized)
  const [draftDefault, setDraftDefault] = React.useState(() => supportContexts && restricted(normalized.find((item) => item.key === defaultKey)?.contexts) ? standardKey : defaultKey)
  const [originalDefault, setOriginalDefault] = React.useState(defaultKey)
  const [deleted, setDeleted] = React.useState<string[]>([])
  const [renamed, setRenamed] = React.useState<string[]>([])
  const [focusAfterDelete, setFocusAfterDelete] = React.useState<string | null>(null)
  const [roleKey, setRoleKey] = React.useState<string | undefined>()
  const [roleDraft, setRoleDraft] = React.useState<VariantContexts>({ role: [] })
  const [manageKeys, setManageKeys] = React.useState(() => normalized.filter((item) => item.visible).map((item) => item.key))
  const [invalidFocusKey, setInvalidFocusKey] = React.useState<string | null>(null)
  const appearance = useVariantAppearance(rootRef)
  const listGeometry = useVariantSurfaceGeometry(listRef, surface === "list", false)
  const manageGeometry = useVariantSurfaceGeometry(manageRef, surface === "manage", true)
  const rolesGeometry = useVariantSurfaceGeometry(rolesRef, roleKey !== undefined, true)
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  const saveTooltip = t(mac ? "SAVE_TT_MAC" : "SAVE_TT")
  const canSave = creationAllowed && modified && !!selected?.changeable && !inErrorState
  const favorites = normalized.filter((item) => item.visible && (!supportFavorites || item.favorite))
  const listItems = favorites.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
  // _suspendManagementTableBinding: editing a matching title must not filter its
  // focused row out of an active search. Recompute membership only for a search action.
  const visibleDraft = draft.filter((item) => item.visible && !deleted.includes(item.key) && manageKeys.includes(item.key))

  // VariantManagement.js#_verifyVariantNameConstraints/_checkIsDuplicateInModel.
  // Duplicate checking includes invisible and pending-deletion items; only "{" is
  // forbidden. Candidate names are trimmed and the exact maximum is 100 characters.
  function validate(value: string, key?: string, candidates = normalized, activeSearch = false) {
    const trimmed = value.trim()
    if (candidates.some((item) => item.key !== key && item.title.toLowerCase() === trimmed.toLowerCase()))
      return t(activeSearch ? "ERROR_DUPLICATE_SAVE" : "ERROR_DUPLICATE")
    if (!trimmed) return t("ERROR_EMPTY")
    if (trimmed.includes("{")) return t("NOT_ALLOWED_CHAR", "{")
    if (trimmed.length > 100) return t("MAX_LEN", 100)
    return ""
  }
  const nameError = nameTouched ? validate(name) : ""
  const rowError = (item: ReturnType<typeof normalize>) => renamed.includes(item.key) &&
    item.title !== original.find((old) => old.key === item.key)?.title
    ? validate(item.title, item.key, draft, !!query) : ""

  function open(next: Surface) {
    saving.current = false
    setQuery("")
    if (next === "save") {
      setName(selected?.title ?? ""); setNameTouched(false)
      setSaveDefault(false); setSavePublic(false); setSaveExecute(false)
      setSaveContexts({ role: [] }); setDefaultError(false)
    }
    if (next === "manage") {
      const snapshot = items.map((item) => normalize({ ...item, contexts: structuredClone(item.contexts ?? {}) }))
      const nextDefault = supportContexts && restricted(snapshot.find((item) => item.key === defaultKey)?.contexts) ? standardKey : defaultKey
      setDraft(snapshot); setOriginal(snapshot); setDraftDefault(nextDefault); setOriginalDefault(defaultKey)
      setDeleted([]); setRenamed([]); setRoleKey(undefined)
      setManageKeys(snapshot.filter((item) => item.visible).map((item) => item.key))
    }
    setSurface(next)
  }
  function cancel(kind: "save" | "manage") {
    setSurface(undefined); setRoleKey(undefined)
    if (kind === "save") onCancel?.()
    else onManageCancel?.()
  }
  function overwrite() {
    if (!canSave || !selected) return
    setSurface(undefined)
    // VariantManagement.js#_handleVariantSave deliberately omits execute/public/contexts.
    onSave?.({ name: selected.title, overwrite: true, key: selected.key, def: defaultKey === selected.key })
  }
  function saveAs() {
    if (saving.current) return
    setNameTouched(true)
    if (validate(name)) { saveInputRef.current?.focus(); return }
    if (supportContexts && saveDefault && restricted(saveContexts)) { setDefaultError(true); saveDefaultRef.current?.focus(); return }
    saving.current = true
    setSurface(undefined)
    // _handleVariantSaveAs: Create Tile is private flexibility integration and is
    // absent in standalone sap.m.VariantManagement, so neither control nor tile is emitted.
    onSave?.({ key: null, name: name.trim(), overwrite: false, def: saveDefault, execute: saveExecute,
      public: supportPublic && !supportContexts ? savePublic : undefined,
      contexts: supportContexts ? saveContexts : undefined })
  }
  function updateItem(key: string, change: Partial<VariantItem>) {
    setDraft((current) => current.map((item) => item.key === key ? { ...item, ...change } : item))
  }
  function selectDefault(key: string) {
    const item = draft.find((entry) => entry.key === key)
    if (!item || (supportContexts && restricted(item.contexts))) return
    setDraftDefault(key)
    // _handleManageDefaultVariantChange automatically favorites the new default.
    if (supportFavorites && !item.favorite) updateItem(key, { favorite: true })
  }
  function saveRoles() {
    if (!roleKey) return
    updateItem(roleKey, { contexts: roleDraft })
    if (draftDefault === roleKey && restricted(roleDraft)) selectDefault(standardKey)
    setRoleKey(undefined)
  }
  function deleteItem(key: string) {
    const item = draft.find((entry) => entry.key === key)
    if (!item?.remove || key === standardKey) return
    const index = visibleDraft.findIndex((entry) => entry.key === key)
    setFocusAfterDelete(visibleDraft[index + 1]?.key ?? visibleDraft[index - 1]?.key ?? "")
    setDeleted((current) => [...current, key])
    if (draftDefault === key) {
      setDraftDefault(standardKey)
      if (supportFavorites) updateItem(standardKey, { favorite: true })
    }
  }
  React.useLayoutEffect(() => {
    if (focusAfterDelete === null) return
    const row = [...(manageRef.current?.querySelectorAll<HTMLElement>("[data-variant-key]") ?? [])]
      .find((node) => node.dataset.variantKey === focusAfterDelete)
    ;(row ?? cancelRef.current)?.focus()
    setFocusAfterDelete(null)
  }, [focusAfterDelete, draft, deleted])
  React.useLayoutEffect(() => {
    if (invalidFocusKey === null) return
    const input = [...(manageRef.current?.querySelectorAll<HTMLInputElement>("input[data-variant-name]") ?? [])]
      .find((node) => node.dataset.variantName === invalidFocusKey)
    input?.focus()
    setInvalidFocusKey(null)
  }, [invalidFocusKey, manageKeys])
  function saveManage() {
    if (saving.current) return
    const invalid = draft.find((item) => !deleted.includes(item.key) && rowError(item))
    if (invalid) {
      setQuery("")
      setManageKeys(draft.filter((item) => item.visible).map((item) => item.key))
      setInvalidFocusKey(invalid.key)
      return
    }
    const event: VariantManageEvent = {}
    if (draftDefault !== originalDefault) event.def = draftDefault
    // VariantManagement.js#_collectManageData: sparse deltas, original item order,
    // and no rename/favorite/execute/context entries for pending-deletion items.
    draft.forEach((item) => {
      const old = original.find((entry) => entry.key === item.key)!
      if (deleted.includes(item.key)) { (event.deleted ??= []).push(item.key); return }
      if (item.title !== old.title) (event.renamed ??= []).push({ key: item.key, name: item.title })
      if (item.favorite !== old.favorite) (event.fav ??= []).push({ key: item.key, visible: item.favorite })
      if (item.executeOnSelect !== old.executeOnSelect) (event.exe ??= []).push({ key: item.key, exe: item.executeOnSelect })
      if (JSON.stringify(item.contexts) !== JSON.stringify(old.contexts)) (event.contexts ??= []).push({ key: item.key, contexts: item.contexts })
    })
    saving.current = true
    setSurface(undefined)
    onManage?.(event)
  }
  function shortcut(event: React.KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
      if (event.key.toLowerCase() === "s" && (surface === undefined || surface === "list") && canSave) {
        event.preventDefault(); event.stopPropagation(); overwrite()
      }
      if (event.key === "Enter" && (surface === "save" || surface === "manage") && roleKey === undefined) {
        event.preventDefault(); event.stopPropagation()
        if (surface === "save") saveAs(); else saveManage()
      }
    }
  }
  const closeFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const empty = (found: boolean) => <IllustratedMessage className="fiori-vm-empty" illustration={found ? NoSearchResults : NoEntries}
    titleText={t(found ? "NODATA_FOUND" : "NODATA")} subtitleText={t(found ? "NODATA_FOUND_DESCR" : "NODATA_DESCR")} decorative />
  function changeSearch(nextQuery: string, manage: boolean) {
      setQuery(nextQuery)
      if (manage) setManageKeys(draft.filter((item) => item.visible && [item.title, item.author]
        .some((value) => value.toLowerCase().includes(nextQuery.toLowerCase()))).map((item) => item.key))
  }
  const searchField = (manage = false) => <Toolbar className={cn("fiori-vm-search", manage && "fiori-vm-manage-search")}>
    <Input ref={manage ? manageSearchRef : listSearchRef} value={query} onChange={(event) => changeSearch(event.target.value, manage)}
      data-vm-search-has-value={query ? "" : undefined}
      type="search" aria-label={t("SEARCH")} placeholder={t("SEARCH")}
      icon={<InputIcon className="fiori-vm-search-actions">
        {query && <button type="button" className="fiori-vm-search-clear" aria-label={t("SEARCH_RESET")} title={t("SEARCH_RESET")}
          onPointerDown={(event) => event.preventDefault()} onClick={() => {
            // SearchField.js#onmouseup: reset the query and retain input focus.
            changeSearch("", manage); (manage ? manageSearchRef : listSearchRef).current?.focus()
          }}><Icon icon={decline} /></button>}
        <Icon icon={search} />
      </InputIcon>} wrapperClassName="fiori-vm-search-field" />
  </Toolbar>
  const roleChoices = (contexts: VariantContexts, change: (contexts: VariantContexts) => void) => <div className="fiori-vm-role-options">
    {roles.map((role) => <Checkbox key={role.key} text={role.title} checked={contexts.role?.includes(role.key) ?? false}
      onCheckedChange={(checked) => change({ ...contexts, role: checked ? [...(contexts.role ?? []), role.key] : (contexts.role ?? []).filter((key) => key !== role.key) })} />)}
  </div>
  const resizeHandles = (geometry: ReturnType<typeof useVariantSurfaceGeometry>, dialog = false, suffix = dialog ? "manage" : "list") => <>
    <span className="fiori-vm-keyboard-handle" role="img" tabIndex={0} aria-roledescription={t("HANDLE_ROLE")}
      aria-label={t(dialog ? "DRAG_RESIZE_LABEL" : "RESIZE_LABEL")} aria-describedby={`${id}-${suffix}-geometry-description`}
      onKeyDown={geometry.keyboard} />
    <span id={`${id}-${suffix}-geometry-description`} hidden>{t(dialog ? "DRAG_RESIZE_DESCRIPTION" : "RESIZE_DESCRIPTION")}</span>
    <div className="fiori-vm-resize-handle" onPointerDown={geometry.resize} title={t("RESIZE_TOOLTIP")} aria-hidden><Icon icon={resizeCorner} /></div>
  </>
  return <div ref={rootRef} data-slot="variant-management" className={cn("fiori-vm", className)} style={{ maxWidth, ...style }}
    onKeyDown={(event) => { onKeyDown?.(event); if (!event.defaultPrevented) shortcut(event) }} {...props}>
    <Popover open={surface === "list"} onOpenChange={(isOpen) => isOpen ? open("list") : setSurface((current) => current === "list" ? undefined : current)}>
      <div className="fiori-vm-trigger" data-modified={modified ? "" : undefined} onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button")) { triggerRef.current?.focus(); surface === "list" ? setSurface(undefined) : open("list") }
      }}>
        <Title level={level === "Auto" ? "H2" : level} size={titleStyle === "Auto" ? "H5" : titleStyle}
          wrappingType="None" className="fiori-vm-title">{selected?.title ?? ""}</Title>
        <span className="fiori-vm-modified" aria-hidden>{modified ? "*" : null}</span>
        <PopoverTrigger asChild><Button ref={triggerRef} variant="transparent" size="icon" className="fiori-vm-arrow"
          title={t("TRIGGER_TT")} aria-label={t(modified ? "SEL_VARIANT_MOD" : "SEL_VARIANT", selected?.title ?? "")}
          aria-haspopup="dialog" aria-expanded={surface === "list"} onKeyDown={(event) => {
            if (event.key === "F4" || (event.altKey && ["ArrowDown", "ArrowUp"].includes(event.key))) {
              event.preventDefault(); open("list")
            }
          }}><Icon icon={slimArrowDown} /></Button></PopoverTrigger>
      </div>
      <PopoverContent ref={listRef} className="fiori-vm-list" portal={portal} data-inline={!portal ? "" : undefined} side="bottom" align="start"
        {...appearance} style={listGeometry.style} data-vm-manual={listGeometry.manual}
        onInteractOutside={(event) => { if ((defaultOpen && !portal) || listGeometry.active.current) event.preventDefault() }}
        onKeyDown={shortcut} onCloseAutoFocus={closeFocus} onOpenAutoFocus={(event) => {
          event.preventDefault()
          const options = rootRef.current?.ownerDocument.querySelectorAll<HTMLElement>(`[data-vm-list="${id}"] [role="option"]`)
          const option = [...(options ?? [])].find((node) => node.getAttribute("aria-selected") === "true") ?? options?.[0]
          const content = event.target as HTMLElement
          ;(option ?? content.querySelector<HTMLElement>("input,button") ?? content)?.focus()
        }}>
        <PopoverHeader><PopoverTitle>{popoverTitle}</PopoverTitle></PopoverHeader>
        {inErrorState ? <div className="fiori-vm-error"><Icon icon={messageError} /><Title size="H2">{t("ERROR_TEXT1")}</Title><p>{t("ERROR_TEXT2")}</p></div> : <>
          {favorites.length > 9 && searchField()}
          <div className="fiori-vm-list-body">
            {listItems.length ? <List accessibleRole="listbox" selectionMode="single" separators="none" value={[selectedKey]}
              aria-label={t("VIEW_LIST")} data-vm-list={id} className="fiori-vm-view-list" selectedText={t("SELECTED")} notSelectedText={t("NOT_SELECTED")}
              onItemClick={(key) => { setSurface(undefined); onSelect?.({ key }) }}>
              {listItems.map((item) => <ListItemCustom key={item.key} value={item.key} className="fiori-vm-list-item">{item.title}</ListItemCustom>)}
            </List> : empty(!!query)}
          </div>
          {showFooter && <PopoverFooter className="fiori-vm-footer">
            {canSave && <Button variant="emphasized" title={t(mac ? "SAVE_MAIN_TT_MAC" : "SAVE_MAIN_TT")} onClick={overwrite}>{t("SAVE")}</Button>}
            {creationAllowed && showSaveAs && <Button variant={canSave ? "default" : "emphasized"} onClick={() => open("save")}>{t("SAVEAS")}</Button>}
            <Button onClick={() => open("manage")}>{t("MANAGE")}</Button>
          </PopoverFooter>}
        </>}
        {!inErrorState && resizeHandles(listGeometry)}
      </PopoverContent>
    </Popover>
    <Dialog modal={!defaultOpen} open={surface === "save"} onOpenChange={(isOpen) => { if (!isOpen && surface === "save") cancel("save") }}>
      <DialogContent className="fiori-vm-save-dialog" portal={portal} data-inline={!portal ? "" : undefined} aria-describedby={undefined}
        {...appearance} onInteractOutside={(event) => { if (defaultOpen && !portal) event.preventDefault() }}
        onKeyDownCapture={shortcut} onCloseAutoFocus={closeFocus} onOpenAutoFocus={(event) => { event.preventDefault(); saveInputRef.current?.focus(); saveInputRef.current?.select() }}>
        <DialogHeader><DialogTitle>{t("SAVEDIALOG")}</DialogTitle></DialogHeader>
        <DialogBody className="fiori-vm-save-form">
          <label className="fiori-vm-name-label" htmlFor={`${id}-name`}>{t("NAME")}:</label>
          <Input id={`${id}-name`} ref={saveInputRef} value={name} onChange={(event) => { setName(event.target.value); setNameTouched(true) }}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); saveAs() } }}
            valueState={nameError ? "negative" : "none"} valueStateMessage={nameError || null} wrapperClassName="fiori-vm-name" />
          <div className="fiori-vm-options">
            {supportDefault && <Checkbox ref={saveDefaultRef} text={t("SETASDEFAULT")} checked={saveDefault} onCheckedChange={(checked) => {
              setSaveDefault(checked === true); setDefaultError(checked === true && supportContexts && restricted(saveContexts))
            }} valueState={defaultError ? "negative" : "none"} valueStateText={t("NO_DEFAULT_ON_RESTRICTED_VIEWS")} />}
            {supportPublic && !supportContexts && <Checkbox text={t("SETASPUBLIC")} checked={savePublic} onCheckedChange={(checked) => setSavePublic(checked === true)} />}
            {supportApplyAutomatically && <Checkbox text={t("EXECUTEONSELECT")} checked={saveExecute} onCheckedChange={(checked) => setSaveExecute(checked === true)} />}
          </div>
          {supportContexts && <fieldset><legend>{t("SELECTROLES_DIALOG")}</legend>{roleChoices(saveContexts, (next) => { setSaveContexts(next); setDefaultError(saveDefault && restricted(next)) })}</fieldset>}
          {defaultError && <p role="status">{t("NO_DEFAULT_ON_RESTRICTED_VIEWS")}</p>}
        </DialogBody>
        <DialogFooter className="fiori-vm-footer"><Button variant="emphasized" title={saveTooltip} onClick={saveAs}>{t("SAVE")}</Button><Button onClick={() => cancel("save")}>{t("CANCEL")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog modal={!defaultOpen} open={surface === "manage"} onOpenChange={(isOpen) => { if (!isOpen && surface === "manage") cancel("manage") }}>
      <DialogContent ref={manageRef} className="fiori-vm-manage-dialog" portal={portal} data-inline={!portal ? "" : undefined} aria-describedby={undefined}
        {...appearance} style={manageGeometry.style} data-vm-manual={manageGeometry.manual}
        onInteractOutside={(event) => { if (defaultOpen && !portal) event.preventDefault() }}
        onKeyDownCapture={shortcut} onCloseAutoFocus={closeFocus} onOpenAutoFocus={(event) => { event.preventDefault(); manageSearchRef.current?.focus() }}>
        <DialogHeader data-vm-draggable onPointerDown={manageGeometry.drag} onDoubleClick={manageGeometry.reset}><DialogTitle>{t("MANAGEDIALOG")}</DialogTitle></DialogHeader>
        {searchField(true)}
        <DialogBody className="fiori-vm-manage-body">
          <RadioGroup value={draftDefault} onValueChange={selectDefault} aria-label={t("DEFAULT")} className="fiori-vm-default-group">
            <Table className="fiori-vm-table" noData={empty(!!query)} overflowMode="popin" aria-label={t("MANAGEDIALOG")}>
              <TableHeaderRow>
                {supportFavorites && <TableHeaderCell data-col="favorite" width="3rem"><span className="sr-only">{t("FAVORITE_COLUMN")}</span></TableHeaderCell>}
                <TableHeaderCell data-col="name" width="16rem">{t("NAME")}</TableHeaderCell>
                {supportPublic && !supportContexts && <TableHeaderCell data-col="sharing" popinText={t("VARIANTTYPE")}>{t("VARIANTTYPE")}</TableHeaderCell>}
                {supportDefault && <TableHeaderCell data-col="default" horizontalAlign="Center" popinText={t("DEFAULT")}>{t("DEFAULT")}</TableHeaderCell>}
                {supportApplyAutomatically && <TableHeaderCell data-col="execute" horizontalAlign="Center" popinText={t("EXECUTEONSELECT")}>{t("EXECUTEONSELECT")}</TableHeaderCell>}
                {supportContexts && <TableHeaderCell data-col="contexts" width="8rem" popinText={t("VISIBILITY")}>{t("VISIBILITY")}</TableHeaderCell>}
                <TableHeaderCell data-col="author" popinText={t("AUTHOR")}>{t("AUTHOR")}</TableHeaderCell>
                <TableHeaderCell data-col="delete" horizontalAlign="Center"><span className="sr-only">{t("ACTION_COLUMN")}</span></TableHeaderCell>
              </TableHeaderRow>
              {visibleDraft.map((item) => <TableRow key={item.key} rowKey={item.key} data-variant-key={item.key} data-key={item.key}>
                {supportFavorites && <TableCell data-col="favorite"><button type="button" className="fiori-vm-favorite"
                  disabled={item.key === standardKey || (item.key === draftDefault && item.favorite)}
                  data-disabled={item.key === standardKey || item.key === draftDefault ? "" : undefined}
                  title={t(item.favorite ? "FAV_DEL_TOOLTIP" : "FAV_ADD_TOOLTIP")} aria-label={t(item.favorite ? "FAV_DEL_ACC" : "FAV_ADD_ACC")}
                  aria-pressed={item.favorite} onClick={() => updateItem(item.key, { favorite: !item.favorite })}><Icon icon={item.favorite ? favorite : unfavorite} /></button></TableCell>}
                <TableCell data-col="name">{item.rename && item.key !== standardKey ? <Input value={item.title} aria-label={t("NAME")}
                  data-variant-name={item.key} onChange={(event) => { updateItem(item.key, { title: event.target.value }); setRenamed((current) => current.includes(item.key) ? current : [...current, item.key]) }}
                  valueState={rowError(item) ? "negative" : "none"} valueStateMessage={rowError(item) || null} /> : <span className="fiori-vm-readonly-name">{item.title}</span>}</TableCell>
                {supportPublic && !supportContexts && <TableCell data-col="sharing">{t(item.sharing === "Public" ? "PUBLIC" : "PRIVATE")}</TableCell>}
                {supportDefault && <TableCell data-col="default"><RadioGroupItem className="fiori-vm-default" value={item.key} aria-label={t("DEFAULT")}
                  disabled={supportContexts && restricted(item.contexts)} title={supportContexts && restricted(item.contexts) ? t("NO_DEFAULT_ON_RESTRICTED_VIEWS") : undefined} /></TableCell>}
                {supportApplyAutomatically && <TableCell data-col="execute"><Checkbox aria-label={t("EXECUTEONSELECT")} checked={item.executeOnSelect}
                  onCheckedChange={(checked) => updateItem(item.key, { executeOnSelect: checked === true })} /></TableCell>}
                {supportContexts && <TableCell data-col="contexts">{item.key !== standardKey && <><span>{t(restricted(item.contexts) ? "VISIBILITY_RESTRICTED" : "VISIBILITY_NON_RESTRICTED")}</span>
                  <Button variant="transparent" size="icon" title={t("VISIBILITY_ICON_TT")} aria-label={t("CHANGE_VISIBILITY", item.title)} onClick={(event) => {
                    roleOpenerRef.current = event.currentTarget
                    // _setSelectedContexts normalizes an empty context object for the host picker.
                    setRoleDraft(Object.keys(item.contexts).length ? structuredClone(item.contexts) : { role: [] }); setRoleKey(item.key)
                  }}><Icon icon={edit} /></Button></>}</TableCell>}
                <TableCell data-col="author">{item.author}</TableCell>
                <TableCell data-col="delete">{item.remove && item.key !== standardKey && <Button variant="transparent" size="icon" title={t("DELETE")} aria-label={t("DELETE")}
                  onClick={() => deleteItem(item.key)}><Icon icon={decline} /></Button>}</TableCell>
              </TableRow>)}
            </Table>
          </RadioGroup>
        </DialogBody>
        <DialogFooter className="fiori-vm-footer"><Button variant="emphasized" title={saveTooltip} onClick={saveManage}>{t("SAVE")}</Button><Button ref={cancelRef} onClick={() => cancel("manage")}>{t("CANCEL")}</Button></DialogFooter>
        {resizeHandles(manageGeometry, true)}
        <Dialog modal={!defaultOpen} open={roleKey !== undefined} onOpenChange={(isOpen) => { if (!isOpen) setRoleKey(undefined) }}>
          <DialogContent ref={rolesRef} className="fiori-vm-roles-dialog" portal={portal} data-inline={!portal ? "" : undefined} aria-describedby={undefined}
            {...appearance} style={rolesGeometry.style} data-vm-manual={rolesGeometry.manual}
            onInteractOutside={(event) => { if (defaultOpen && !portal) event.preventDefault() }}
            onKeyDownCapture={(event) => {
              // Dialog.js#onsapenter saves its positive action before a focused
              // checkbox handles Enter. Stage roles without saving the parent dialog.
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
                event.preventDefault(); event.stopPropagation(); saveRoles()
              }
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              // Resume the parent FocusScope before restoring its opener; synchronous
              // focus here can conflict with the closing child's trapped scope.
              queueMicrotask(() => { if (roleOpenerRef.current?.isConnected) roleOpenerRef.current.focus() })
            }}>
            <DialogHeader data-vm-draggable onPointerDown={rolesGeometry.drag} onDoubleClick={rolesGeometry.reset}><DialogTitle>{t("SELECTROLES_DIALOG")}</DialogTitle></DialogHeader>
            <DialogBody>{roleChoices(roleDraft, setRoleDraft)}</DialogBody>
            <DialogFooter><Button variant="emphasized" onClick={saveRoles}>{t("SAVE")}</Button><Button onClick={() => setRoleKey(undefined)}>{t("CANCEL")}</Button></DialogFooter>
            {resizeHandles(rolesGeometry, true, "roles")}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  </div>
}

export { VariantManagement, variantManagementTexts, type VariantManagementProps, type VariantManagementTexts,
  type VariantItem, type VariantContexts, type VariantRole, type VariantSaveEvent, type VariantManageEvent }
