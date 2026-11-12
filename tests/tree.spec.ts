import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/tree`)
  await page.waitForSelector("html[data-ready=true]")
})

const tree = (page: Page) => page.locator("#tree-demo")
const node = (page: Page, name: string) => tree(page).getByRole("treeitem", { name, exact: true })

test("tree: tree/treeitem roles with level, set size, position, expanded and selected", async ({ page }) => {
  await expect(tree(page).getByRole("tree")).toHaveAttribute("aria-multiselectable", "true")
  const docs = node(page, "Documents")
  await expect(docs).toHaveAttribute("aria-level", "1")
  await expect(docs).toHaveAttribute("aria-posinset", "1")
  await expect(docs).toHaveAttribute("aria-setsize", "3")
  await expect(docs).toHaveAttribute("aria-expanded", "true")
  await expect(docs).toHaveAttribute("aria-selected", "false")
  const invoices = node(page, "Invoices")
  await expect(invoices).toHaveAttribute("aria-level", "2")
  await expect(invoices).toHaveAttribute("aria-posinset", "2")
  await expect(invoices).toHaveAttribute("aria-setsize", "2")
  await expect(invoices).toHaveAttribute("aria-expanded", "false")
  await expect(tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB" })).not.toHaveAttribute("aria-expanded", /.*/)
  await expect(node(page, "Pictures")).toHaveAttribute("aria-expanded", "false") // hasChildren (lazy)
  // The subtree is a role=group owned by the item (aria-owns), as in UI5.
  const owns = await docs.getAttribute("aria-owns")
  await expect(tree(page).locator(`[id="${owns}"]`)).toHaveAttribute("role", "group")
  await expect(node(page, "Reports")).toHaveAttribute("aria-level", "2")
})

test("tree: → expands then moves to the first child, ← moves to the parent then collapses", async ({ page }) => {
  await node(page, "Documents").focus()
  await page.keyboard.press("ArrowDown")
  await expect(node(page, "Reports")).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(node(page, "Reports")).toHaveAttribute("aria-expanded", "true")
  await expect(node(page, "Q1.pdf")).toBeVisible()
  await page.keyboard.press("ArrowRight")
  await expect(node(page, "Q1.pdf")).toBeFocused()
  await page.keyboard.press("ArrowRight") // leaf: nothing
  await expect(node(page, "Q1.pdf")).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(node(page, "Reports")).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(node(page, "Reports")).toHaveAttribute("aria-expanded", "false")
  await expect(node(page, "Q1.pdf")).toHaveCount(0)
  await page.keyboard.press("ArrowDown") // collapsed children are skipped
  await expect(node(page, "Invoices")).toBeFocused()
  await page.keyboard.press("End")
  await expect(tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB" })).toBeFocused()
  await page.keyboard.press("Home")
  await expect(node(page, "Documents")).toBeFocused()
})

test("tree: Space / Enter select in multiple mode; the toggle icon expands without selecting", async ({ page }) => {
  await tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB" }).focus()
  await page.keyboard.press("Space")
  await expect(tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB" })).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Enter")
  await expect(node(page, "Pictures")).toHaveAttribute("aria-selected", "true")
  await expect(tree(page).locator("footer")).toHaveText("2 selected")
  await node(page, "Invoices").locator(".fiori-tree-item__toggle").first().click()
  await expect(node(page, "Invoices")).toHaveAttribute("aria-expanded", "true")
  await expect(node(page, "Invoices")).toHaveAttribute("aria-selected", "false")
})

test("tree: lazy node loads its children when expanded", async ({ page }) => {
  await node(page, "Pictures").focus()
  await page.keyboard.press("ArrowRight")
  await expect(node(page, "Beach.jpg")).toBeVisible()
  await expect(node(page, "Beach.jpg")).toHaveAttribute("aria-level", "2")
})

test("tree: single start mode selects one node with Enter", async ({ page }) => {
  const t = page.locator("#tree-demo-single")
  const n = (name: string) => t.getByRole("treeitem", { name, exact: true })
  await expect(n("EMEA")).toHaveAttribute("aria-selected", "true")
  await page.locator("#tree-demo-single").getByRole("treeitem").first().focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(n("Germany")).toHaveAttribute("aria-selected", "true")
  await expect(n("EMEA")).toHaveAttribute("aria-selected", "false")
})


test("tree: RTL retains UI5's physical expand, step-in, collapse and step-out keys", async ({ page }) => {
  // TreeItemBase.js _onkeydown and Tree.js step handlers keep physical arrows.
  for (const native of [false, true]) {
    await page.goto(native ? "/ui5.html?dir=rtl&only=tree-collapsed" : "/index.html?fixtures&dir=rtl&only=tree-collapsed")
    await page.waitForSelector("html[data-ready=true]")
    const root = page.locator('[data-fixture="tree-collapsed"]')
    const parent = root.getByRole("treeitem", { name: native ? /^Root A\b/ : "Root A", exact: !native })
    const child = root.getByRole("treeitem", { name: native ? /^A1\b/ : "A1", exact: !native })
    await parent.focus()
    await expect(parent).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(parent).toHaveAttribute("aria-expanded", "false")
    await expect(parent).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(parent).toHaveAttribute("aria-expanded", "true")
    await expect(parent).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(child).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(parent).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(parent).toHaveAttribute("aria-expanded", "false")
    await expect(parent).toBeFocused()
  }
})
