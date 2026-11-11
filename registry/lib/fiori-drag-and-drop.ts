import * as React from "react"

export type FioriMovePlacement = "Before" | "On" | "After"
export type FioriMoveDetail = {
  source: { element: HTMLElement | null }
  destination: { element: HTMLElement; placement: FioriMovePlacement }
  originalEvent?: Event
}
/** UI5 move-over is canceled by the application to accept a placement. */
export type FioriMoveOverEvent = FioriMoveDetail & {
  readonly defaultPrevented: boolean
  preventDefault: () => void
}
export type FioriMoveHandlers = {
  /** Cancel this event with preventDefault() to permit the destination placement. */
  onMoveOver?: (event: FioriMoveOverEvent) => void
  /** Fired for an accepted drop or List keyboard move; update application data here. */
  onMove?: (event: FioriMoveDetail) => void
}

// UI5 base/util/dragAndDrop/DragRegistry.js: one registry permits cross-container moves.
let draggedElement: HTMLElement | null = null

function focusDraggedElement(source: HTMLElement) {
  // UI5 handleDrop calls the actual source's focus; TableRowBase.focus supplies tabindex even for drops into List.
  if (source.hasAttribute("data-table-nav-row")) source.setAttribute("tabindex", "-1")
  source.focus()
}

function moveOver(detail: FioriMoveDetail, handler: FioriMoveHandlers["onMoveOver"]) {
  let accepted = false
  handler?.({ ...detail, destination: { ...detail.destination }, get defaultPrevented() { return accepted }, preventDefault: () => { accepted = true } })
  return accepted
}

/** Port of base/util/dragAndDrop/findClosestPosition.js (vertical containers). */
function closestPosition(elements: HTMLElement[], point: number) {
  let element: HTMLElement | undefined
  let distance = Infinity
  for (const candidate of elements) {
    const { top, height } = candidate.getBoundingClientRect()
    const current = Math.abs(point - (top + height / 2))
    if (current < distance) { distance = current; element = candidate }
  }
  if (!element) return null
  const { top, bottom, height } = element.getBoundingClientRect()
  const before = Math.abs(point - top)
  const on = Math.abs(point - (top + height / 2))
  const after = Math.abs(point - bottom)
  const closest = Math.min(before, on, after)
  const placements: FioriMovePlacement[] = closest === before ? ["Before"] : closest === on ? ["On", before < after ? "Before" : "After"] : ["After"]
  return { element, placements }
}

/** UI5 List._moveItem + findClosestPositionsByKey: Home/End try farthest destinations first. */
function keyboardPositions(elements: HTMLElement[], source: HTMLElement, key: string) {
  const index = elements.indexOf(source)
  if (index < 0) return []
  const before = (element: HTMLElement) => ({ element, placement: "Before" as const })
  const after = (element: HTMLElement) => ({ element, placement: "After" as const })
  switch (key) {
    case "ArrowUp": case "ArrowLeft": return index > 0 ? [before(elements[index - 1])] : []
    case "ArrowDown": case "ArrowRight": return index < elements.length - 1 ? [after(elements[index + 1])] : []
    case "Home": return elements.slice(0, index).map(before)
    case "End": return elements.slice(index + 1).reverse().map(after)
    default: return []
  }
}

export function useFioriDragAndDrop({ rootRef, getItems, kind, onMoveOver, onMove, dragHandlers, focusSource }: FioriMoveHandlers & {
  rootRef: React.RefObject<HTMLElement | null>
  getItems: () => HTMLElement[]
  kind: "table" | "list"
  dragHandlers?: React.HTMLAttributes<HTMLElement>
  /** Table navigation makes its current native row focusable before focusing it. */
  focusSource?: (source: HTMLElement) => void
}) {
  const [destination, setDestination] = React.useState<FioriMoveDetail["destination"] | null>(null)
  const pendingFocus = React.useRef<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    // React commits caller-owned reordering after the event; match UI5 handleDrop/List._moveItem focus after that commit.
    if (pendingFocus.current?.isConnected) {
      if (focusSource) focusSource(pendingFocus.current)
      else focusDraggedElement(pendingFocus.current)
    }
    pendingFocus.current = null
  })
  const destinationRef = React.useRef(destination)
  destinationRef.current = destination
  const clear = () => { destinationRef.current = null; setDestination(null) }
  const commit = (source: HTMLElement | null, target: FioriMoveDetail["destination"], originalEvent: React.SyntheticEvent) => {
    pendingFocus.current = source
    onMove?.({ source: { element: source }, destination: target, ...(kind === "list" || originalEvent.type === "keydown" ? { originalEvent: originalEvent.nativeEvent } : {}) })
    if (source) {
      if (focusSource) focusSource(source)
      else focusDraggedElement(source)
    }
  }
  return {
    indicator: React.createElement(FioriDropIndicator, { targetReference: destination?.element, ownerReference: rootRef.current, placement: destination?.placement }),
    handleKeyDown: (event: React.KeyboardEvent) => {
      if (kind !== "list" || event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return false
      const source = event.target as HTMLElement
      if (!source.hasAttribute("data-movable")) return false
      const positions = keyboardPositions(getItems(), source, event.key)
      if (!positions.length) return false
      event.preventDefault()
      const accepted = positions.find((target) => moveOver({ source: { element: source }, destination: target, originalEvent: event.nativeEvent }, onMoveOver))
      if (accepted) commit(source, accepted, event)
      return true
    },
    handlers: {
      onDragStart: (event: React.DragEvent<HTMLElement>) => {
        dragHandlers?.onDragStart?.(event)
        if (event.defaultPrevented || (kind === "list" && !event.dataTransfer)) return
        const source = event.target as HTMLElement
        if (kind === "list" && (!source.hasAttribute("data-movable") || source.closest('[data-slot="list"]') !== rootRef.current)) return
        if (kind === "table" && !rootRef.current?.contains(source)) return
        // UI5 TableDragAndDrop._ondragstart accepts the native event target, including nested draggable content.
        // ListItem._ondragstart accepts only the item's own native li, never a draggable child.
        draggedElement = source
        event.dataTransfer?.setData("text/plain", source.id)
        if (kind === "list") {
          source.setAttribute("data-moving", "")
          event.dataTransfer.dropEffect = "move"
          event.dataTransfer.effectAllowed = "move"
        }
      },
      onDragEnd: (event: React.DragEvent<HTMLElement>) => {
        dragHandlers?.onDragEnd?.(event)
        if (kind === "table" || event.target === draggedElement) {
          draggedElement?.removeAttribute("data-moving")
          draggedElement = null
        }
        clear()
      },
      onDragEnter: (event: React.DragEvent<HTMLElement>) => { dragHandlers?.onDragEnter?.(event); event.preventDefault() },
      onDragLeave: (event: React.DragEvent<HTMLElement>) => {
        dragHandlers?.onDragLeave?.(event)
        if (!(event.relatedTarget instanceof Node) || !rootRef.current?.contains(event.relatedTarget)) clear()
      },
      onDragOver: (event: React.DragEvent<HTMLElement>) => {
        dragHandlers?.onDragOver?.(event)
        if (event.defaultPrevented || !(event.target instanceof HTMLElement) || (!draggedElement && kind === "list")) return
        const closest = closestPosition(getItems(), event.clientY)
        if (!closest) return clear()
        // UI5 handleDragOver: try On, then its nearest edge, until move-over is canceled.
        const placement = closest.placements.find((placement) => moveOver({ source: { element: draggedElement }, destination: { element: closest.element, placement }, originalEvent: event.nativeEvent }, onMoveOver))
        if (!placement) return clear()
        event.preventDefault()
        const target = { element: closest.element, placement }
        destinationRef.current = target
        setDestination(target)
      },
      onDrop: (event: React.DragEvent<HTMLElement>) => {
        dragHandlers?.onDrop?.(event)
        if (event.defaultPrevented) return clear()
        const target = destinationRef.current
        if (!target) { if (kind === "list") event.preventDefault(); return }
        // UI5 handleDrop fires only for a preceding accepted move-over and restores source focus.
        event.preventDefault()
        commit(draggedElement, target, event)
        clear()
      },
    },
  }
}

/** UI5 DropIndicator.onAfterRendering; exported so fixtures can paint deterministic states. */
export function FioriDropIndicator({ targetReference, ownerReference, placement = "Before" }: {
  targetReference?: HTMLElement | null
  ownerReference?: HTMLElement | null
  placement?: FioriMovePlacement
}) {
  const [geometry, setGeometry] = React.useState<React.CSSProperties | null>(null)
  const [edge, setEdge] = React.useState({ first: false, last: false })
  React.useLayoutEffect(() => {
    if (!targetReference || !ownerReference) { setGeometry(null); return }
    const position = () => {
      if (!targetReference.isConnected) { setGeometry(null); return }
      const target = targetReference.getBoundingClientRect()
      const owner = ownerReference.getBoundingClientRect()
      const top = (placement === "After" ? target.bottom : target.top) - owner.top
      setGeometry({ top, left: target.left - owner.left, width: target.width, height: placement === "On" ? target.height : undefined })
      setEdge({ first: top <= 0, last: top >= owner.height })
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(ownerReference)
    observer.observe(targetReference)
    ownerReference.addEventListener("scroll", position, true)
    return () => { observer.disconnect(); ownerReference.removeEventListener("scroll", position, true) }
  }, [targetReference, ownerReference, placement])
  return geometry ? React.createElement("div", {
    "aria-hidden": true,
    "data-slot": "drop-indicator",
    "data-placement": placement,
    "data-first": edge.first ? "" : undefined,
    "data-last": edge.last ? "" : undefined,
    className: "fiori-drop-indicator",
    style: geometry,
  }, React.createElement("div", { className: placement === "On" ? "fiori-drop-indicator__rect" : "fiori-drop-indicator__needle" })) : null
}
