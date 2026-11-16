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

        // S1
        // component defect, fixed by E4 — see docs/plan/handoff/S1-a11y-candidates
        // TextArea.css.js colors counter text with field-border state tokens.
        // Only these two existing counters on the Morning application surface
        // fail contrast. Foreign stories/rules fall through to their own blocks.
        if (!context.primary && context.theme === "sap_horizon" && rule === "color-contrast"
          && ["forms-textarea--negative-counter", "forms-textarea--custom-texts"].includes(context.story)) {
          const negative = context.story === "forms-textarea--negative-counter"
          const state = negative ? "negative" : "critical"
          const root = unique(`[data-slot="textarea"][data-counter][data-value-state="${state}"]`)
          const field = root ? unique('textarea[aria-label="Delivery notes"]', root) : null
          const counter = root ? unique(':scope > .fiori-textarea__counter', root) : null
          const args = JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}")
          if (!root || !field || !counter || actual !== counter || !visible(counter) || counter.children.length
            || root.hasAttribute("data-disabled") || root.hasAttribute("data-readonly") || counter.hasAttribute("data-hidden")
            || args.counterMode !== "always" || args.valueState !== state || args.maxLength !== (negative ? 40 : 80)
            || args.value !== "Deliver to the receiving desk." || !counter.id.endsWith("-counter")
            || !field.getAttribute("aria-describedby")?.split(" ").includes(counter.id)
            || counter.textContent !== (negative ? "10 characters left" : "50 characters available for the note")) return false
          const rgb = (token: string) => {
            const hex = getComputedStyle(root).getPropertyValue(token).trim().replace(/^#/, "")
            if (!/^[0-9a-f]{6}$/i.test(hex)) return null
            return `rgb(${[0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(", ")})`
          }
          return getComputedStyle(counter).color === rgb(negative ? "--sapField_InvalidColor" : "--sapField_WarningColor")
            && getComputedStyle(canvas).backgroundColor === rgb("--sapBackgroundColor")
        }
        // MultiComboBoxItem.js/checkBoxAccInfo uses role=presentation. The current
        // React component instead nests its hidden button/checkbox in each option.
        // Match only this exact indicator in the four authored open-list stories.
        if (!context.primary && rule === "nested-interactive" && [
          "forms-multi-combobox--open", "forms-multi-combobox--item-groups",
          "forms-multi-combobox--select-all", "forms-multi-combobox--grouped-select-all",
        ].includes(context.story)) {
          const field = unique('[data-slot="multi-combobox"] input[role="combobox"][aria-label="Delivery countries"][aria-expanded="true"]')
          const popup = unique('[data-slot="multi-combobox-popover"][role="dialog"][aria-label="Available Options"]', document)
          const list = popup?.querySelector('[role="listbox"][aria-label="Available Options"]')
          const options = list ? [...list.querySelectorAll(':scope > [role="option"], :scope > [data-slot="multi-combobox-item-group"] > [role="option"]')] : []
          if (!field || !popup || !visible(popup) || !list || options.length !== 6
            || options.map((option) => option.querySelector('.fiori-multi-combobox__item-text')?.textContent?.trim()).join("|") !== "Argentina|Brazil|Canada|Denmark|Estonia|France"
            || !options.includes(actual)) return false
          const indicator = actual.querySelector(':scope > button[data-slot="checkbox"][role="checkbox"][aria-hidden="true"][tabindex="-1"]')
          const text = actual.querySelector(':scope > .fiori-multi-combobox__item-text')
          const additional = actual.querySelector(':scope > .fiori-multi-combobox__item-additional')
          if (!indicator || !text || !additional || (indicator as HTMLButtonElement).disabled
            || actual.children.length !== 3 || actual.querySelectorAll('button,[role="checkbox"]').length !== 1
            || indicator.getAttribute('aria-checked') !== actual.getAttribute('aria-selected')) return false
          return indicator.classList.contains('fiori-multi-combobox__checkbox')
            && actual.classList.contains('fiori-multi-combobox__item')
            && [...actual.querySelectorAll('[tabindex]')].every((element) => element === indicator)
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

// S1
// component defect, fixed by E4 — see docs/plan/handoff/S1-a11y-candidates
// S0's generated focus tests cover pilots only. The S1 supplemental focus audit
// calls this exact story/target/pointer-state classifier; it never changes axe.
// UI5 TextArea/ComboBox/MultiComboBox/MultiInput/FileUploader and NumericInput
// CSS paint pointer focus too; Token.css.js also does so on desktop. Input
// compositions below inherit the separately documented S0 Input candidate.
export async function classifyS1PointerFocus(page: Page, context: { story: string; theme: string; phase: string }) {
  return page.evaluate(({ story, theme, phase }) => {
    if (phase !== "pointer" || !["sap_horizon", "sap_horizon_hcb"].includes(theme)
      || document.documentElement.dataset.theme !== theme) return false
    const selectors: Record<string, string> = {
      "forms-textarea--playground": '[data-slot="textarea"] textarea[aria-label="Delivery notes"]',
      "forms-step-input--playground": '[data-slot="step-input"] input[role="spinbutton"][aria-label="Order quantity"][aria-valuenow="5"]',
      "forms-combobox--playground": '[data-slot="combobox"] input[role="combobox"][aria-label="Delivery country"][aria-expanded="false"]',
      "forms-multi-combobox--playground": '[data-slot="multi-combobox"] input[role="combobox"][aria-label="Delivery countries"][aria-expanded="false"]',
      "forms-multi-input--playground": '[data-slot="multi-input"] input[role="combobox"][aria-label="Delivery countries"][aria-roledescription="Multi Value Input"][aria-expanded="false"]',
      "forms-file-uploader--playground": '[data-slot="file-uploader"] input[type="file"][aria-label="Purchase order attachment"][aria-roledescription="File Uploader"]',
      "forms-form--edit": '[data-slot="form"] input[id$="-company"][value="Northwind Traders"]',
      "forms-label--playground": '.fiori-field input[placeholder="Enter the company name"]',
      "forms-token--playground": '[role="listbox"][aria-label="Delivery countries"] > [data-slot="token"][role="option"][aria-selected="false"]',
      "forms-tokenizer--playground": '[data-slot="tokenizer"] [role="listbox"][aria-label="Delivery countries"] [data-slot="token"][role="option"][data-value="Argentina"][aria-selected="false"]',
    }
    const selector = selectors[story]
    if (!selector) return false
    const canvases = document.querySelectorAll(`#storybook-root [data-fiori-story="${story}"]`)
    if (canvases.length !== 1) return false
    const nodes = canvases[0].querySelectorAll<HTMLElement>(selector)
    if (nodes.length !== 1 || nodes[0] !== document.activeElement || !nodes[0].checkVisibility()) return false
    const node = nodes[0]
    if ((node as HTMLInputElement).disabled || node.getAttribute("aria-disabled") === "true") return false
    if (story === "forms-token--playground" && node.querySelector('.fiori-token__text')?.textContent !== "Germany") return false
    const textarea = node.closest('.fiori-textarea')
    const owner = textarea?.querySelector('.fiori-textarea__wrapper') ?? node.closest('.fiori-field') ?? node
    if (owner.hasAttribute("data-pointer-focus") || owner.hasAttribute("data-value-state") || owner.hasAttribute("data-readonly")) return false
    const css = getComputedStyle(owner), after = getComputedStyle(owner, "::after")
    return (css.outlineStyle !== "none" && Number.parseFloat(css.outlineWidth) > 0)
      || (!["none", "normal"].includes(after.content) && after.display !== "none" && after.visibility !== "hidden"
        && after.borderTopStyle !== "none" && Number.parseFloat(after.borderTopWidth) > 0)
  }, context)
}
