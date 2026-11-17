import { expect, test } from "@playwright/test"
import { waitForStoryFinished } from "./accessibility"

test("S2 Tree Delete removes a nested file and its parent without changing surviving identities or selection", async ({ page }, testInfo) => {
  // Exercise the shipped Delete story through its public args, not a test-only mount.
  // A preselected surviving sibling also proves delete mode does not alter selection.
  await page.goto("/iframe.html?id=data-tree--delete&viewMode=story&args=value:!array(q2)")
  const tree = page.getByRole("tree", { name: "Files", exact: true })
  await expect(tree).toBeVisible()
  await waitForStoryFinished(page)
  const item = (value: string) => tree.locator(`[role="treeitem"][data-nav-key="${value}"]`)
  const surviving = ["docs", "reports", "q1", "q2", "pictures", "notes"]
  const identities = await Promise.all(surviving.map(async (value) => ({ value, node: await item(value).elementHandle() })))
  expect(identities.every(({ node }) => node !== null)).toBe(true)
  const invoices = item("invoices")
  const invoiceIdentity = await invoices.elementHandle()
  const assertSurvivors = async () => {
    for (const { value, node } of identities) {
      await expect(item(value)).toHaveCount(1)
      expect(await item(value).evaluate((actual, previous) => actual === previous, node)).toBe(true)
    }
    await expect(item("docs")).toHaveAttribute("aria-expanded", "true")
    await expect(item("reports")).toHaveAttribute("aria-expanded", "true")
    await expect(tree.locator('[role="treeitem"][data-selected]')).toHaveCount(1)
    await expect(item("q2")).toHaveAttribute("data-selected", "")
    // Delete mode exposes delete actions, rather than selectable treeitem states.
    await expect(tree.locator('[role="treeitem"][aria-selected]')).toHaveCount(0)
  }
  await assertSurvivors()
  await invoices.focus()
  await expect(invoices).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(invoices).toHaveAttribute("aria-expanded", "true")
  await expect(item("jan")).toBeVisible()
  await page.keyboard.press("ArrowRight")
  await expect(item("jan")).toBeFocused()
  await expect(item("jan")).toHaveAttribute("aria-level", "3")
  // UI5 Tree.js/_onListItemDelete emits the request; the real story owns removal.
  await page.keyboard.press("Delete")
  await expect(item("jan")).toHaveCount(0)
  await expect(invoices).not.toHaveAttribute("aria-owns", /.+/)
  await expect(invoices).not.toHaveAttribute("aria-expanded", /.+/)
  expect(await invoices.evaluate((actual, previous) => actual === previous, invoiceIdentity)).toBe(true)
  await assertSurvivors()
  await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveAttribute("data-nav-key", "q2")
  // Re-enter through the component's real focus sentinel after deleting the focused leaf.
  const before = page.locator('[data-slot="tree"] .fiori-list__focusarea').first()
  await before.focus()
  await expect(item("q2")).toBeFocused()
  await page.keyboard.press("Enter")
  await assertSurvivors()
  await page.keyboard.press("ArrowDown")
  await expect(invoices).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(item("docs")).toBeFocused()
  await invoices.focus()
  await expect(invoices).toBeFocused()
  await page.keyboard.press("Delete")
  await expect(invoices).toHaveCount(0)
  await assertSurvivors()
  await expect(item("reports")).toHaveAttribute("aria-posinset", "1")
  await expect(item("reports")).toHaveAttribute("aria-setsize", "1")
  await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveAttribute("data-nav-key", "q2")
  await before.focus()
  await expect(item("q2")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item("pictures")).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(item("q2")).toBeFocused()
  await assertSurvivors()
  await testInfo.attach("s2-tree-delete-settled.html", { body: await tree.innerHTML(), contentType: "text/html" })
})
