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
        // S3
        // component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
        // Match only the enumerated story, rule and exact owned node. An added
        // popup, unnamed list or unrelated node remains an unexpected violation.
        const s3MenuStories = ["open", "plain", "icons-and-shortcuts", "single-selection", "single-selection-with-icons", "multiple-selection", "multiple-selection-with-icons", "single-disabled-submenu", "multiple-disabled-submenu", "rtl", "owner-rtl-with-ltr-opener", "owner-rtl-with-ltr-opener-ancestor", "owner-ltr-with-rtl-opener-ancestor", "explicit-ltr", "explicit-rtl"]
        if (!context.primary && s3MenuStories.some((name) => context.story === `overlays-menu--${name}`) && rule === "region") {
          const popper = unique("body > [data-radix-popper-content-wrapper]", document)
          const menu = popper ? unique('[data-slot="menu-content"][role="menu"][aria-label="Order actions"]', popper) : null
          const opener = unique('button[aria-haspopup="menu"][aria-expanded="true"]')
          const items = menu ? [...menu.querySelectorAll('[role^="menuitem"]')] : []
          return actual === popper && !!menu && !!opener && visible(menu)
            && opener.textContent?.trim() === "Order actions"
            && items.length === 5 && items.map((item) => item.textContent?.trim()).join("|") === "Edit|CopyCtrl+C|Paste|Share|Archive"
            && !!items[2].hasAttribute("data-disabled") && !!unique('[data-slot="menu-separator"]', menu)
            && !popper?.closest('[role="dialog"], main')
        }
        const s3ViewSettingsStories = ["open", "sort-filter-and-group", "descending", "reset-enabled", "custom-texts", "rtl"]
        if (!context.primary && s3ViewSettingsStories.some((name) => context.story === `overlays-view-settings-dialog--${name}`) && rule === "aria-input-field-name") {
          const dialog = unique('.fiori-vsd[data-slot="dialog-content"][role="dialog"]', document)
          const list = dialog ? unique('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]', dialog) : null
          const options = list ? [...list.querySelectorAll('[data-slot="segmented-button-item"][role="option"]')] : []
          const expected = context.story.endsWith("--descending") ? "Sort|Group" : "Sort|Filter|Group"
          return !!dialog && visible(dialog) && actual === list && !!list && visible(list)
            && !list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby")
            && list.getAttribute("aria-orientation") === "horizontal" && list.getAttribute("aria-multiselectable") === "false"
            && list.getAttribute("tabindex") === "0" && options.map((option) => option.getAttribute("aria-label")).join("|") === expected
            && options.length === expected.split("|").length && options.every((option) => option.hasAttribute("aria-selected"))
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
