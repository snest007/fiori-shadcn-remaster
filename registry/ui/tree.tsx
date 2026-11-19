// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

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

type TreeTexts = { expandText: string; collapseText: string }
const TreeTextsContext = React.createContext<TreeTexts & { onItemToggle?: (value: string, expanded: boolean) => void }>({
  expandText: "Expand Node",
  collapseText: "Collapse Node",
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
 */
type TreeProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
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
  expandText = "Expand Node",
  collapseText = "Collapse Node",
  deleteText = "Delete",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: TreeProps) {
  const id = React.useId()
  const { core, focusArea } = useListCoreValue({
    mode: selectionMode,
    itemRole: "treeitem",
    separators,
    value,
    defaultValue,
    onValueChange,
    onItemClick,
    onItemDelete,
    deleteText,
    selectedText: "Selected",
    notSelectedText: "Not Selected",
  })
  const texts = React.useMemo(() => ({ expandText, collapseText, onItemToggle }), [expandText, collapseText, onItemToggle])
  const hasData = React.Children.toArray(children).length > 0
  const headerId = `${id}-header`
  return (
    <ListCoreContext.Provider value={core}>
      <TreeTextsContext.Provider value={texts}>
        <div
          ref={core.rootRef}
          data-slot="tree"
          data-selection-mode={selectionMode}
          data-separators={separators}
          className={cn("fiori-list fiori-tree", className)}
          {...props}
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
              <ul
                role="tree"
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy ?? (!ariaLabel && !header && headerText ? headerId : undefined)}
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
      </TreeTextsContext.Provider>
    </ListCoreContext.Provider>
  )
}

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
  const showGroup = expanded && childCount > 0
  return (
    <li role="none" className="fiori-tree-item__wrapper">
      <div
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
        aria-owns={showGroup ? groupId : undefined}
        className={cn("fiori-tree-item", className)}
        {...handlers}
        {...props}
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
          <div className="fiori-li__content">
            {icon && <Icon icon={icon} className="fiori-li__icon" />}
            {content}
          </div>
          {after && sel}
        </div>
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
          {additionalText && <AdditionalText text={additionalText} state={additionalTextState} />}
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

export { Tree, TreeItem, TreeItemCustom, type TreeProps, type TreeItemProps, type TreeItemCustomProps, type TreeItemType }
