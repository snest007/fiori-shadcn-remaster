import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/tree`)
  await page.waitForSelector("html[data-ready=true]")
})

const tree = (page: Page) => page.locator("#tree-demo")
const node = (page: Page, name: string) => tree(page).getByRole("treeitem", { name: `${name} Tree Item Is Active`, exact: true })

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
  await expect(tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB Tree Item Is Active" })).not.toHaveAttribute("aria-expanded", /.*/)
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
  await expect(tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB Tree Item Is Active" })).toBeFocused()
  await page.keyboard.press("Home")
  await expect(node(page, "Documents")).toBeFocused()
})

test("tree: Space / Enter select in multiple mode; the toggle icon expands without selecting", async ({ page }) => {
  await tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB Tree Item Is Active" }).focus()
  await page.keyboard.press("Space")
  await expect(tree(page).getByRole("treeitem", { name: "Notes.txt 2 KB Tree Item Is Active" })).toHaveAttribute("aria-selected", "true")
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
  const n = (name: string) => t.getByRole("treeitem", { name: `${name} Tree Item Is Active`, exact: true })
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
    const parent = root.getByRole("treeitem", { name: "Root A Tree Item Is Active", exact: true })
    const child = root.getByRole("treeitem", { name: "A1 Tree Item Is Active", exact: true })
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

for (const mode of ["multiple", "single-start"] as const) test(`Tree ${mode} selection indicators preserve native Chromium roles, labels and states`, async ({ page, browser }) => {
  // TreeItemBaseTemplate.js uses ListItemTemplate.js:selectionElement unchanged;
  // TreeItemBase.js:_accInfo adjusts the row, not its checkbox/radio semantics.
  const id = `tree-mode-${mode}`
  const reference = await browser.newPage()
  const capture = async (current: Page) => {
    const session = await current.context().newCDPSession(current)
    try {
      await session.send("Accessibility.enable")
      const { nodes } = await session.send("Accessibility.getFullAXTree")
      return nodes.filter((entry) => !entry.ignored && ["checkbox", "radio"].includes(String(entry.role?.value))).map((entry) => ({
        role: entry.role?.value, name: entry.name?.value, description: entry.description?.value,
        states: Object.fromEntries((entry.properties ?? []).filter((property) => ["checked", "disabled", "required", "readonly", "focusable"].includes(property.name)).map((property) => [property.name, property.value.value])),
      }))
    } finally { await session.detach() }
  }
  try {
    await page.goto(`/index.html?fixtures&only=${id}`)
    await reference.goto(`/ui5.html?only=${id}`)
    await page.waitForSelector("html[data-ready=true]")
    await reference.waitForSelector("html[data-ready=true]")
    const role = mode === "multiple" ? "checkbox" : "radio"
    const initial = await capture(reference)
    expect(initial.length).toBeGreaterThan(0)
    expect(initial.every((entry) => entry.role === role && entry.name === (role === "checkbox" ? "Multiple Selection Mode" : "Item Selection."))).toBe(true)
    expect(await capture(page)).toEqual(initial)
    for (const current of [page, reference]) {
      const indicator = current.locator(`[data-fixture="${id}"]`).getByRole(role).first()
      await expect(indicator).toHaveAttribute("tabindex", "-1")
      await indicator.focus()
      await expect(indicator).toBeFocused()
      await current.keyboard.press("Enter")
      await expect(indicator).toHaveAttribute("aria-checked", "true")
    }
    expect(await capture(page)).toEqual(await capture(reference))
  } finally { await reference.close() }
})

test("Tree row label references retain only owned content through expansion", async ({ page }) => {
  const row = node(page, "Documents")
  const referenceText = () => row.evaluate((element) => element.getAttribute("aria-labelledby")?.split(/\s+/).map((id) => {
    const target = document.getElementById(id)
    return target?.isConnected ? target.textContent?.trim() : null
  }))
  await expect.poll(referenceText).toEqual(["Documents", "Tree Item Is Active"])
  await row.focus()
  await expect(row).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(row).toHaveAttribute("aria-expanded", "false")
  await expect(row).toHaveAccessibleName("Documents Tree Item Is Active")
  await page.keyboard.press("ArrowRight")
  await expect(row).toHaveAttribute("aria-expanded", "true")
  await expect.poll(referenceText).toEqual(["Documents", "Tree Item Is Active"])
  await expect(row).toHaveAccessibleName("Documents Tree Item Is Active")
})

for (const rtl of [false, true]) for (const channel of ["name", "name-ref", "description", "description-ref"]) test(`Tree ${rtl ? "RTL " : ""}${channel} reaches UI5's owning tree`, async ({ page, browser }) => {
  const id = `tree-a11y-${channel}${rtl ? "-rtl" : ""}`
  const reference = await browser.newPage()
  try {
    for (const [index, current] of [page, reference].entries()) {
      await current.goto(`/${index ? "ui5" : "index"}.html?fixtures&only=${id}`)
      await current.waitForSelector("html[data-ready=true]")
      const root = current.locator(`[data-fixture="${id}"]`).getByRole("tree")
      if (channel.startsWith("name")) await expect(root).toHaveAccessibleName("File hierarchy")
      else await expect(root).toHaveAccessibleDescription("Browse company documents")
      if (rtl) await expect(root).toHaveCSS("direction", "rtl")
      // UI5 TreeList's ul owns slotted rows across shadow roots; a DOM-descendant
      // locator from that ul cannot reach them, while the fixture locator can.
      await expect(current.locator(`[data-fixture="${id}"]`).getByRole("treeitem")).toHaveAccessibleName("Documents Tree Item Is Active")
      if (channel === "description-ref") {
        await current.locator(`[id="tree-a11y-${channel}${rtl ? "-rtl" : ""}-target${index ? "-ui5" : ""}"]`).evaluate((target) => { target.textContent = "Updated company documents" })
        await expect(root).toHaveAccessibleDescription("Updated company documents")
      }
    }
  } finally { await reference.close() }
})

for (const rtl of [false, true]) test(`Tree ${rtl ? "RTL " : ""}item name and popup channel retain the native active hint`, async ({ page, browser }) => {
  const id = `tree-a11y-item-name${rtl ? "-rtl" : ""}`
  const reference = await browser.newPage()
  try {
    for (const [index, current] of [page, reference].entries()) {
      await current.goto(`/${index ? "ui5" : "index"}.html?fixtures&only=${id}`)
      await current.waitForSelector("html[data-ready=true]")
      const row = current.locator(`[data-fixture="${id}"]`).getByRole("treeitem")
      await expect(row).toHaveAccessibleName("Document collection Is Active")
      await expect(row).toHaveAttribute("aria-haspopup", "dialog")
      expect(await row.getAttribute("aria-describedby")).toBeTruthy()
      await expect(row).toHaveAccessibleDescription("")
    }
  } finally { await reference.close() }
})

for (const rtl of [false, true]) test(`Tree ${rtl ? "RTL " : ""}custom content cannot replace owned role, states, ids or tab stops`, async ({ page, browser }) => {
  const id = `tree-a11y-custom${rtl ? "-rtl" : ""}`
  const reference = await browser.newPage()
  try {
    for (const [index, current] of [page, reference].entries()) {
      await current.goto(`/${index ? "ui5" : "index"}.html?fixtures&only=${id}`)
      await current.waitForSelector("html[data-ready=true]")
      const root = current.locator(`[data-fixture="${id}"]`)
      const row = root.getByRole("treeitem", { name: "Custom documents Tree Item Is Active", exact: true })
      await expect(row).toHaveAttribute("aria-selected", "false")
      await expect(row).toHaveAccessibleDescription("Not Selected")
      await expect(row).toHaveAttribute("aria-expanded", "true")
      await expect(row).toHaveAttribute("aria-level", "1")
      await expect(row).toHaveAttribute("aria-posinset", "1")
      await expect(row).toHaveAttribute("aria-setsize", "1")
      await expect(row).toHaveAttribute("tabindex", "0")
      const owns = await row.getAttribute("aria-owns")
      expect(owns).toBeTruthy()
      await expect(root.locator(`[id="${owns}"]`)).toHaveAttribute("role", "group")
      await row.focus()
      await expect(row).toBeFocused()
      await current.keyboard.press("Enter")
      await expect(row).toHaveAttribute("aria-selected", "true")
      await expect(row).toHaveAccessibleDescription("Selected")
      const live = current.locator(index ? ".ui5-invisiblemessage-polite" : '[data-slot="tree-announcement"]')
      await expect(live).toHaveAttribute("aria-live", "polite")
      await expect(live).toHaveText("Selected")
      await current.keyboard.press("ArrowRight")
      await expect(root.getByRole("treeitem", { name: "Owned child Tree Item Is Active", exact: true })).toBeFocused()
      await current.keyboard.press("ArrowLeft")
      await expect(row).toBeFocused()
    }
  } finally { await reference.close() }
})

test("Tree text overrides keep selection descriptions and polite announcements connected", async ({ page }) => {
  const root = page.locator("#tree-demo-texts")
  const row = root.getByRole("treeitem", { name: "Documents File node Opens a file", exact: true })
  await expect(row).toHaveAccessibleDescription("File deselected")
  await expect(row.locator("[title='Open folder']")).toHaveCount(1)
  await row.focus()
  await expect(row).toBeFocused()
  await page.keyboard.press("Space")
  await expect(row).toHaveAccessibleDescription("File selected")
  const live = page.locator('[data-slot="tree-announcement"][data-owner="tree-demo-texts"]')
  await expect(live).toHaveAttribute("aria-live", "polite")
  await expect(live).toHaveText("File selected")
  await page.keyboard.press("Space")
  await expect(row).toHaveAccessibleDescription("File deselected")
  await expect(live).toHaveText("File deselected")
  await page.keyboard.press("ArrowRight")
  await expect(row).toHaveAttribute("aria-expanded", "true")
  await expect(row.locator("[title='Close folder']")).toHaveCount(1)
})
