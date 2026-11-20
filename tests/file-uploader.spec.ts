import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/file-uploader`)
  await page.waitForSelector("html[data-ready=true]")
})

const native = (page: import("@playwright/test").Page) => page.locator("#file-uploader-demo input[type=file]")

test("file-uploader: native input has the UI5 semantics and the placeholder", async ({ page }) => {
  const input = native(page)
  await expect(input).toHaveAttribute("aria-roledescription", "File Uploader")
  await expect(input).toHaveAttribute("aria-haspopup", "dialog")
  await expect(input).toHaveAccessibleName("Attachment")
  await expect(page.locator("#file-uploader-demo .fiori-file-uploader__display")).toHaveAttribute("placeholder", "Browse or drop multiple files")
})

for (const key of ["Enter", "Space", "F4", "Alt+ArrowDown"]) {
  test(`file-uploader: ${key} opens the file picker`, async ({ page }) => {
    await native(page).focus()
    const chooser = page.waitForEvent("filechooser")
    // Adding the listener turns on file-chooser interception asynchronously; a round trip to the page
    // guarantees it is active before the key press (Enter opens on keydown, earlier than the others).
    await page.evaluate(() => 0)
    await page.keyboard.press(key)
    const fc = await chooser
    expect(fc.isMultiple()).toBe(true)
  })
}

test("file-uploader: selected files show as tokens; Delete and the clear icon empty it", async ({ page }) => {
  await native(page).setInputFiles([
    { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("a") },
    { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("b") },
  ])
  await expect(page.locator("#file-uploader-demo .fiori-file-uploader__token")).toHaveText(["a.txt", "report.pdf"])
  await expect(page.locator("#file-uploader-demo-files")).toHaveText("a.txt, report.pdf")
  await native(page).focus()
  await page.keyboard.press("Delete")
  await expect(page.locator("#file-uploader-demo-files")).toHaveText("No files selected")
  await native(page).setInputFiles([{ name: "b.txt", mimeType: "text/plain", buffer: Buffer.from("b") }])
  await page.locator("#file-uploader-demo [data-slot=file-uploader-clear]").click()
  await expect(page.locator("#file-uploader-demo-files")).toHaveText("No files selected")
  await expect(native(page)).toBeFocused()
})

test("file-uploader: clicking the field opens the picker and focuses the input", async ({ page }) => {
  const chooser = page.waitForEvent("filechooser")
  await page.locator("#file-uploader-demo").click()
  await chooser
  await expect(native(page)).toBeFocused()
})

test("file-uploader: dropping files selects them", async ({ page }) => {
  const dt = await page.evaluateHandle(() => {
    const d = new DataTransfer()
    d.items.add(new File(["x"], "dropped.png", { type: "image/png" }))
    return d
  })
  await page.locator("#file-uploader-demo").dispatchEvent("drop", { dataTransfer: dt })
  await expect(page.locator("#file-uploader-demo-files")).toHaveText("dropped.png")
})


for (const theme of ["sap_horizon", "sap_horizon_hcb"]) test(`FileUploader ${theme} paints only keyboard focus`, async ({ page }) => {
  await page.goto(`/index.html?fixtures&only=file-uploader&theme=${theme}`)
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="file-uploader"]')
  const target = cell.locator('input[type="file"]')
  const owner = cell.locator('[data-slot="file-uploader"]')
  const painted = () => owner.evaluate((node) => !["none", "normal"].includes(getComputedStyle(node, "::after").content))
  const chooser = page.waitForEvent("filechooser")
  await page.evaluate(() => 0)
  await owner.click()
  await chooser
  await expect(target).toBeFocused()
  expect(await painted()).toBe(false)
  await cell.evaluate((node) => {
    const before = document.createElement("button"); before.id = "file-uploader-e4-before"; before.textContent = "Before uploader"
    node.before(before); before.focus()
  })
  await expect(page.locator("#file-uploader-e4-before")).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(target).toBeFocused()
  expect(await painted()).toBe(true)
})
