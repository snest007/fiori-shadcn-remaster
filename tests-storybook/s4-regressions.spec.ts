import { expect, test, type Page } from "@playwright/test"
import { waitForStoryFinished } from "./accessibility"

// S4: the owner-approved third attempt requires a persistent regression of the
// actual controlled story callbacks, rather than a duplicated controller model.
const story = "navigation-variant-management--playground"
const canvas = (page: Page) => page.locator(`[data-fiori-story="${story}"]`)
const readArgs = async (page: Page) => JSON.parse(await canvas(page).getAttribute("data-fiori-args") ?? "{}")

for (const newDefault of [true, false]) {
  test(`S4 deleting the modified Personal view loads the clean ${newDefault ? "new" : "current"} Public default`, async ({ page }, testInfo) => {
    await page.goto(`/iframe.html?viewMode=story&id=${story}&args=modified:true;defaultKey:${newDefault ? "standard" : "public"}`)
    const trigger = canvas(page).getByRole("button", { name: "Modified view My view.", exact: true })
    await expect(trigger).toBeVisible()
    await waitForStoryFinished(page)
    await expect(canvas(page).locator(".fiori-vm-modified")).toHaveText("*")
    await trigger.click()
    const list = page.locator(".fiori-vm-list")
    // Establish that the selected saved view really has an editable unsaved state.
    await expect(list.getByRole("button", { name: "Save", exact: true })).toBeVisible()
    await list.getByRole("button", { name: "Manage", exact: true }).click()
    const manage = page.getByRole("dialog", { name: "Manage Views", exact: true })
    await expect(manage).toBeVisible()
    const publicRow = manage.locator('[data-variant-key="public"]')
    if (newDefault) await publicRow.getByRole("radio", { name: "Default", exact: true }).check()
    await expect(publicRow.getByRole("radio", { name: "Default", exact: true })).toBeChecked()
    await manage.locator('[data-variant-key="personal"]').getByRole("button", { name: "Delete View", exact: true }).click()
    await expect(manage.locator('[data-variant-key="personal"]')).toHaveCount(0)
    await manage.getByRole("button", { name: "Save", exact: true }).click()
    await expect(manage).toHaveCount(0)
    await expect.poll(() => readArgs(page)).toMatchObject({ selectedKey: "public", defaultKey: "public", modified: false })
    await expect(canvas(page).locator(".fiori-vm-title")).toHaveText("Shared view")
    await expect(canvas(page).locator(".fiori-vm-trigger")).not.toHaveAttribute("data-modified", "")
    await expect(canvas(page).locator(".fiori-vm-modified")).toBeEmpty()
    const cleanTrigger = canvas(page).getByRole("button", { name: "View Shared view.", exact: true })
    await expect(cleanTrigger).toBeFocused()
    // SEL_VARIANT is the component's selected-view announcement/name. It must
    // lose SEL_VARIANT_MOD along with the visual star and controlled Save state.
    await expect(cleanTrigger).toHaveAccessibleName("View Shared view.")
    await expect(canvas(page).getByRole("button", { name: /^Modified view/ })).toHaveCount(0)
    await cleanTrigger.click()
    await expect(list.getByRole("option", { name: /Shared view/ })).toHaveAttribute("aria-selected", "true")
    await expect(list.getByRole("option", { name: /My view/ })).toHaveCount(0)
    await expect(list.getByRole("button", { name: "Save", exact: true })).toHaveCount(0)
    await expect(list.getByRole("button", { name: "Save As", exact: true })).toHaveAttribute("data-variant", "emphasized")
    await testInfo.attach("controlled-fallback-state.json", { body: JSON.stringify(await readArgs(page), null, 2), contentType: "application/json" })
  })
}

test("S4 unrelated Manage changes preserve the selected view's unsaved state", async ({ page }, testInfo) => {
  await page.goto(`/iframe.html?viewMode=story&id=${story}&args=modified:true`)
  const trigger = canvas(page).getByRole("button", { name: "Modified view My view.", exact: true })
  await expect(trigger).toBeVisible()
  await waitForStoryFinished(page)
  await trigger.click()
  await page.locator(".fiori-vm-list").getByRole("button", { name: "Manage", exact: true }).click()
  const manage = page.getByRole("dialog", { name: "Manage Views", exact: true })
  await expect(manage).toBeVisible()
  await manage.locator('[data-variant-key="public"]').getByRole("radio", { name: "Default", exact: true }).check()
  await expect(manage.locator('[data-variant-key="public"]').getByRole("radio", { name: "Default", exact: true })).toBeChecked()
  await manage.getByRole("button", { name: "Save", exact: true }).click()
  await expect(manage).toHaveCount(0)
  await expect.poll(() => readArgs(page)).toMatchObject({ selectedKey: "personal", defaultKey: "public", modified: true })
  await expect(trigger).toBeFocused()
  await expect(canvas(page).locator(".fiori-vm-modified")).toHaveText("*")
  await trigger.click()
  await expect(page.locator(".fiori-vm-list").getByRole("button", { name: "Save", exact: true })).toBeVisible()
  await testInfo.attach("controlled-surviving-view-state.json", { body: JSON.stringify(await readArgs(page), null, 2), contentType: "application/json" })
})
