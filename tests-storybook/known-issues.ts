import { type Locator, type Page, type TestInfo } from "@playwright/test"
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

        // S4
        // component defect, fixed by E4 — see docs/plan/handoff/S4-a11y-candidates
        // Paired ordinary React/UI5 fixtures and standalone blocks are recorded
        // in fifth-20261119/classification-oracles.json and classification-extra.json.
        // These are exact owned nodes in explicit stories, never rule-wide waivers.
        if (!context.primary) {
          if (rule === "aria-allowed-role" && ["navigation-search--open", "navigation-search--suggestions-loading"].includes(context.story)) {
            // UI5 SearchItemGroup.js uses ListBoxItemGroupTemplate's UL role=group.
            // The React host is an LI with the same role, which HTML does not allow.
            const group = unique('[data-slot="search-item-group"].fiori-search-group', document)
            const list = unique('.fiori-search__list[role="listbox"]', document)
            const label = group?.getAttribute('aria-labelledby')
            const header = group?.querySelector(':scope > .fiori-search-group__header')
            const items = group?.querySelector(':scope > ul[role="none"].fiori-search__list')
            return actual === group && group?.tagName === 'LI' && group.getAttribute('role') === 'group'
              && visible(group) && !!list && list.contains(group) && !!header && !!items
              && group.children.length === 2 && !!label && header.id === label && header.textContent?.trim() === 'Products'
              && items.children.length === 1 && items.firstElementChild?.matches('[data-slot="search-item"][role="option"]') === true
              && items.textContent?.trim() === 'Laptop bag'
          }
          if (rule === "nested-interactive" && context.story === "navigation-search--deletable-suggestion") {
            // SearchItemTemplate.js similarly nests its delete Button in role=option
            // when hover/focus makes that Button visible. Preserve both in the candidate.
            const list = unique('.fiori-search__list[role="listbox"]', document)
            const item = list ? unique('[data-slot="search-item"].fiori-search-item[role="option"]', list) : null
            const remove = item ? unique('button[data-slot="button"][aria-label="Remove Suggestion"]', item) : null
            return actual === item && !!item && visible(item) && item.tagName === 'LI'
              && item.getAttribute('tabindex') === '-1' && !!remove && visible(remove)
              && remove.getAttribute('tabindex') === '-1' && item.querySelectorAll('button,a,input,select,textarea,[tabindex]').length === 1
              && item.querySelector('.fiori-search-item__text')?.textContent === 'Laptop'
              && remove.querySelector('[data-slot="icon"]') !== null
          }
          if (rule === "nested-interactive" && context.story === "navigation-notification-list--growing-button-loading") {
            // NotificationListGroupList/ListTemplate nest the inline BusyIndicator
            // inside the load-more role=button; installed UI5 reproduces the same defect.
            const group = unique('[data-slot="notification-list-group-item"][data-growing="button"][data-loading]')
            const more = group ? unique('[data-nli-growing][role="button"]', group) : null
            const busy = more ? unique('.fiori-nli-group__growing-busy[data-slot="busy-indicator"][data-busy]', more) : null
            const progress = busy ? unique('[role="progressbar"][tabindex="0"][aria-label="Please wait"]', busy) : null
            const label = more?.getAttribute('aria-labelledby')
            return actual === more && !!more && visible(more) && more.getAttribute('tabindex') === '0'
              && !!busy && !!progress && visible(progress) && !!label
              && more.children.length === 2 && more.querySelectorAll('button,a,input,select,textarea,[tabindex]').length === 1
              && more.querySelector('.fiori-list__growing-text')?.id === label
              && document.getElementById(label)?.textContent === 'More'
          }
          if (rule === "label-content-name-mismatch" && ["navigation-side-navigation--flat", "navigation-side-navigation--parent-selected"].includes(context.story)) {
            // SideNavigationItemTemplate labels only the text and describes the tag;
            // React and UI5 both omit the visible New tag from the default name.
            const items = [...canvas.querySelectorAll('[data-slot="side-navigation-item"][role="treeitem"]')]
            const products = items.filter(node => node.querySelector('.fiori-sn-item__text')?.textContent === 'Products')
            const item = products.length === 1 ? products[0] : null
            const text = item?.querySelector(':scope > .fiori-sn-item__text')
            const tag = item?.querySelector(':scope > .fiori-sn-item__tag')
            // Tag owns a decorative icon, its hidden type text and visible label.
            // The browser AX name is Products; its description is Tag New.
            const badge = tag?.querySelector(':scope > [data-slot="tag"][data-design="neutral"][data-size="S"]')
            const icon = badge?.querySelector(':scope > svg[data-slot="icon"][aria-hidden="true"][focusable="false"]')
            const kind = badge?.querySelector(':scope > span.sr-only')
            const label = badge?.querySelector(':scope > span.fiori-tag__text')
            return actual === item && !!item && visible(item) && item.getAttribute('data-level') === '1'
              && !!text && !!tag && item.getAttribute('aria-labelledby') === text.id
              && item.getAttribute('aria-describedby') === tag.id && !item.hasAttribute('aria-label')
              && tag.children.length === 1 && tag.firstElementChild === badge && !!badge && badge.children.length === 3
              && !!icon && !!kind && kind.children.length === 0 && kind.textContent === 'Tag'
              && !!label && label.children.length === 0 && label.textContent === 'New' && badge.textContent === 'TagNew'
              && badge.querySelector('button,a,input,select,textarea,[tabindex],[role]') === null
              && item.querySelectorAll('.fiori-sn-item__tag').length === 1
          }
          if (["aria-required-children", "region"].includes(rule) && context.story === "navigation-side-navigation--open") {
            // React puts tabbable boundary dummies inside role=menu. UI5's
            // ListTemplate puts its dummies outside the menu UL; its own
            // aria-required-children finding concerns role=none item hosts.
            const trigger = unique('[data-slot="side-navigation-overflow"][role="menuitem"][aria-expanded="true"]')
            const menu = unique('[data-sn-overflow-menu][data-slot="menu-content"][role="menu"][aria-label="Additional Navigation Items"]', document)
            // Axe also targets this menu's sole Radix positioning wrapper for
            // region: its focusable role=none dummies are outside landmark content.
            // Approve the wrapper only with the exact same owned menu structure.
            const popper = unique('[data-radix-popper-content-wrapper]', document)
            const boundaries = menu ? [...menu.querySelectorAll('[data-sn-focus-boundary]')] : []
            const rows = menu ? [...menu.querySelectorAll('[data-sn-menu-row][role="menuitem"]')] : []
            if (actual !== (rule === 'region' ? popper : menu) || !menu || !trigger || !visible(menu) || menu.getAttribute('aria-orientation') !== 'vertical'
              || !menu.id || trigger.getAttribute('aria-controls') !== menu.id
              || !popper || popper.children.length !== 1 || popper.firstElementChild !== menu
              || boundaries.length !== 2 || rows.length === 0
              || boundaries.some(node => node.getAttribute('role') !== 'none' || node.getAttribute('tabindex') !== '0' || node.children.length !== 0 || node.textContent !== '')) return false
            return [...menu.querySelectorAll('button,a,input,select,textarea,[tabindex]')].every(node => boundaries.includes(node) || rows.includes(node))
              && [...menu.querySelectorAll('[role]')].every(node => boundaries.includes(node) || rows.includes(node) || node.matches('[data-slot="menu-group"][role="group"]'))
          }
          if (rule === "empty-heading" && context.story === "navigation-variant-management--empty-list") {
            // OpenUI5 VariantManagement also emits its H2 Title with no selected
            // text. The candidate keeps the trigger but omits an empty heading host.
            const root = unique('[data-slot="variant-management"]')
            const heading = root ? unique('.fiori-vm-title[data-slot="title"]', root) : null
            // Title.tsx / UI5 TitleTemplate.js titleInner own exactly this empty
            // truncation span. A foreign element or any added text is not approved.
            const inner = heading?.querySelector(':scope > span.relative.inline-block.max-w-full.overflow-hidden.text-ellipsis')
            const trigger = root ? unique('.fiori-vm-trigger', root) : null
            const arrow = trigger ? unique('button.fiori-vm-arrow[aria-label="View ."]', trigger) : null
            // The preview serializes only scalar args, so items=[] is absent.
            // Verify the actual empty list body instead of an unavailable array.
            const surface = unique('.fiori-vm-list', document)
            const body = surface ? unique('.fiori-vm-list-body', surface) : null
            const empty = body ? unique('.fiori-vm-empty[data-slot="illustrated-message"]', body) : null
            return actual === heading && !!heading && visible(heading) && heading.tagName === 'H2'
              && heading.childNodes.length === 1 && heading.firstChild === inner && !!inner && inner.childNodes.length === 0
              && inner.getAttributeNames().length === 1 && inner.hasAttribute('class')
              && heading.textContent === '' && !!trigger && trigger.contains(heading) && !!arrow
              && JSON.parse(canvas.getAttribute('data-fiori-args') ?? '{}').selectedKey === ''
              && JSON.parse(canvas.getAttribute('data-fiori-args') ?? '{}').defaultOpen === 'list'
              && !!body && !!empty && body.children.length === 1 && body.firstElementChild === empty
              && body.querySelector('[role="option"],[role="listbox"]') === null
          }
          const reportStory = ['floorplans-list-report--playground', 'floorplans-list-report--rtl'].includes(context.story)
          const objectStory = ['floorplans-object-page--playground', 'floorplans-object-page--rtl'].includes(context.story)
          if ((reportStory || objectStory) && rule === "landmark-banner-is-top-level") {
            // The real blocks assign root=main but leave DynamicPage's default
            // header=banner. UI5's same accessibilityAttributes produce this nesting.
            const owner = unique(reportStory ? '#list-report[data-slot="dynamic-page"]' : '#object-page-block[data-slot="dynamic-page"]')
            const main = owner ? unique('.fiori-dynamic-page__root[role="main"]', owner) : null
            const header = main ? unique('.fiori-dynamic-page__title-header[role="banner"]', main) : null
            return actual === header && !!header && visible(header) && !!main
              && main.getAttribute('aria-label') === (reportStory ? 'Manage Products' : 'Sales Order')
              && header.getAttribute('aria-label') === 'Header Expanded' && header.closest('[role="main"]') === main
          }
          if (objectStory && rule === "landmark-unique") {
            // ObjectPage's section and the default block's grouped Form each own
            // a region named General Information; the block repeats that name.
            const owner = unique('#object-page-block[data-slot="dynamic-page"]')
            const section = owner ? unique('section[data-slot="object-page-section"][data-section="general"][aria-labelledby]', owner) : null
            const form = section ? unique('.fiori-form__root[role="region"][aria-label="General Information"]', section) : null
            const label = section?.getAttribute('aria-labelledby')
            const named = [...document.querySelectorAll('[role="region"],section[aria-label],section[aria-labelledby]')].filter(node => visible(node)
              && (node.getAttribute('aria-label') ?? (node.getAttribute('aria-labelledby') ?? '').split(' ').map(id => document.getElementById(id)?.textContent ?? '').join(' ')).trim() === 'General Information')
            return actual === section && !!section && !!form && !!label
              && document.getElementById(label)?.textContent === 'General Information'
              && named.length === 2 && named.includes(section) && named.includes(form)
          }
        }
        // component defect, fixed by E4 — see docs/plan/handoff/S4-a11y-candidates
        // FlexibleColumnLayoutTemplate.js nests arrowStart's Button under its
        // role=separator. The docs demo and real UI5 2.28 instance both
        // reproduce nested-interactive. Approve only this existing semantic host,
        // with its one owned arrow. End-expanded layouts hide the grip and omit
        // resize ARIA/tabindex; axe still treats the separator role as interactive.
        // Arrowless/hidden separators need no marker; other nodes remain failures.
        if (rule === "nested-interactive" && [
          "layout-flexible-column-layout--playground", "layout-flexible-column-layout--one-column",
          "layout-flexible-column-layout--two-columns-start-expanded", "layout-flexible-column-layout--two-columns-mid-expanded",
          "layout-flexible-column-layout--three-columns-mid-expanded", "layout-flexible-column-layout--three-columns-end-expanded",
          "layout-flexible-column-layout--three-columns-start-expanded-end-hidden", "layout-flexible-column-layout--three-columns-mid-expanded-end-hidden",
          "layout-flexible-column-layout--three-columns-start-hidden-mid-expanded", "layout-flexible-column-layout--three-columns-start-hidden-end-expanded",
          "layout-flexible-column-layout--mid-column-full-screen", "layout-flexible-column-layout--end-column-full-screen",
          "layout-flexible-column-layout--tablet", "layout-flexible-column-layout--phone",
          "layout-flexible-column-layout--disable-resizing", "layout-flexible-column-layout--custom-texts",
          "layout-flexible-column-layout--rtl", "layout-flexible-column-layout--hook-navigation",
          "floorplans-master-detail--playground", "floorplans-master-detail--rtl",
        ].includes(context.story)) {
          const root = unique('[data-slot="flexible-column-layout"]')
          const separator = root?.querySelector('[data-slot="flexible-column-layout-start-separator"][role="separator"]')
          const arrow = separator?.querySelector(':scope > button[data-slot="button"].fiori-fcl__arrow')
          const grip = separator?.querySelector(':scope > .fiori-fcl__grip')
          if (!root || !separator || actual !== separator || !arrow || !grip
            || !visible(separator) || !visible(arrow) || root.getAttribute('data-media') !== 'desktop'
            || separator.getAttribute('aria-orientation') !== 'vertical'
            || separator.children.length !== 2
            || (arrow as HTMLButtonElement).disabled || (arrow as HTMLButtonElement).tabIndex !== 0
            || separator.querySelectorAll('button,[tabindex]').length !== 1) return false
          const layout = root.getAttribute('data-layout')
          if (!['ThreeColumnsMidExpanded', 'ThreeColumnsEndExpanded',
            'ThreeColumnsStartHiddenMidExpanded', 'ThreeColumnsStartHiddenEndExpanded'].includes(layout ?? '')) return false
          const resizable = layout === 'ThreeColumnsMidExpanded' || layout === 'ThreeColumnsStartHiddenMidExpanded'
          if (visible(grip) !== resizable) return false
          if (resizable) {
            const value = separator.getAttribute('aria-valuenow')
            if (separator.getAttribute('tabindex') !== '0' || value === null || !Number.isFinite(Number(value))) return false
          } else if (separator.hasAttribute('tabindex') || separator.hasAttribute('aria-valuenow')) return false
          const custom = context.story === 'layout-flexible-column-layout--custom-texts'
          if (separator.getAttribute('aria-label') !== (custom ? 'Resize orders and detail' : resizable ? 'Resize between start and mid columns' : null)
            || arrow.getAttribute('aria-label') !== (custom ? 'Show or hide purchase orders' : 'Switch between start and middle column layouts')) return false
          if (context.primary) {
            const args = JSON.parse(canvas.getAttribute('data-fiori-args') ?? '{}')
            if (context.story !== 'layout-flexible-column-layout--playground' || context.control?.prop !== 'layout'
              || args.layout !== context.control.choice || root.getAttribute('data-layout') !== context.control.choice) return false
          }
          return true
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
        // S3 Playground is a separate approved context; never relax the six
        // existing stories' primary/foreign guards above or below this branch.
        if (context.story === "overlays-view-settings-dialog--playground" && rule === "aria-input-field-name") {
          const scopes = document.querySelectorAll(context.primary ? "#storybook-docs [data-fiori-primary]" : "#storybook-root")
          if (scopes.length !== 1 || scopes[0] !== scope
            || (context.primary ? canvas.closest("[data-fiori-primary]") !== scope : !!canvas.closest("[data-fiori-primary]"))
            || JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}").open !== true) return false
          const opener = unique('[data-slot="dialog-trigger"][aria-haspopup="dialog"][aria-expanded="true"][data-state="open"]')
          const dialog = unique('.fiori-vsd[data-slot="dialog-content"][role="dialog"]', document)
          const title = dialog ? unique('[data-slot="dialog-title"]', dialog) : null
          if (!opener || opener.textContent?.trim() !== "Configure product view" || !visible(opener)
            || !dialog || dialog.parentElement !== document.body || dialog.getAttribute("data-state") !== "open"
            || !opener.getAttribute("aria-controls") || opener.getAttribute("aria-controls") !== dialog.id
            || !title || !title.id || dialog.getAttribute("aria-labelledby") !== title.id || title.textContent?.trim() !== "View Settings") return false
          const list = unique('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]', dialog)
          const options = list ? [...list.querySelectorAll('[data-slot="segmented-button-item"][role="option"]')] : []
          return visible(dialog) && actual === list && !!list && visible(list)
            && !list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby") && !list.hasAttribute("title")
            && list.getAttribute("aria-orientation") === "horizontal" && list.getAttribute("aria-multiselectable") === "false"
            && list.getAttribute("tabindex") === "0" && options.map((option) => option.getAttribute("aria-label")).join("|") === "Sort|Filter|Group"
            && options.length === 3 && options.every((option) => option.hasAttribute("aria-selected"))
        }
        const s3ViewSettingsStories = ["open", "sort-filter-and-group", "descending", "reset-enabled", "custom-texts", "rtl"]
        if (!context.primary && s3ViewSettingsStories.some((name) => context.story === `overlays-view-settings-dialog--${name}`) && rule === "aria-input-field-name") {
          // The owned Radix trigger links this canvas to its body portal by id.
          // A matching listbox in an unrelated dialog is never this exception.
          const opener = unique('[data-slot="dialog-trigger"][aria-haspopup="dialog"][aria-expanded="true"][data-state="open"]')
          const dialog = unique('.fiori-vsd[data-slot="dialog-content"][role="dialog"]', document)
          const title = dialog ? unique('[data-slot="dialog-title"]', dialog) : null
          const expectedTitle = context.story.endsWith("--custom-texts") ? "Product view" : "View Settings"
          if (!opener || opener.textContent?.trim() !== "Configure product view" || !visible(opener)
            || !dialog || dialog.parentElement !== document.body || dialog.getAttribute("data-state") !== "open"
            || !opener.getAttribute("aria-controls") || opener.getAttribute("aria-controls") !== dialog.id
            || !title || !title.id || dialog.getAttribute("aria-labelledby") !== title.id || title.textContent?.trim() !== expectedTitle) return false
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

// S3
// component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
// Owner: P4. The owner-approved third attempt extends this exact component-node
// marker to the independent name assertion. Keep S0/S1 and the axe classifier
// unchanged; a Locator supplies the actual checked node, never a caller selector.
export const s3ComponentDefect = "component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates"
// S3
// component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
// P5: the ordinary action-link demo has the same missing default role. UI5
// LinkTemplate.js always emits effectiveAccRole, even when href is absent.
export async function classifyS3NoHrefActionLink(control: Locator, context: AuditContext) {
  if (context.primary || !["display-link--playground", "display-link--rtl"].includes(context.story) || !["sap_horizon", "sap_horizon_hcb"].includes(context.theme)) return false
  return control.evaluate((actual, context) => {
    if (document.documentElement.dataset.theme !== context.theme) return false
    const scope = document.querySelector(context.primary ? "#storybook-docs [data-fiori-primary]" : "#storybook-root")
    const canvases = scope?.querySelectorAll('[data-fiori-story="' + context.story + '"]')
    if (canvases?.length !== 1) return false
    const links = canvases[0].querySelectorAll('a[data-slot="link"].fiori-link')
    return links.length === 1 && links[0] === actual && (actual as HTMLElement).checkVisibility()
      && !actual.hasAttribute("href") && !actual.hasAttribute("role")
      && actual.getAttribute("tabindex") === "0" && !actual.hasAttribute("aria-disabled")
      && actual.querySelector(':scope > .fiori-link__text')?.textContent?.trim() === "View purchase order"
      && !actual.hasAttribute("aria-label") && !actual.hasAttribute("aria-labelledby")
  }, context)
}
export async function classifyS3UnnamedModeControl(control: Locator, context: AuditContext) {
  if (context.story === "overlays-view-settings-dialog--playground") return classifyS3UnnamedPlaygroundModeControl(control, context)
  return control.evaluate((actual, context) => {
    const stories = ["open", "sort-filter-and-group", "descending", "reset-enabled", "custom-texts", "rtl"]
    if (context.primary || !stories.some((name) => context.story === `overlays-view-settings-dialog--${name}`)
      || !["sap_horizon", "sap_horizon_hcb"].includes(context.theme)
      || document.documentElement.dataset.theme !== context.theme) return false
    const canvases = document.querySelectorAll(`#storybook-root [data-fiori-story="${context.story}"]`)
    if (canvases.length !== 1) return false
    const canvas = canvases[0]
    const unique = (selector: string, root: ParentNode = canvas) => {
      const nodes = root.querySelectorAll(selector)
      return nodes.length === 1 ? nodes[0] : null
    }
    const visible = (element: Element) => (element as HTMLElement).checkVisibility()
    const opener = unique('[data-slot="dialog-trigger"][aria-haspopup="dialog"][aria-expanded="true"][data-state="open"]')
    const dialog = unique('.fiori-vsd[data-slot="dialog-content"][role="dialog"]', document)
    const title = dialog ? unique('[data-slot="dialog-title"]', dialog) : null
    const expectedTitle = context.story.endsWith("--custom-texts") ? "Product view" : "View Settings"
    if (!opener || opener.textContent?.trim() !== "Configure product view" || !visible(opener)
      || !dialog || dialog.parentElement !== document.body || dialog.getAttribute("data-state") !== "open"
      || !opener.getAttribute("aria-controls") || opener.getAttribute("aria-controls") !== dialog.id
      || !title || !title.id || dialog.getAttribute("aria-labelledby") !== title.id || title.textContent?.trim() !== expectedTitle) return false
    const list = unique('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]', dialog)
    const options = list ? [...list.querySelectorAll('[data-slot="segmented-button-item"][role="option"]')] : []
    const expected = context.story.endsWith("--descending") ? "Sort|Group" : "Sort|Filter|Group"
    return visible(dialog) && actual === list && !!list && visible(list)
      && !list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby") && !list.hasAttribute("title")
      && list.getAttribute("aria-orientation") === "horizontal" && list.getAttribute("aria-multiselectable") === "false"
      && list.getAttribute("tabindex") === "0" && options.map((option) => option.getAttribute("aria-label")).join("|") === expected
      && options.length === expected.split("|").length && options.every((option) => option.hasAttribute("aria-selected"))
  }, context)
}

// S3
// component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
// Playground gets its own exact open-state branch. Primary docs ownership does
// not apply to the six pre-existing story markers or to any other component.
async function classifyS3UnnamedPlaygroundModeControl(control: Locator, context: AuditContext) {
  return control.evaluate((actual, context) => {
    if (context.story !== "overlays-view-settings-dialog--playground"
      || !["sap_horizon", "sap_horizon_hcb"].includes(context.theme)
      || document.documentElement.dataset.theme !== context.theme) return false
    const scopes = document.querySelectorAll(context.primary ? "#storybook-docs [data-fiori-primary]" : "#storybook-root")
    if (scopes.length !== 1) return false
    const scope = scopes[0]
    const canvases = scope.querySelectorAll(`[data-fiori-story="${context.story}"]`)
    if (canvases.length !== 1) return false
    const canvas = canvases[0]
    if ((context.primary ? canvas.closest("[data-fiori-primary]") !== scope : !!canvas.closest("[data-fiori-primary]"))
      || JSON.parse(canvas.getAttribute("data-fiori-args") ?? "{}").open !== true) return false
    const unique = (selector: string, root: ParentNode = canvas) => {
      const nodes = root.querySelectorAll(selector)
      return nodes.length === 1 ? nodes[0] : null
    }
    const visible = (element: Element) => (element as HTMLElement).checkVisibility()
    const opener = unique('[data-slot="dialog-trigger"][aria-haspopup="dialog"][aria-expanded="true"][data-state="open"]')
    const dialog = unique('.fiori-vsd[data-slot="dialog-content"][role="dialog"]', document)
    const title = dialog ? unique('[data-slot="dialog-title"]', dialog) : null
    if (!opener || opener.textContent?.trim() !== "Configure product view" || !visible(opener)
      || !dialog || dialog.parentElement !== document.body || dialog.getAttribute("data-state") !== "open"
      || !opener.getAttribute("aria-controls") || opener.getAttribute("aria-controls") !== dialog.id
      || !title || !title.id || dialog.getAttribute("aria-labelledby") !== title.id || title.textContent?.trim() !== "View Settings") return false
    const list = unique('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]', dialog)
    const options = list ? [...list.querySelectorAll('[data-slot="segmented-button-item"][role="option"]')] : []
    return visible(dialog) && actual === list && !!list && visible(list)
      && !list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby") && !list.hasAttribute("title")
      && list.getAttribute("aria-orientation") === "horizontal" && list.getAttribute("aria-multiselectable") === "false"
      && list.getAttribute("tabindex") === "0" && options.map((option) => option.getAttribute("aria-label")).join("|") === "Sort|Filter|Group"
      && options.length === 3 && options.every((option) => option.hasAttribute("aria-selected"))
  }, context)
}
