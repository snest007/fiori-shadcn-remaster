// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { createPortal } from "react-dom"

import { navigationDownArrow, navigationRightArrow, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import {
  AdditionalText,
  ListCoreContext,
  SelectionElement,
  handleNavigationKey,
  isSingle,
  useListCoreValue,
  useListItemBehaviour,
  type ListAdditionalTextState,
  type ListItemHighlight,
  type ListSelectionMode,
  type ListSeparators,
} from "@/components/ui/list"

// Mirrors ui5-tree / ui5-tree-item / ui5-tree-item-custom (Horizon). The tree is a ui5-list with
// role="tree": same selection modes, roving focus and Tab behaviour as <List>, plus
// → expands a collapsed node or moves to its first child, ← collapses or moves to the parent.
// Children of a collapsed node are not rendered (as in UI5). Styles: registry/styles/components/tree.css.

type TreeItemType = "active" | "inactive" | "inactiveSelectable"

type TreeTexts = {
  expandText: string; collapseText: string; treeItem: string; active: string
  selected: string; notSelected: string; selectable: string; multiSelectable: string; deletable: string; delete: string
}
const defaultTreeTexts: TreeTexts = {
  expandText: "Expand Node", // UI5 TREE_ITEM_EXPAND_NODE
  collapseText: "Collapse Node", // UI5 TREE_ITEM_COLLAPSE_NODE
  treeItem: "Tree Item", // UI5 TREE_ITEM_ARIA_LABEL
  active: "Is Active", // UI5 LIST_ITEM_ACTIVE
  selected: "Selected", // UI5 LIST_ITEM_SELECTED
  notSelected: "Not Selected", // UI5 LIST_ITEM_NOT_SELECTED
  selectable: "Contains Selectable Items", // UI5 ARIA_LABEL_LIST_SELECTABLE
  multiSelectable: "Contains Multi-Selectable Items", // UI5 ARIA_LABEL_LIST_MULTISELECTABLE
  deletable: "Contains Deletable Items", // UI5 ARIA_LABEL_LIST_DELETABLE
  delete: "Delete", // UI5 DELETE
}
const TreeTextsContext = React.createContext<TreeTexts & { onItemToggle?: (value: string, expanded: boolean) => void }>({
  ...defaultTreeTexts,
})

type Position = { level: number; posinset: number; setsize: number }
const PositionContext = React.createContext<Position>({ level: 1, posinset: 1, setsize: 1 })

/** Wraps each child element with its aria-level / aria-posinset / aria-setsize. */
function withPositions(children: React.ReactNode, level: number) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  return items.map((child, i) => (
    <PositionContext.Provider key={child.key ?? i} value={{ level, posinset: i + 1, setsize: items.length }}>
      {child}
    </PositionContext.Provider>
  ))
}

/**
 * @accessibility aria-label / aria-labelledby name the internal tree; TreeItem and TreeItemCustom own treeitem/group roles, aria-level/posinset/setsize, expansion, selection and roving tabindex. expandText/collapseText name toggle tooltips; deleteText names deletion.
 * @accessibility Up/Down, Home/End and PageUp/Down move visible nodes. Physical Right expands or enters a child; Left collapses or returns to parent in both directions. Enter/Space activates/selects; Delete requests deletion. hasChildren supports caller-managed lazy loading.
 * @accessibility aria-description / aria-describedby describe the internal tree; reference target text takes precedence.
 */
type TreeProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Screen-reader and toggle texts; legacy individual text props take precedence. */
  texts?: Partial<TreeTexts>
  selectionMode?: ListSelectionMode
  /** Values of the selected items (controlled). */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[], detail: { item: string; selected: boolean }) => void
  onItemClick?: (value: string) => void
  onItemDelete?: (value: string) => void
  /** Fired when a node is expanded or collapsed (toggle icon, → / ←). */
  onItemToggle?: (value: string, expanded: boolean) => void
  headerText?: string
  header?: React.ReactNode
  footerText?: string
  noDataText?: string
  separators?: ListSeparators
  /** Tooltip of the toggle icon (defaults "Expand Node" / "Collapse Node"). */
  expandText?: string
  collapseText?: string
  deleteText?: string
}

function Tree({
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  onItemClick,
  onItemDelete,
  onItemToggle,
  headerText,
  header,
  footerText,
  noDataText,
  separators = "all",
  expandText,
  collapseText,
  deleteText,
  texts: textOverrides,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-description": ariaDescription,
  "aria-describedby": ariaDescriptionRef,
  ...props
}: TreeProps) {
  const id = React.useId()
  const texts = React.useMemo(() => ({ ...defaultTreeTexts, ...textOverrides,
    ...(expandText === undefined ? {} : { expandText }), ...(collapseText === undefined ? {} : { collapseText }),
    ...(deleteText === undefined ? {} : { delete: deleteText }), onItemToggle }), [textOverrides, expandText, collapseText, deleteText, onItemToggle])
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [announcementTarget, setAnnouncementTarget] = React.useState<HTMLElement | null>(null)
  const { core, focusArea } = useListCoreValue({
    mode: selectionMode,
    itemRole: "treeitem",
    separators,
    value,
    defaultValue,
    onValueChange,
    onItemClick,
    onItemDelete,
    deleteText: texts.delete,
    selectedText: texts.selected,
    notSelectedText: texts.notSelected,
    // TreeTemplate.js delegates to TreeList, which inherits List.js:onSelectionRequested.
    announceSelection: (selected) => setAnnouncement((old) => ({ text: selected ? texts.selected : texts.notSelected, sequence: old.sequence + 1 })),
  })
  React.useEffect(() => setAnnouncementTarget(core.rootRef.current?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? document.body), [])
  React.useEffect(() => {
    if (!announcement.text) return
    // InvisibleMessage.js:announce clears the last announcement after 3000 ms.
    const timer = setTimeout(() => setAnnouncement((old) => old.sequence === announcement.sequence ? { ...old, text: "" } : old), 3000)
    return () => clearTimeout(timer)
  }, [announcement])
  const [referencedDescription, setReferencedDescription] = React.useState("")
  React.useLayoutEffect(() => {
    if (!ariaDescriptionRef) { setReferencedDescription(""); return }
    const root = core.rootRef.current?.getRootNode() as Document | ShadowRoot | undefined
    if (!root) return
    // TreeTemplate.js forwards description channels to List.js:ariaDescriptionText.
    const update = () => setReferencedDescription(ariaDescriptionRef.trim().split(/\s+/).map((target) => root.getElementById(target)?.textContent?.trim()).filter(Boolean).join(" "))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["id"] })
    return () => observer.disconnect()
  }, [ariaDescriptionRef, core.rootRef])
  const hasData = React.Children.toArray(children).length > 0
  const headerId = `${id}-header`
  const modeId = `${id}-mode`
  const modeText = hasData ? (isSingle(selectionMode) ? texts.selectable : selectionMode === "multiple" ? texts.multiSelectable : selectionMode === "delete" ? texts.deletable : undefined) : undefined
  return (
    <ListCoreContext.Provider value={core}>
      <TreeTextsContext.Provider value={texts}>
        <div
          {...props}
          ref={core.rootRef}
          data-slot="tree"
          data-selection-mode={selectionMode}
          data-separators={separators}
          className={cn("fiori-list fiori-tree", className)}
        >
          {/* UI5 TreeTemplate renders TreeList, inheriting List fastNavigation metadata. */}
          <div className="fiori-list__container" data-sap-ui-fastnavgroup="true">
            {header}
            {!header && headerText && (
              <header id={headerId} className="fiori-list__header">
                {headerText}
              </header>
            )}
            <div className="fiori-list__scroll">
              {hasData && focusArea("before")}
              {modeText && <span id={modeId} className="sr-only">{modeText}</span>}
              <ul
                role="tree"
                aria-label={ariaLabel}
                // List.js:ariaLabelledBy combines the mode and generated header when no explicit name exists.
                aria-labelledby={ariaLabelledBy ?? (!ariaLabel ? cn(modeText && modeId, !header && headerText && headerId) || undefined : undefined)}
                aria-description={referencedDescription || ariaDescription}
                aria-multiselectable={selectionMode === "multiple" || undefined}
                className="fiori-list__ul"
                onKeyDown={(e) => {
                  if (!e.defaultPrevented) handleNavigationKey(e, core)
                }}
              >
                {withPositions(children, 1)}
                {!hasData && noDataText && (
                  <li tabIndex={0} role="treeitem" className="fiori-list__nodata">
                    <div className="fiori-list__nodata-text">{noDataText}</div>
                  </li>
                )}
              </ul>
              {footerText && <footer className="fiori-list__footer">{footerText}</footer>}
              {hasData && focusArea("after")}
            </div>
          </div>
        </div>
        {announcementTarget && createPortal(<span data-slot="tree-announcement" data-owner={props.id} className="sr-only" role="alert" aria-live="polite" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></span>, announcementTarget)}
      </TreeTextsContext.Provider>
    </ListCoreContext.Provider>
  )
}

/** aria-label names the owning treeitem, with UI5's active hint appended.
 * aria-haspopup reaches that same row. The component owns its role, nesting,
 * selection, label/description target ids and roving tabindex.
 */
type TreeItemBaseProps = Omit<React.ComponentProps<"div">, "value" | "type" | "content"> & {
  value?: string
  type?: TreeItemType
  highlight?: ListItemHighlight
  disabled?: boolean
  icon?: FioriIconData
  /** Expanded state (controlled). */
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Shows the expand toggle even without children (lazy loading). */
  hasChildren?: boolean
}

type TreeItemRootProps = TreeItemBaseProps & {
  content: React.ReactNode
  hideSelectionElement?: boolean
}

function TreeItemRoot({
  value: valueProp,
  type = "active",
  highlight = "none",
  disabled,
  icon,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  hasChildren,
  content,
  hideSelectionElement,
  className,
  children,
  onKeyDown,
  onKeyUp,
  onClick,
  onFocus,
  onPointerDown,
  "aria-label": accessibleName,
  "aria-labelledby": externalNameRef,
  "aria-describedby": externalDescriptionRef,
  ...props
}: TreeItemRootProps) {
  const pos = React.useContext(PositionContext)
  const texts = React.useContext(TreeTextsContext)
  const [innerExpanded, setInnerExpanded] = React.useState(defaultExpanded)
  const expanded = expandedProp ?? innerExpanded
  const childCount = React.Children.toArray(children).filter(React.isValidElement).length
  const showToggle = !!hasChildren || childCount > 0

  const toggle = (value: string) => {
    const next = !expanded
    if (expandedProp === undefined) setInnerExpanded(next)
    onExpandedChange?.(next)
    texts.onItemToggle?.(value, next)
  }

  const { core, value, selected, inactive, handlers } = useListItemBehaviour({
    value: valueProp,
    type,
    disabled,
    onKeyUp,
    onClick,
    onFocus,
    onPointerDown,
    onKeyDown: (e) => {
      onKeyDown?.(e as React.KeyboardEvent<HTMLDivElement>)
      if (e.defaultPrevented || e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
      // UI5 TreeItemBase.js _onkeydown uses physical Right/Left for expansion
      // and step-in/step-out in both directions; Keys.js does not mirror them.
      const key = e.key
      if (key === "ArrowRight" && showToggle) {
        e.preventDefault()
        if (!expanded) toggle(value)
        else e.currentTarget.parentElement?.querySelector<HTMLElement>(':scope > [role="group"] > li > [data-nav-key]')?.focus()
      } else if (key === "ArrowLeft") {
        e.preventDefault()
        if (expanded && showToggle) toggle(value)
        else if (pos.level > 1)
          e.currentTarget.closest('[role="group"]')?.parentElement?.querySelector<HTMLElement>(':scope > [data-slot="tree-item"]')?.focus()
      }
    },
  })

  const mode = core.mode
  const ariaSelected = mode === "multiple" || (isSingle(mode) && mode !== "singleAuto") ? selected : undefined
  const before = !hideSelectionElement && (mode === "multiple" || mode === "singleStart")
  const after = !hideSelectionElement && (mode === "singleEnd" || mode === "delete")
  const sel = <SelectionElement core={core} value={value} selected={selected} inactive={inactive} disabled={disabled} />
  const hasBorder = core.hasBorder(value)

  // The subtree sits next to the treeitem (not inside it) and is linked with aria-owns, as in UI5, so the
  // item's name and visible text stay its own row.
  const groupId = React.useId()
  const contentId = React.useId()
  const nameId = React.useId()
  const descriptionId = React.useId()
  // TreeItemBase.js:_accInfo adds TREE_ITEM_ARIA_LABEL unless accessibleName exists;
  // ListItem.js:ariaLabelledByText appends LIST_ITEM_ACTIVE independently of that name.
  const nameText = [accessibleName || (!externalNameRef && texts.treeItem), type === "active" && texts.active].filter(Boolean).join(" ")
  const showGroup = expanded && childCount > 0
  return (
    <li role="none" className="fiori-tree-item__wrapper">
      <div
        {...props}
        data-slot="tree-item"
        data-nav-key={value}
        data-level={pos.level}
        data-selected={selected ? "" : undefined}
        data-has-border={hasBorder ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        role="treeitem"
        tabIndex={disabled ? -1 : core.currentKey === value ? 0 : -1}
        aria-level={pos.level}
        aria-posinset={pos.posinset}
        aria-setsize={pos.setsize}
        aria-expanded={showToggle ? expanded : undefined}
        aria-selected={ariaSelected}
        aria-disabled={disabled || undefined}
        // ListItem.js:_accessibleNameRef excludes content for accessibleName and
        // otherwise references only this row's content plus its owned hidden hint.
        aria-labelledby={cn(externalNameRef, !accessibleName && !externalNameRef && contentId, nameId)}
        // ListItemTemplate.js always renders the selection description target, even empty.
        aria-describedby={cn(externalDescriptionRef, descriptionId)}
        aria-owns={showGroup ? groupId : undefined}
        className={cn("fiori-tree-item", className)}
        {...handlers}
      >
        <div
          data-li-row=""
          data-selected={selected ? "" : undefined}
          // UI5 tree items are never "actionable" (TreeItemBase.onBeforeRendering skips ListItem's), so
          // they get no list hover / pressed styling; hover comes from tree.css in selection modes.
          data-has-border={hasBorder ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          data-highlight={highlight !== "none" ? highlight : undefined}
          data-mode={mode}
          className="fiori-li"
        >
          <div
            className="fiori-tree-item__toggle-box"
            style={{ paddingInlineStart: `calc(var(--fiori-x-tree-indent-step) * ${pos.level - 1})` }}
          >
            {showToggle && (
              <span
                aria-hidden
                title={expanded ? texts.collapseText : texts.expandText}
                className="fiori-tree-item__toggle"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(value)
                }}
              >
                <Icon icon={expanded ? navigationDownArrow : navigationRightArrow} className="fiori-tree-item__toggle-icon" />
              </span>
            )}
          </div>
          {before && sel}
          {highlight !== "none" && <div className="fiori-li__highlight" />}
          <div id={contentId} className="fiori-li__content">
            {icon && <Icon icon={icon} className="fiori-li__icon" />}
            {content}
          </div>
          {after && sel}
        </div>
        <span id={nameId} className="sr-only">{nameText}</span>
        <span id={descriptionId} className="sr-only">{ariaSelected === undefined ? "" : selected ? texts.selected : texts.notSelected}</span>
      </div>
      {showGroup && (
        <ul id={groupId} role="group" className="fiori-tree-item__subtree">
          {withPositions(children, pos.level + 1)}
        </ul>
      )}
    </li>
  )
}

type TreeItemProps = TreeItemBaseProps & {
  text?: React.ReactNode
  additionalText?: React.ReactNode
  additionalTextState?: ListAdditionalTextState
}

/** ui5-tree-item. Nest <TreeItem>s as children for sub-nodes. */
function TreeItem({ text, additionalText, additionalTextState = "none", ...props }: TreeItemProps) {
  return (
    <TreeItemRoot
      {...props}
      content={
        <>
          <div className="fiori-li__text-wrapper">{text != null && text !== "" && <div className="fiori-li__title">{text}</div>}</div>
          {/* TreeItemTemplate.js renders title and additional text in separate
              blocks. Keep a DOM word boundary too, so axe's visible-text channel
              agrees with Chromium's space-separated accessible name. */}
          {additionalText && <> <AdditionalText text={additionalText} state={additionalTextState} /></>}
        </>
      }
    />
  )
}

type TreeItemCustomProps = TreeItemBaseProps & {
  /** The item's own content (UI5 `content` slot); `children` are sub-nodes. */
  content?: React.ReactNode
  /** Hides the radio button / check box in selection modes. */
  hideSelectionElement?: boolean
}

/** ui5-tree-item-custom */
function TreeItemCustom({ content, ...props }: TreeItemCustomProps) {
  return <TreeItemRoot {...props} content={<div className="fiori-tree-item__custom">{content}</div>} />
}

export { Tree, TreeItem, TreeItemCustom, type TreeProps, type TreeItemProps, type TreeItemCustomProps, type TreeItemType, type TreeTexts }
