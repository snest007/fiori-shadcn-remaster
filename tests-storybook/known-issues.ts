import { type Page, type TestInfo } from "@playwright/test"
import { type axeViolations } from "./accessibility"

type Violations = Awaited<ReturnType<typeof axeViolations>>
export interface AuditContext {
  story: string
  theme: string
  primary?: boolean
  control?: { prop: string; choice: unknown }
  yearMode?: boolean
}
export const componentDefect = "component defect, fixed by E4 — see docs/plan/handoff/S0-a11y-candidates"

export async function classifyViolations(page: Page, raw: Violations, context: AuditContext) {
  const known: Violations = [], unexpected: Violations = []
  for (const violation of raw) {
    const knownNodes: typeof violation.nodes = [], unexpectedNodes: typeof violation.nodes = []
    for (const node of violation.nodes) {
      // component defect, fixed by E4 — see docs/plan/handoff/S0-a11y-candidates
      // Resolve each raw axe selector to the actual owned node. Never suppress an
      // entire rule: a second node in the same violation remains unexpected.
      const approved = await page.evaluate(({ target, rule, context }) => {
        if (!["sap_horizon", "sap_horizon_hcb"].includes(context.theme)
          || document.documentElement.dataset.theme !== context.theme
          || target.length !== 1 || typeof target[0] !== "string") return false
        let matches: NodeListOf<Element>
        try { matches = document.querySelectorAll(target[0]) } catch { return false }
        if (matches.length !== 1) return false
        const actual = matches[0]
        const scope = document.querySelector(context.primary ? "[data-fiori-primary]" : "#storybook-root")
        if (!scope) return false
        const canvases = scope.querySelectorAll(`[data-fiori-story="${context.story}"]`)
        if (canvases.length !== 1) return false
        const canvas = canvases[0]
        const visible = (element: Element) => (element as HTMLElement).checkVisibility()
        const unique = (selector: string, root: ParentNode = canvas) => {
          const nodes = root.querySelectorAll(selector)
          return nodes.length === 1 ? nodes[0] : null
        }

        if (context.story === "forms-select--open" && !context.primary) {
          const trigger = unique('[data-slot="select-trigger"][role="combobox"][aria-expanded="true"][aria-label="Country"]')
          const list = unique('[data-slot="select-content"][role="listbox"][aria-label="Country choices"]', document)
          const popper = unique("[data-radix-popper-content-wrapper]", document)
          const viewport = list ? unique('[data-radix-select-viewport][role="presentation"]', list) : null
          const options = list ? [...list.querySelectorAll('[role="option"]')] : []
          const focusable = [...scope.querySelectorAll<HTMLElement>("*")].filter((element) =>
            element.tabIndex >= 0 && !(element as HTMLButtonElement).disabled && visible(element) && !element.closest("[inert]"))
          if (!trigger || !list || !popper || !visible(list) || !popper.contains(list)
            || scope.getAttribute("aria-hidden") !== "true" || focusable.length !== 1 || focusable[0] !== trigger) return false
          if (!viewport || options.length !== 4 || options.map((option) => option.textContent?.trim()).join("|") !== "Germany|France|China|United States (unavailable)"
            || [...popper.querySelectorAll("[role]")].some((element) => element !== list
              && element !== viewport && element.getAttribute("role") !== "group" && !options.includes(element))) return false
          if (rule === "aria-hidden-focus") return actual === scope
          if (rule === "landmark-one-main" || rule === "page-has-heading-one") return actual === document.documentElement
          return rule === "region" && actual === popper
        }

        if (rule === "label-content-name-mismatch") {
          const yearStory = context.story === "dates-calendar--year-picker" && !context.primary
          const customStory = context.story === "dates-calendar--custom-texts" && context.yearMode && !context.primary
          const controlStory = context.story === "dates-calendar--playground" && context.primary
            && context.control?.prop === "initialPicker" && context.control.choice === "year"
            && JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}").initialPicker === "year"
          if (!yearStory && !customStory && !controlStory) return false
          const range = unique('[data-slot="calendar-year-range-button"]')
          const grid = unique('[data-picker="year"][role="grid"]')
          if (!range || actual !== range || !visible(range) || !grid || !visible(grid)
            || range.getAttribute("role") !== "button" || range.getAttribute("aria-keyshortcuts") !== "Shift+F4") return false
          const years = [...grid.querySelectorAll('[role="gridcell"]')].filter(visible).map((cell) => cell.textContent?.trim())
          if (years.length !== 20 || years.some((year) => !/^\d{4}$/.test(year ?? ""))) return false
          const from = years[0], to = years.at(-1)
          const purpose = customStory ? `Delivery years from ${from} to ${to}` : `Year range from ${from} to ${to}`
          return range.textContent?.trim() === `${from} - ${to}` && range.getAttribute("aria-label") === purpose
            && range.getAttribute("title") === `${purpose} (Shift + F4)` && !range.hasAttribute("aria-labelledby")
        }

        if (context.story === "data-data-table--loading" && !context.primary && rule === "aria-required-children") {
          const grid = unique('.fiori-table__grid[role="grid"][aria-label="Products"][aria-busy="true"]')
          if (!grid || actual !== grid) return false
          const children = [...grid.children]
          const header = unique(':scope > [data-slot="table-header-row"][role="row"]', grid)
          const rows = unique(":scope > .fiori-table__rows[inert]", grid)
          const end = children.find((child) => child.getAttribute("aria-hidden") === "true")
          const loader = unique(':scope > .fiori-table__loading[data-slot="busy-indicator"][aria-busy="true"]', grid)
          const progress = unique('.fiori-table__loading [role="progressbar"][aria-label="Please wait"]', grid)
          if (!header || !rows || !end || !loader || !progress || children.length !== 4
            || children.some((child) => ![header, rows, end, loader].includes(child)) || end.children.length) return false
          const spacer = unique(":scope > .fiori-table__spacer", rows)
          if (!spacer || rows.children.length !== 1 || spacer.children.length !== 4
            || [...spacer.children].some((row) => row.getAttribute("role") !== "row" || row.getAttribute("data-slot") !== "table-row")) return false
          // The only role outside the valid row subtrees is the existing loader's
          // progressbar. A new invalid child inside this same grid fails too.
          return [...grid.querySelectorAll("[role]")].filter((element) =>
            !element.closest('[role="row"]')).every((element) => element === progress)
        }

        // S2
        // component defect, fixed by E4 — see docs/plan/handoff/S2-a11y-candidates
        if (rule === "color-contrast" && context.theme === "sap_horizon"
          && context.story === "data-object-number--inverted" && !context.primary) {
          const args = JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}")
          const number = unique('[data-slot="object-number"][data-state="positive"][data-inverted][data-emphasized]')
          const inner = number ? unique(':scope > .fiori-object-number__inner', number) : null
          const text = inner ? unique(':scope > .fiori-object-number__text', inner) : null
          const unit = inner ? unique(':scope > .fiori-object-number__unit', inner) : null
          if (!number || !inner || !text || !unit || (actual !== text && actual !== unit) || !visible(actual)
            || number.hasAttribute("data-large") || number.hasAttribute("data-active") || inner.children.length !== 2
            || args.state !== "positive" || args.inverted !== true || args.emphasized !== true
            || text.textContent !== "379.99" || unit.textContent !== "USD") return false
          const css = getComputedStyle(actual), badge = getComputedStyle(inner)
          // OpenUI5 Horizon ObjectNumber.less applies sapContent_ContrastTextShadow
          // here; the current port omits it. Only the reproduced 12px badge is known.
          return css.color === "rgb(255, 255, 255)" && css.fontSize === "12px" && css.fontWeight === "700"
            && css.textShadow === "none" && badge.backgroundColor === "rgb(48, 145, 76)"
        }
        if (rule === "scrollable-region-focusable" && context.story === "data-table--scroll-overflow" && !context.primary) {
          const table = unique('[data-slot="table"][data-overflow-mode="scroll"].max-w-xs')
          const grid = table ? unique(':scope > .fiori-table__grid[role="grid"][aria-label="Products"][aria-rowcount="5"][aria-colcount="3"]', table) : null
          if (!table || !grid || actual !== grid || !visible(grid) || grid.hasAttribute("aria-busy")
            || (grid as HTMLElement).scrollWidth <= (grid as HTMLElement).clientWidth || grid.hasAttribute("tabindex")) return false
          const sentinels = [...table.querySelectorAll(':scope > [data-table-sentinel][tabindex="0"]')]
          const header = unique(':scope > [data-slot="table-header-row"][role="row"][data-table-nav-row]', grid)
          const rows = [...grid.querySelectorAll('[data-slot="table-row"][role="row"][data-table-nav-row]')]
          const args = JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}")
          return args.selectionMode === "none" && args.overflowMode === "scroll" && args.loading === false
            && args.interactiveRows === false && args.withActions === false && args.groupRows === false
            && sentinels.length === 2 && sentinels.every((node) => !grid.contains(node))
            && header !== null && rows.length === 4 && rows.map((row) => row.getAttribute("data-row-key")).join("|") === "p1|p2|p3|p4"
            && !grid.querySelector('[tabindex], button, input, select, textarea, a[href], [contenteditable="true"]')
        }
        if (rule === "color-contrast" && context.theme === "sap_horizon"
          && (context.story === "data-object-status--indication-5" && !context.primary
            || context.story === "data-object-status--playground" && context.primary
              && context.control?.prop === "state" && context.control.choice === "indication5")) {
          const standalone = context.story === "data-object-status--indication-5" && !context.primary
          const args = JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}")
          const status = unique(':scope > [data-slot="object-status"][data-state="indication5"]')
          const text = status ? unique(':scope > .fiori-object-status__wrapper > .fiori-object-status__text', status) : null
          if (!status || !text || actual !== text || !visible(text) || args.state !== "indication5"
            || status.hasAttribute("data-inverted") || status.hasAttribute("data-large") || status.hasAttribute("data-active")
            || text.textContent !== (standalone ? "Delivery stage 5" : "Delivered")) return false
          const css = getComputedStyle(text), surface = getComputedStyle(canvas)
          // ObjectStatus.less uses this same SAP indication token and shadow. Only
          // the reproduced 14px Morning text on its mandated SAP canvas is known.
          return css.color === "rgb(0, 112, 242)" && css.fontSize === "14px" && css.fontWeight === "400"
            && css.textShadow === "rgb(255, 255, 255) 0px 0px 2px"
            && surface.backgroundColor === "rgb(245, 246, 247)"
        }
        // Foreign contexts fall through to later card blocks; only owning S2 checks return.
        const s2OpenStories = ["dates-time-picker--open", "dates-time-picker--open-negative", "dates-time-picker--open-critical", "dates-date-time-picker--open", "dates-date-time-picker--open-negative", "dates-time-picker--twenty-four-hour-clocks"]
        const s2PrimaryPicker = context.primary && ["dates-time-picker--playground", "dates-date-time-picker--playground"].includes(context.story)
          && JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}").open === true
        if (rule === "aria-allowed-role" && (s2OpenStories.includes(context.story) || s2PrimaryPicker)) {
          const clocks = unique('[data-slot="time-selection-clocks"]', document)
          const entity = actual.getAttribute("data-clock-button")
          if (!clocks || !visible(clocks) || !entity || !["hours", "minutes", "seconds"].includes(entity)
            || actual !== unique(`button[data-clock-button="${entity}"][data-slot="button"][role="spinbutton"]`, clocks)
            || !actual.closest(".fiori-time-picker-tsc-buttons") || !visible(actual)) return false
          const min = Number(actual.getAttribute("aria-valuemin")), max = Number(actual.getAttribute("aria-valuemax")), now = Number(actual.getAttribute("aria-valuenow"))
          const label = actual.getAttribute("aria-label")
          return !!label && Number.isFinite(now) && now >= min && now <= max
            && (entity === "hours" ? (min === 1 && max === 12 || min === 0 && max === 23) : min === 0 && max === 59)
            && actual.getAttribute("aria-valuetext") === `${now} ${label}`
        }
        if (context.story === "data-table--loading" && !context.primary && rule === "aria-required-children") {
          const grid = unique('.fiori-table__grid[role="grid"][aria-label="Products"][aria-busy="true"]')
          if (!grid || actual !== grid) return false
          const children = [...grid.children]
          const header = unique(':scope > [data-slot="table-header-row"][role="row"]', grid)
          const rows = unique(":scope > .fiori-table__rows[inert]", grid)
          const end = children.find((child) => child.getAttribute("aria-hidden") === "true")
          const loader = unique(':scope > .fiori-table__loading[data-slot="busy-indicator"][aria-busy="true"]', grid)
          const progress = unique('.fiori-table__loading [role="progressbar"][aria-label="Please wait"]', grid)
          if (!header || !rows || !end || !loader || !progress || children.length !== 4
            || children.some((child) => ![header, rows, end, loader].includes(child)) || end.children.length) return false
          const spacer = unique(":scope > .fiori-table__spacer", rows)
          if (!spacer || rows.children.length !== 1 || spacer.children.length !== 4
            || [...spacer.children].some((row) => row.getAttribute("role") !== "row" || row.getAttribute("data-slot") !== "table-row")) return false
          return [...grid.querySelectorAll("[role]")].filter((element) => !element.closest('[role="row"]')).every((element) => element === progress)
        }
        const s2TimelineStories = ["data-timeline--playground", "data-timeline--vertical", "data-timeline--vertical-mixed-icons", "data-timeline--none", "data-timeline--negative", "data-timeline--critical", "data-timeline--positive", "data-timeline--information", "data-timeline--growing-button", "data-timeline--growing-scroll", "data-timeline--grouped", "data-timeline--collapsed-group", "data-timeline--horizontal", "data-timeline--horizontal-mixed-icons", "data-timeline--horizontal-growing", "data-timeline--horizontal-group", "data-timeline--horizontal-collapsed-group", "data-timeline--loading", "data-timeline--with-header", "data-timeline--custom-texts", "data-timeline--rtl"]
        if (rule === "aria-required-children" && s2TimelineStories.includes(context.story)
          && (!context.primary || context.story === "data-timeline--playground")) {
          const list = unique('.fiori-timeline__list[aria-live="polite"]')
          if (!list || actual !== list || !["list", "tree"].includes(list.getAttribute("role") ?? "") || !visible(list)) return false
          const images = [...list.querySelectorAll('.fiori-tli__icon-outer > [role="img"]')].filter(visible)
          if (!images.length || images.some((image) => {
            const item = image.closest('[data-slot="timeline-item"]')
            const bubble = item ? unique('.fiori-tli__bubble[data-timeline-nav][role="listitem"], .fiori-tli__bubble[data-timeline-nav][role="treeitem"]', item) : null
            const name = image.getAttribute("aria-label")
            return !name || !bubble || !(bubble.getAttribute("aria-label") ?? bubble.getAttribute("aria-description") ?? "").includes(name)
          })) return false
          // Only existing tooltip images outside the valid item subtrees are approved.
          return [...list.querySelectorAll("[role]")].filter((element) => visible(element) && !element.closest('[role="listitem"], [role="treeitem"]')).every((element) => images.includes(element))
        }
        return false
      }, { target: node.target, rule: violation.id, context })
      ;(approved ? knownNodes : unexpectedNodes).push(node)
    }
    if (knownNodes.length) known.push({ ...violation, nodes: knownNodes })
    if (unexpectedNodes.length) unexpected.push({ ...violation, nodes: unexpectedNodes })
  }
  return { raw, known, unexpected, context }
}

export async function attachAudit(testInfo: TestInfo, name: string, result: Awaited<ReturnType<typeof classifyViolations>>) {
  await testInfo.attach(`${name}-raw.json`, { body: JSON.stringify(result.raw, null, 2), contentType: "application/json" })
  if (result.known.length) await attachKnown(testInfo, name, { context: result.context, violations: result.known })
}

export async function attachKnown(testInfo: TestInfo, name: string, record: unknown) {
  testInfo.annotations.push({ type: "component defect", description: componentDefect })
  await testInfo.attach(`${name}-known-component-defects.json`, {
    body: JSON.stringify({ comment: componentDefect, records: record }, null, 2), contentType: "application/json",
  })
}
