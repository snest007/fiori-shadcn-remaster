import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"
import { buildHtmlContextFixture } from "./html-context-fixture"

const contextualRules = ["landmark-banner-is-top-level", "landmark-contentinfo-is-top-level"]

async function rawAudit(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready)
  const raw = await new AxeBuilder({ page }).analyze()
  await testInfo.attach(`${name}-axe-raw.json`, { body: JSON.stringify(raw, null, 2), contentType: "application/json" })
  return raw
}

test("native sectioning context retains header/footer semantics and explicit landmark roles", async ({ page }, testInfo) => {
  const cdp = await page.context().newCDPSession(page)
  for (const kind of ["native-main", "aria-main", "aria-main-section", "explicit-roles"]) {
    const contents = `<h1>Products</h1><header${kind === "explicit-roles" ? ' role="banner" aria-label="Explicit banner"' : ""}>Fruits</header><footer${kind === "explicit-roles" ? ' role="contentinfo" aria-label="Explicit footer"' : ""}>Fresh produce</footer>`
    const markup = kind === "native-main" ? `<main>${contents}</main>` : `<div role="main">${kind === "aria-main" ? contents : `<section>${contents}</section>`}</div>`
    await page.setContent(`<!doctype html><html lang="en"><title>Native HTML context</title><body>${markup}</body></html>`)
    const tree = await cdp.send("Accessibility.getFullAXTree")
    const roles = tree.nodes.filter((node) => !node.ignored).map((node) => node.role?.value)
    const raw = await rawAudit(page, testInfo, `native-${kind}`)
    const violations = raw.violations.filter((violation) => contextualRules.includes(violation.id))
    if (kind === "aria-main" || kind === "explicit-roles") expect(violations.map((violation) => violation.id)).toEqual(contextualRules)
    else expect(violations).toEqual([])
    await expect(page.getByRole("region")).toHaveCount(0)
    if (kind === "explicit-roles") {
      await expect(page.getByRole("banner", { name: "Explicit banner" })).toHaveCount(1)
      await expect(page.getByRole("contentinfo", { name: "Explicit footer" })).toHaveCount(1)
    } else {
      // Chromium honors role=main ancestry already. axe-core's native-header /
      // native-footer classification separately requires an HTML sectioning tag.
      expect(roles).toContain("sectionheader")
      expect(roles).toContain("sectionfooter")
      expect(roles).not.toContain("banner")
      expect(roles).not.toContain("contentinfo")
    }
  }
})

test("actual ordinary decorator gives List and Tree native headers/footers sectioning context", async ({ page }, testInfo) => {
  const fixture = await buildHtmlContextFixture(testInfo.workerIndex)
  for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
    for (const kind of ["list-header-footer", "list-empty", "tree-header-footer", "listbox"]) {
      await page.goto(`${fixture}?kind=${kind}&theme=${theme}&density=compact&dir=rtl`)
      const canvas = page.locator("[data-fiori-story]")
      const content = canvas.locator(":scope > section")
      await expect(content.locator("[data-slot]").first()).toBeAttached()
      await expect(canvas).toHaveJSProperty("tagName", "DIV")
      await expect(canvas).toHaveAttribute("role", "main")
      await expect(canvas).toHaveAttribute("data-theme", theme)
      await expect(canvas).toHaveAttribute("data-density", "compact")
      await expect(canvas).toHaveAttribute("dir", "rtl")
      await expect(page.getByRole("main")).toHaveCount(1)
      await expect(content).toHaveCount(1)
      expect(await content.evaluate((node) => node.attributes.length)).toBe(0)
      await expect(canvas.getByRole("region")).toHaveCount(0)
      await expect(canvas.getByRole("banner")).toHaveCount(0)
      await expect(canvas.getByRole("contentinfo")).toHaveCount(0)
      await expect(content.locator("header")).toHaveText(kind === "tree-header-footer" ? "Files" : kind === "list-empty" ? "Products" : "Fruits")
      const args = JSON.parse(await canvas.getAttribute("data-fiori-args") ?? "null")
      expect(args.headerText).toBe(kind === "tree-header-footer" ? "Files" : kind === "list-empty" ? "Products" : "Fruits")
      const cdp = await page.context().newCDPSession(page)
      const tree = await cdp.send("Accessibility.getFullAXTree")
      const roles = tree.nodes.filter((node) => !node.ignored).map((node) => node.role?.value)
      expect(roles).toContain("sectionheader")
      if (kind !== "list-empty") expect(roles).toContain("sectionfooter")
      const raw = await rawAudit(page, testInfo, `${kind}-${theme}`)
      expect(raw.violations).toEqual([])
      if (kind === "list-empty") {
        const empty = content.getByRole("listitem")
        await expect(empty).toHaveText("No products available")
        await empty.focus()
        await expect(empty).toBeFocused()
      } else if (kind === "tree-header-footer") {
        const docs = content.locator('[data-nav-key="docs"]')
        const reports = content.locator('[data-nav-key="reports"]')
        await expect(content.getByRole("tree", { name: "Files" })).toHaveAttribute("aria-multiselectable", "true")
        await expect(docs).toHaveAttribute("aria-expanded", "true")
        await expect(reports).toHaveAttribute("role", "treeitem")
        await expect(reports).toHaveAttribute("aria-level", "2")
        await expect(reports).toHaveAttribute("aria-selected", "true")
        await docs.focus()
        await expect(docs).toBeFocused()
        await page.keyboard.press("ArrowDown")
        await expect(reports).toBeFocused()
      } else {
        const first = content.locator('[data-nav-key="apples"]')
        const second = content.locator('[data-nav-key="bananas"]')
        await expect(first).toHaveAttribute("role", kind === "listbox" ? "option" : "listitem")
        if (kind === "listbox") {
          await expect(content.getByRole("listbox", { name: "Products" })).toHaveAttribute("aria-multiselectable", "true")
          await expect(second).toHaveAttribute("aria-selected", "true")
        } else await expect(content.getByRole("list", { name: "Products" })).toBeVisible()
        await first.focus()
        await expect(first).toBeFocused()
        await page.keyboard.press("ArrowDown")
        await expect(second).toBeFocused()
      }
    }
  }
})

test("ordinary section preserves explicit roles and opted-out page landmarks stay global", async ({ page }, testInfo) => {
  const fixture = await buildHtmlContextFixture(testInfo.workerIndex)
  await page.goto(`${fixture}?kind=explicit-roles`)
  const ordinary = page.locator("[data-fiori-story]")
  await expect(ordinary.getByRole("button", { name: "Save" })).toBeVisible()
  await expect(ordinary).toHaveAttribute("role", "main")
  await expect(ordinary.getByRole("banner", { name: "Explicit banner" })).toHaveCount(1)
  await expect(ordinary.getByRole("contentinfo", { name: "Explicit footer" })).toHaveCount(1)
  const raw = await rawAudit(page, testInfo, "explicit-landmarks-guard")
  expect(raw.violations.map((violation) => violation.id)).toEqual(contextualRules)
  await page.goto(`${fixture}?kind=owned-landmarks`)
  const owned = page.locator("[data-fiori-story]")
  await expect(owned.getByRole("button", { name: "Save" })).toBeVisible()
  await expect(owned).not.toHaveAttribute("role")
  await expect(owned.locator(":scope > section:not([aria-labelledby])")).toHaveCount(0)
  const heading = owned.getByRole("heading", { level: 1 })
  const headingRegion = owned.getByRole("region", { name: await heading.innerText(), exact: true })
  await expect(headingRegion.locator("main, [role=main]")).toHaveCount(0)
  await expect(owned.getByRole("main", { name: "Application content" })).toHaveCount(1)
  await expect(page.getByRole("main")).toHaveCount(1)
  await expect(owned.getByRole("banner")).toHaveCount(1)
  await expect(owned.getByRole("contentinfo")).toHaveCount(1)
  expect((await rawAudit(page, testInfo, "owned-global-landmarks")).violations).toEqual([])
})
