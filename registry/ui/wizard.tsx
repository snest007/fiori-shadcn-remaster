// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

// UI5 2.28 Wizard fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import type { FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

// Mirrors ui5-wizard / ui5-wizard-step (UI5 2.28). A header of step tabs (numbers or icons, titles,
// subtitles, separators) above the step contents, which are stacked in one scroll area: choosing a tab
// scrolls to its step and focuses its first focusable element; scrolling past 70% of a step selects
// the next one. Disabled steps (not reached yet) are hidden and their tabs inactive; the app enables
// the next step once the current one is valid. Tabs: ←/→/↑/↓, Home/End move between enabled tabs,
// Enter/Space select. When the header is too narrow (200px per step), steps far from the current one
// collapse into stacks; clicking a stack lists its steps in a popover.
// Styles: registry/styles/components/wizard.css.

type WizardContentLayout = "multipleSteps" | "singleStep"

type WizardStepProps = {
  /** Identifies the step (Wizard `selectedStep`, `onStepChange`); defaults to its index. */
  value?: string
  titleText?: string
  subtitleText?: string
  icon?: FioriIconData
  /** Not reachable yet: the tab is inactive and the content hidden. */
  disabled?: boolean
  /** The step branches: its separator is dashed. */
  branching?: boolean
  children?: React.ReactNode
}

/** A wizard step; place them as children of <Wizard>. The children are the step's content. */
function WizardStep({ children }: WizardStepProps) {
  return <>{children}</>
}

type WizardTexts = {
  /** Wizard region name ("Wizard"). */
  wizard: string
  /** <nav> name ("Wizard Progress Bar"). */
  navigation: string
  /** Step list name ("Wizard Steps"). */
  steps: string
  /** Hint for the step list ("To activate, press the space bar or Enter"). */
  activateHint: string
  /** "Step {n} {title} {Active|Inactive} {Optional}". */
  stepLabel: (n: number, title: string | undefined, enabled: boolean, optional: boolean) => string
  /** Content region name "Step {n} {title}". */
  stepContentLabel: (n: number, title: string | undefined) => string
  cancel: string
}

const defaultTexts: WizardTexts = {
  wizard: "Wizard",
  navigation: "Wizard Progress Bar",
  steps: "Wizard Steps",
  activateHint: "To activate, press the space bar or Enter",
  stepLabel: (n, title, enabled, optional) =>
    `Step ${(title ? `${n} ${title}` : `Step ${n}`) + ` ${enabled ? "Active" : "Inactive"}` + (optional ? " Optional" : "")}`.trim(),
  stepContentLabel: (n, title) => `Step ${n} ${title ?? ""}`.trim(),
  cancel: "Cancel",
}

type StepChange = { previousStep: string | undefined; withScroll: boolean }

type WizardProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** Value of the selected step (controlled). */
  selectedStep?: string
  defaultSelectedStep?: string
  /** Fired when the user selects a step (tab, stack popover) or scrolls to it. */
  onStepChange?: (step: string, detail: StepChange) => void
  /** "multipleSteps" (default) stacks all reached steps; "singleStep" shows only the selected one. */
  contentLayout?: WizardContentLayout
  /** Share of a step (0.5–1, default 0.7) to scroll past before the next step gets selected. */
  stepSwitchThreshold?: number
  accessibleName?: string
  texts?: Partial<WizardTexts>
}

const MIN_STEP_WIDTH_WITH_TITLE = 200
const SCROLL_DEBOUNCE = 25

type TabLayout = { expanded: boolean; prev: boolean; next: boolean; afterCurrent: boolean }

/** UI5 Wizard._adjustHeaderOverflow: which tabs show in full when the header is narrow. */
function headerLayout(count: number, current: number, listWidth: number | null): TabLayout[] | null {
  if (listWidth == null || !count) return null
  const show = Math.floor(listWidth / MIN_STEP_WIDTH_WITH_TITLE)
  const tabs: TabLayout[] = Array.from({ length: count }, (_, i) => ({ expanded: false, prev: false, next: false, afterCurrent: i > current }))
  if (tabs[current]) tabs[current].expanded = true
  let counter = 0
  let forward = true
  for (let i = 1; i < show; i++) {
    if (forward) counter += 1
    if (forward && tabs[current + counter]) {
      tabs[current + counter].expanded = true
      forward = !forward
    } else if (!forward && tabs[current - counter]) {
      tabs[current - counter].expanded = true
      forward = !forward
    } else if (tabs[current + counter + 1]) {
      counter += 1
      tabs[current + counter].expanded = true
      forward = true
    } else if (tabs[current - counter]) {
      tabs[current - counter].expanded = true
      counter += 1
      forward = false
    }
  }
  for (let i = 0; i < count; i++) {
    if (tabs[i].expanded && tabs[i - 1] && !tabs[i - 1].expanded) tabs[i - 1].prev = true
    if (!tabs[i].expanded && tabs[i - 1]?.expanded) {
      tabs[i].next = true
      break
    }
  }
  return tabs
}

async function focusFirstIn(container: HTMLElement | null) {
  const el = container?.querySelector<HTMLElement>(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  )
  el?.focus({ preventScroll: true })
}

function Wizard({
  selectedStep,
  defaultSelectedStep,
  onStepChange,
  contentLayout = "multipleSteps",
  stepSwitchThreshold = 0.7,
  accessibleName,
  texts: textsProp,
  className,
  children,
  ...props
}: WizardProps) {
  const texts = { ...defaultTexts, ...textsProp }
  const id = React.useId()
  const steps = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((c, i) => {
      const p = c.props as WizardStepProps
      return { ...p, value: p.value ?? String(i), key: c.key ?? i }
    })
  const [inner, setInner] = React.useState(defaultSelectedStep)
  const requested = selectedStep !== undefined ? selectedStep : inner
  let current = steps.findIndex((s) => s.value === requested)
  if (current < 0) current = 0
  const currentValue = steps[current]?.value
  let lastEnabled = 0
  steps.forEach((s, i) => {
    if (!s.disabled) lastEnabled = i
  })

  const listRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const tabRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [listWidth, setListWidth] = React.useState<number | null>(null)
  const [focusIndex, setFocusIndex] = React.useState<number | null>(null)
  const [stack, setStack] = React.useState<{ anchor: number; from: number; to: number } | null>(null)
  /** Position of our own programmatic scroll; a scroll event landing there is not the user's. */
  const ownScrollTop = React.useRef<number | null>(null)
  const byScroll = React.useRef(false)
  const scrollTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Starts at 0 so an initially selected later step is scrolled into view (as UI5 does on first render).
  const prevCurrent = React.useRef(0)

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    setListWidth(list.getBoundingClientRect().width)
    const ro = new ResizeObserver(() => {
      setListWidth(list.getBoundingClientRect().width)
      setStack(null)
    })
    ro.observe(list)
    return () => ro.disconnect()
  }, [])
  React.useEffect(() => () => clearTimeout(scrollTimer.current), [])

  const select = (index: number, withScroll: boolean) => {
    const step = steps[index]
    if (!step || step.disabled || index === current) return
    if (selectedStep === undefined) setInner(step.value)
    onStepChange?.(step.value, { previousStep: currentValue, withScroll })
  }

  /** End of the closest previous step with content: where step `index` starts. */
  const scrollPosOf = (index: number) => {
    for (let i = index - 1; i >= 0; i--) {
      const el = itemRefs.current[i]
      const end = el ? el.offsetTop + el.offsetHeight : 0
      if (end > 0) return end
    }
    return 0
  }

  // After a selection change: scroll to the step (unless the user scrolled there) and focus into it.
  React.useLayoutEffect(() => {
    if (prevCurrent.current === current) return
    prevCurrent.current = current
    if (!byScroll.current && contentRef.current) {
      contentRef.current.scrollTop = scrollPosOf(current)
      ownScrollTop.current = contentRef.current.scrollTop
    }
    byScroll.current = false
  })

  const onScroll = () => {
    const own = ownScrollTop.current
    ownScrollTop.current = null
    if (own != null && contentRef.current && Math.abs(contentRef.current.scrollTop - own) < 1) return
    if (contentLayout === "singleStep") return
    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const pos = contentRef.current?.scrollTop ?? 0
      let next = current
      for (let i = 0; i < steps.length; i++) {
        const el = itemRefs.current[i]
        const end = el ? el.offsetTop + el.offsetHeight : 0
        if (end > 0 && pos < end) {
          const boundary = el!.offsetTop + el!.offsetHeight * Math.min(Math.max(stepSwitchThreshold, 0.5), 1)
          next = pos > boundary ? i + 1 : i
          break
        }
      }
      if (next !== current && steps[next] && !steps[next].disabled) {
        byScroll.current = true
        select(next, true)
      }
    }, SCROLL_DEBOUNCE)
  }

  const layout = headerLayout(steps.length, current, listWidth)
  const enabledTabs = steps.map((s, i) => (s.disabled ? -1 : i)).filter((i) => i >= 0)
  const tabStop = focusIndex != null && !steps[focusIndex]?.disabled ? focusIndex : current

  const activateTab = (index: number) => {
    const l = layout?.[index]
    // A collapsed stack at the start / end of the header opens its popover.
    if (l && !l.expanded) {
      if (l.prev && index > 0) return setStack({ anchor: index, from: 0, to: index })
      if (l.next && index + 1 < steps.length) return setStack({ anchor: index, from: index, to: steps.length - 1 })
    }
    if (steps[index].disabled) return
    focusFirstIn(itemRefs.current[index])
    if (index === current) {
      if (contentRef.current) {
        contentRef.current.scrollTop = scrollPosOf(current)
        ownScrollTop.current = contentRef.current.scrollTop
      }
      return
    }
    if (!l || l.expanded || index === 0 || index === steps.length - 1) select(index, false)
  }

  // Focus the first field of a newly selected step (UI5 focusFirstElementInCurrentStep).
  const lastFocused = React.useRef(current)
  React.useEffect(() => {
    if (lastFocused.current === current) return
    lastFocused.current = current
    focusFirstIn(itemRefs.current[current])
  }, [current])

  return (
    <div data-slot="wizard" data-sap-ui-fastnavgroup="true" data-content-layout={contentLayout} className={cn("fiori-wiz", className)} {...props}>
      <div className="fiori-wiz__root" role="region" aria-label={accessibleName ?? texts.wizard}>
        <nav className="fiori-wiz__nav" aria-label={texts.navigation} tabIndex={-1}>
          <div
            ref={listRef}
            className="fiori-wiz__nav-list"
            role="list"
            aria-label={texts.steps}
            aria-describedby={`${id}-descr`}
            aria-controls={`${id}-content`}
            onKeyDown={(e) => {
              if (e.altKey || e.ctrlKey || e.metaKey) return
              const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
              const pos = enabledTabs.indexOf(tabStop)
              let next = -1
              if (e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = Math.min(pos + 1, enabledTabs.length - 1)
              else if (e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = Math.max(pos - 1, 0)
              else if (e.key === "Home") next = 0
              else if (e.key === "End") next = enabledTabs.length - 1
              else return
              e.preventDefault()
              const target = enabledTabs[next]
              setFocusIndex(target)
              tabRefs.current[target]?.focus()
            }}
          >
            {steps.map((step, i) => {
              const l = layout?.[i]
              const hideSeparator = i === steps.length - 1 && !step.branching
              const isAfter = i > current
              return (
                <div
                  key={step.key}
                  data-slot="wizard-tab"
                  className="fiori-wiz-tab"
                  data-selected={i === current ? "" : undefined}
                  data-disabled={step.disabled ? "" : undefined}
                  data-active-separator={i < lastEnabled && !step.disabled ? "" : undefined}
                  data-branching-separator={step.branching ? "" : undefined}
                  data-has-subtitle={step.subtitleText ? "" : undefined}
                  data-expanded-tab={l ? String(l.expanded) : undefined}
                  data-expanded-tab-prev={l ? String(l.prev) : undefined}
                  data-expanded-tab-next={l ? String(l.next) : undefined}
                  data-after-current-tab={l && isAfter ? "true" : undefined}
                  style={{ zIndex: isAfter ? steps.length + 10 - (i - current) : 1 }}
                  onClick={() => activateTab(i)}
                >
                  <div
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    className="fiori-wiz-tab__root"
                    role="listitem"
                    tabIndex={step.disabled ? undefined : i === tabStop ? 0 : -1}
                    aria-current={i === current ? "step" : undefined}
                    aria-setsize={steps.length}
                    aria-posinset={i + 1}
                    aria-label={texts.stepLabel(i + 1, step.titleText, !step.disabled, !!step.subtitleText)}
                    aria-disabled={step.disabled || undefined}
                    onFocus={() => setFocusIndex(i)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") e.preventDefault()
                    }}
                    onKeyUp={(e) => {
                      if (step.disabled || e.shiftKey) return
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault()
                        activateTab(i)
                      }
                    }}
                  >
                    <div className="fiori-wiz-tab__main">
                      <div className="fiori-wiz-tab__circle">
                        {step.icon ? (
                          <Icon icon={step.icon} className="fiori-wiz-tab__icon" />
                        ) : (
                          <span className="fiori-wiz-tab__number">{i + 1}</span>
                        )}
                      </div>
                      {(step.titleText || step.subtitleText) && (
                        <div className="fiori-wiz-tab__texts">
                          <div className="fiori-wiz-tab__title">{step.titleText}</div>
                          {step.subtitleText && <div className="fiori-wiz-tab__subtitle">{step.subtitleText}</div>}
                        </div>
                      )}
                    </div>
                    {!hideSeparator && <div className="fiori-wiz-tab__hr" />}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>
        <span id={`${id}-descr`} className="fiori-wiz__hidden-text" aria-hidden>
          {texts.activateHint}
        </span>
        <div id={`${id}-content`} ref={contentRef} className="fiori-wiz__content" onScroll={onScroll}>
          {steps.map((step, i) => (
            <div
              key={step.key}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              data-slot="wizard-step"
              data-selected={i === current ? "" : undefined}
              data-stretch={i === lastEnabled ? "" : undefined}
              hidden={step.disabled}
              role="region"
              aria-label={texts.stepContentLabel(i + 1, step.titleText)}
              className="fiori-wiz__content-item"
            >
              <div className="fiori-wiz__content-item-wrapper">{step.children}</div>
            </div>
          ))}
        </div>
      </div>
      <Popover open={!!stack} onOpenChange={(o) => !o && setStack(null)}>
        {stack && (
          <PopoverAnchor
            virtualRef={{ current: tabRefs.current[stack.anchor] } as React.RefObject<HTMLElement>}
          />
        )}
        <PopoverContent side="bottom" align="center" hideArrow aria-label={texts.steps} className="fiori-wiz-popover">
          <ul className="fiori-wiz-popover__list">
            {stack &&
              steps.slice(stack.from, stack.to + 1).map((s, k) => {
                const index = stack.from + k
                return (
                  <li key={s.key}>
                    <Button
                      variant="transparent"
                      disabled={s.disabled}
                      className="fiori-wiz-popover__step"
                      onClick={() => {
                        setStack(null)
                        select(index, false)
                        tabRefs.current[index]?.focus()
                      }}
                    >
                      {s.icon && <Icon icon={s.icon} />}
                      {s.titleText}
                    </Button>
                  </li>
                )
              })}
          </ul>
          <div className="fiori-wiz-popover__footer">
            <Button variant="transparent" onClick={() => setStack(null)}>
              {texts.cancel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { Wizard, WizardStep, type WizardProps, type WizardStepProps, type WizardTexts, type WizardContentLayout }
