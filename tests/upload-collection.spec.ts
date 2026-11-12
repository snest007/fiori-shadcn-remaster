import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/upload-collection`)
  await page.waitForSelector("html[data-ready=true]")
})

const items = (page: import("@playwright/test").Page) => page.locator("#upload-collection-demo [data-slot=upload-collection-item]")

test("upload-collection: region with a list; states, progress and buttons per state", async ({ page }) => {
  const uc = page.locator("#upload-collection-demo")
  await expect(uc).toHaveAttribute("role", "region")
  await expect(uc).toHaveAttribute("aria-roledescription", "Upload collection")
  await expect(uc.getByRole("list", { name: "Attachments" })).toBeVisible()
  await expect(items(page)).toHaveCount(4)
  // Complete: no progress, file name is a link.
  await expect(items(page).nth(0).locator("[role=progressbar]")).toHaveCount(0)
  await expect(items(page).nth(0).locator("[data-slot=link]")).toHaveText("Report.pdf")
  // Uploading: progress (information state) and a Terminate button.
  await expect(items(page).nth(1).locator("[role=progressbar]")).toHaveAttribute("aria-valuenow", "40")
  await expect(items(page).nth(1)).toContainText("Uploading:")
  await expect(items(page).nth(1).getByRole("button", { name: "Terminate" })).toBeVisible()
  // Error: Retry, "Terminated".
  await expect(items(page).nth(2).getByRole("button", { name: "Retry" })).toBeVisible()
  await expect(items(page).nth(2)).toContainText("Terminated:")
  // Ready: "Pending".
  await expect(items(page).nth(3)).toContainText("Pending:")
  for (let i = 0; i < 4; i++) await expect(items(page).nth(i).getByRole("button", { name: "Delete" })).toBeVisible()
})

test("upload-collection: one tab stop; arrows / Home / End navigate; Delete requests deletion", async ({ page }) => {
  await items(page).nth(0).focus()
  await page.keyboard.press("ArrowDown")
  await expect(items(page).nth(1)).toBeFocused()
  await page.keyboard.press("End")
  await expect(items(page).nth(3)).toBeFocused()
  await page.keyboard.press("Home")
  await expect(items(page).nth(0)).toBeFocused()
  await expect(items(page).nth(0)).toHaveAttribute("tabindex", "0")
  await expect(items(page).nth(1)).toHaveAttribute("tabindex", "-1")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Delete")
  await expect(page.locator("#upload-collection-demo-log")).toHaveText("Deleted Photo.jpg")
  await expect(items(page)).toHaveCount(3)
})

test("upload-collection: retry, terminate and delete buttons call back", async ({ page }) => {
  await items(page).nth(1).getByRole("button", { name: "Terminate" }).click()
  await expect(items(page).nth(1)).toHaveAttribute("data-upload-state", "error")
  await items(page).nth(1).getByRole("button", { name: "Retry" }).click()
  await expect(items(page).nth(1)).toHaveAttribute("data-upload-state", "uploading")
  await items(page).nth(0).getByRole("button", { name: "Delete" }).click()
  await expect(page.locator("#upload-collection-demo-log")).toHaveText("Deleted Report.pdf")
})

test("upload-collection: drag overlay over the page, drop overlay over the collection", async ({ page }) => {
  const dt = await page.evaluateHandle(() => {
    const d = new DataTransfer()
    d.items.add(new File(["x"], "new.txt", { type: "text/plain" }))
    return d
  })
  await page.locator("body").dispatchEvent("dragenter", { dataTransfer: dt })
  const overlay = page.locator("#upload-collection-demo [data-slot=upload-collection-overlay]")
  await expect(overlay).toHaveAttribute("data-mode", "drag")
  await expect(overlay).toHaveText("Drag files here")
  await overlay.dispatchEvent("dragenter", { dataTransfer: dt })
  await expect(overlay).toHaveAttribute("data-mode", "drop")
  await expect(overlay).toHaveText("Drop files to upload")
  await overlay.dispatchEvent("drop", { dataTransfer: dt })
  await expect(overlay).toHaveCount(0)
  await expect(items(page).last()).toContainText("new.txt")
})
