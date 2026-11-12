"use client"

import * as React from "react"

export type F6NavigationRoot = Document | HTMLElement | ShadowRoot

type UI5FocusElement = HTMLElement & {
  isUI5Element: true
  _waitForDomRef: () => Promise<unknown>
  getDomRef: () => HTMLElement | null
}

const groupAttribute = "data-sap-ui-fastnavgroup"
const containerSelector = "[data-sap-ui-fastnavgroup-container='true']"

// UI5 2.28 Keys.js: isF6Next/isF6Previous and checkModifierKeys. Ctrl and Meta are equivalent;
// the alternate keys are Ctrl/Meta+Alt+Down/Up, including legacy aliases/keyCode (not Ctrl+Alt+F6).
type NavigationKeyEvent = Pick<KeyboardEvent, "key" | "keyCode" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">
function direction(event: NavigationKeyEvent): 1 | -1 | 0 {
  const control = !!(event.ctrlKey || event.metaKey)
  const f6 = event.key ? event.key === "F6" : event.keyCode === 117
  if (f6 && !control && !event.altKey) return event.shiftKey ? -1 : 1
  if (!control || !event.altKey || event.shiftKey) return 0
  if (event.key ? event.key === "ArrowDown" || event.key === "Down" : event.keyCode === 40) return 1
  if (event.key ? event.key === "ArrowUp" || event.key === "Up" : event.keyCode === 38) return -1
  return 0
}

/** UI5 Keys.js F6 predicates, for adapters that must let these keys reach the installed navigator. */
export function isF6NavigationKey(event: NavigationKeyEvent): boolean {
  return direction(event) !== 0
}

// UI5 util/getParentElement.js follows the light DOM parent or crosses a shadow root to its host.
// It deliberately does not follow assignedSlot when selecting the current group/container.
function parentElement(element: Element): Element | null {
  return element.parentElement ?? (element.parentNode as ShadowRoot | null)?.host ?? null
}

function deepActive(document: Document): Element | null {
  let element = document.activeElement
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement
  return element
}

function ancestry(element: Node | null): Node[] {
  const nodes: Node[] = []
  while (element) {
    nodes.push(element)
    element = element.parentNode ?? (element as ShadowRoot).host ?? null
  }
  return nodes
}

function within(root: F6NavigationRoot, element: Node): boolean {
  return ancestry(element).includes(root)
}

function isInert(element: Element): boolean {
  // D2 explicitly requires inert pruning. UI5 2.28 getFastNavigationGroups does not prune inert:
  // browsers refuse its selected target's focus, leaving navigation stuck on that group.
  for (let current: Element | null = element; current; current = parentElement(current)) {
    if (current.hasAttribute("inert")) return true
  }
  return false
}

// UI5 util/getFastNavigationGroups.js: visibility pruning and DOM preorder through open shadows
// and assigned slot nodes. This is recalculated for every navigation key, without a stale cache.
function groupsIn(root: HTMLElement | ShadowRoot): HTMLElement[] {
  const groups: HTMLElement[] = []
  const visit = (container: HTMLElement, startFromContainer = false) => {
    const style = container.ownerDocument.defaultView!.getComputedStyle(container)
    if (style.width === "0px" || style.height === "0px" || style.opacity === "0"
      || style.display === "none" || style.visibility === "hidden" || isInert(container)) return
    if (container.getAttribute(groupAttribute) === "true") groups.push(container)
    let assigned: Node[] | undefined
    let index = 0
    let child: Node | null
    if (container.shadowRoot) child = container.shadowRoot.firstChild
    else if (container.nodeName === "SLOT") {
      assigned = (container as HTMLSlotElement).assignedNodes()
      child = assigned[0] ?? null
    } else child = startFromContainer ? container : container.firstElementChild
    while (child) {
      const original = child
      if (child.nodeType === 1) visit(child as HTMLElement)
      child = assigned?.length ? assigned[++index] ?? null
        : child === container ? null : (original as Element).nextElementSibling
    }
  }
  if (root.nodeType === 11) {
    for (const child of root.children) visit(child as HTMLElement)
  } else visit(root as HTMLElement, true)
  return groups
}

function hidden(element: HTMLElement): boolean {
  // UI5 util/isElementHidden.js differs from group visibility: SLOT and display:contents are
  // traversable, and opacity is not checked here (an invisible descendant can still be focusable).
  if (element.nodeName === "SLOT") return false
  const style = element.ownerDocument.defaultView!.getComputedStyle(element)
  return (style.display !== "contents" && element.offsetWidth <= 0 && element.offsetHeight <= 0)
    || style.visibility === "hidden"
}

function clickable(element: HTMLElement): boolean {
  // UI5 util/isElementClickable.js: explicit tabindex takes precedence over the native tag.
  if ((element as HTMLButtonElement).disabled) return false
  const tabIndex = element.getAttribute("tabindex")
  if (tabIndex !== null) return parseInt(tabIndex) >= 0
  return /^(?:input|select|textarea|button)$/i.test(element.nodeName)
    || (/^(?:a|area)$/i.test(element.nodeName) && !!(element as HTMLAnchorElement).href)
}

function isUI5Element(element: HTMLElement): element is UI5FocusElement {
  // UI5 UI5Element.js/createInstanceChecker("isUI5Element"); structural interop requires no UI5 import.
  return "isUI5Element" in element && element.isUI5Element === true
}

function scrollable(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element)
  return (element.scrollHeight > element.clientHeight && ["scroll", "auto"].includes(style.overflowY))
    || (element.scrollWidth > element.clientWidth && ["scroll", "auto"].includes(style.overflowX))
}

async function firstFocusable(container: HTMLElement): Promise<HTMLElement | null> {
  if (hidden(container) || isInert(container)) return null
  // UI5 util/FocusableElements.js findFocusableElement: UI5 negative host tabindex excludes the
  // subtree; wait for getDomRef (not getFocusDomRef), ignore focus traps, traverse slots/shadows,
  // then fall back to a keyboard-focusable scroll container outside Safari.
  const find = async (root: HTMLElement): Promise<HTMLElement | null> => {
    let assigned: Element[] | undefined
    let index = 0
    let child: Element | null
    if (root.shadowRoot) child = root.shadowRoot.firstElementChild
    else if (root.nodeName === "SLOT") {
      assigned = (root as HTMLSlotElement).assignedElements()
      child = assigned[0] ?? null
    } else child = root.firstElementChild
    while (child) {
      const original = child as HTMLElement
      let target: HTMLElement | null = original
      const negativeUI5 = isUI5Element(original) && parseInt(original.getAttribute("tabindex") ?? "") < 0
      if (!hidden(original) && !isInert(original) && !negativeUI5) {
        if (isUI5Element(original)) {
          await original._waitForDomRef()
          target = original.getDomRef()
        }
        if (!target || hidden(target)) return null
        if ((target.hasAttribute("data-ui5-focus-redirect") || !hidden(target))
          && !target.hasAttribute("data-ui5-focus-trap")) {
          if (clickable(target)) return typeof target.focus === "function" ? target : null
          const descendant = await find(target)
          const agent = target.ownerDocument.defaultView!.navigator.userAgent
          const safari = !/(Chrome|CriOS)/.test(agent) && /(Version|PhantomJS)\/(\d+\.\d+).*Safari/.test(agent)
          if (!safari && !descendant && scrollable(target)) return typeof target.focus === "function" ? target : null
          if (descendant) return descendant
        }
      }
      child = original.nextElementSibling
      if (assigned && !assigned[index].contains(child)) child = assigned[++index] ?? null
    }
    return null
  }
  return find(container)
}

async function groupTarget(group?: HTMLElement): Promise<HTMLElement | null> {
  if (!group) return null
  return clickable(group) ? group : firstFocusable(group)
}

async function navigate(document: Document, root: F6NavigationRoot, move: 1 | -1, event: KeyboardEvent) {
  const active = deepActive(document)
  let container: HTMLElement | ShadowRoot = root.nodeType === 9 ? document.body : root as HTMLElement | ShadowRoot
  let selected: Element | null = null
  for (let element = active; element && within(root, element); element = parentElement(element)) {
    const closest = element.closest<HTMLElement>(containerSelector)
    if (closest && within(root, closest)) { container = closest; break }
  }
  for (let element = active; element && within(root, element); element = parentElement(element)) {
    if (element.getAttribute(groupAttribute) === "true") { selected = element; break }
  }
  const groups = groupsIn(container)
  // UI5 F6Navigation._keydownHandler prevents default only when groups exist. It neither checks
  // defaultPrevented nor stops propagation. A Popup with no groups is a no-op, modal or otherwise.
  if (!groups.length) return
  event.preventDefault()
  let current = selected ? groups.indexOf(selected as HTMLElement) : -1
  let target: HTMLElement | null = null
  for (let step = 0; step < groups.length; step++) {
    if (move === 1) current = current >= 0 && current + 1 < groups.length ? current + 1 : 0
    else if (current > 0) {
      // UI5 F6Navigation.findPreviousFocusableGroupElement skips adjacent ancestor groups that
      // share the same first target, e.g. FlexibleColumnLayout > List.
      const currentTarget = await groupTarget(groups[current])
      let distance = 1
      for (; distance < groups.length; distance++) {
        if (await groupTarget(groups[current - distance]) !== currentTarget) break
      }
      current -= distance
      if (current < 0) current = groups.length - 1
    } else current = groups.length - 1
    target = await groupTarget(groups[current])
    if (target) break
  }
  target?.focus()
}

type Installation = { roots: Map<F6NavigationRoot, number>; listener: (event: KeyboardEvent) => void }
const installations = new WeakMap<Document, Installation>()

/**
 * Opt in to UI5 2.28 F6/Shift+F6 fast navigation (also Ctrl/Meta+Alt+Down/Up).
 * Importing this library installs nothing. Each cleanup is idempotent; duplicate roots are reference
 * counted. One document coordinator selects the innermost installed root, preventing overlapping
 * installations from handling a key twice. Element/ShadowRoot installations stay inside that root;
 * focus outside it is ignored. Popups bound navigation to their nearest fastnavgroup-container.
 *
 * Application convention: mark shell bar, side navigation, page title, header/filter bar, content and
 * footer with data-sap-ui-fastnavgroup="true" in DOM order. UI5-equivalent components mark their own
 * groups; add application groups around other regions only where useful. Static/empty regions are
 * skipped. An attribute supplied by the application can override a component's automatic group.
 * The five floorplan blocks install on document to include their portalled Popup surfaces.
 */
export function installF6Navigation(root: F6NavigationRoot = document): () => void {
  const owner = root.nodeType === 9 ? root as Document : root.ownerDocument!
  let installation = installations.get(owner)
  if (!installation) {
    const roots = new Map<F6NavigationRoot, number>()
    const listener = (event: KeyboardEvent) => {
      const move = direction(event)
      if (!move) return
      const scope = ancestry(deepActive(owner)).find((node) => roots.has(node as F6NavigationRoot)) as F6NavigationRoot | undefined
      if (scope) void navigate(owner, scope, move, event)
    }
    installation = { roots, listener }
    installations.set(owner, installation)
    owner.addEventListener("keydown", listener)
  }
  installation.roots.set(root, (installation.roots.get(root) ?? 0) + 1)
  let cleaned = false
  return () => {
    if (cleaned) return
    cleaned = true
    const count = installation.roots.get(root)!
    if (count > 1) installation.roots.set(root, count - 1)
    else installation.roots.delete(root)
    if (!installation.roots.size) {
      owner.removeEventListener("keydown", installation.listener)
      installations.delete(owner)
    }
  }
}

/** Install after mount and clean up on unmount/root change (including React StrictMode). Null disables it. */
export function useF6Navigation(root?: F6NavigationRoot | null): void {
  // Resolve document inside the effect so importing and server-rendering the hook are SSR-safe.
  React.useEffect(() => root === null ? undefined : installF6Navigation(root ?? document), [root])
}
