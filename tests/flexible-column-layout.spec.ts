import { expect, test, type Locator, type Page } from "@playwright/test"

const demo = (page: Page) => page.locator("#flexible-column-layout-demo")
const col = (fcl: Locator, c: "start" | "mid" | "end") => fcl.locator(`[data-slot=flexible-column-layout-${c}-column]`)
const sep = (fcl: Locator, s: "start" | "end") => fcl.locator(`[data-slot=flexible-column-layout-${s}-separator]`)
const widths = (fcl: Locator) =>
  Promise.all((["start", "mid", "end"] as const).map((c) => col(fcl, c).evaluate((e) => Math.round(e.getBoundingClientRect().width))))

async function open(page: Page) {
  await page.goto(`/index.html#/flexible-column-layout`)
  await page.waitForSelector("html[data-ready=true]")
  await demo(page).scrollIntoViewIfNeeded()
}
const setLayout = (page: Page, layout: string) => page.locator("#flexible-column-layout-demo-select").selectOption(layout)
/** Column widths animate (0.56s) like UI5; wait until they settle. */
async function settled(fcl: Locator) {
  let prev = ""
  for (let i = 0; i < 40; i++) {
    const w = (await widths(fcl)).join()
    if (w === prev) return
    prev = w
    await fcl.page().waitForTimeout(150)
  }
}

test.describe("FlexibleColumnLayout", () => {
  test.beforeEach(async ({ page }) => open(page))

  test("columns are labelled regions; hidden columns are aria-hidden and inert", async ({ page }) => {
    const fcl = demo(page)
    await expect(col(fcl, "start")).toHaveAttribute("role", "region")
    await expect(col(fcl, "start")).toHaveAttribute("aria-label", "First column")
    await expect(col(fcl, "mid")).toHaveAttribute("aria-hidden", "true")
    await expect(col(fcl, "mid")).not.toHaveAttribute("role", /.+/)
    expect(await col(fcl, "mid").evaluate((e) => (e as HTMLElement).inert)).toBe(true)
    await setLayout(page, "ThreeColumnsMidExpanded")
    for (const [c, name] of [["start", "First column"], ["mid", "Middle column"], ["end", "Last column"]] as const) {
      await expect(col(fcl, c)).toHaveAttribute("role", "region")
      await expect(col(fcl, c)).toHaveAttribute("aria-label", name)
      await expect(col(fcl, c)).not.toHaveAttribute("aria-hidden", /.*/)
    }
  })

  test("layouts set the UI5 column proportions (desktop)", async ({ page }) => {
    const fcl = demo(page)
    // 1100px wide, separators 16px each.
    await setLayout(page, "ThreeColumnsMidExpanded")
    await settled(fcl)
    expect(await widths(fcl)).toEqual([267, 534, 267])
    await setLayout(page, "TwoColumnsMidExpanded")
    await settled(fcl)
    expect(await widths(fcl)).toEqual([358, 726, 0])
    await setLayout(page, "MidColumnFullScreen")
    await settled(fcl)
    expect(await widths(fcl)).toEqual([0, 1100, 0])
    await expect(sep(fcl, "start")).toBeHidden()
  })

  test("separators: role, label, value and arrow tooltip", async ({ page }) => {
    const fcl = demo(page)
    await setLayout(page, "ThreeColumnsMidExpanded")
    const start = sep(fcl, "start")
    await expect(start).toHaveAttribute("role", "separator")
    await expect(start).toHaveAttribute("aria-label", "Resize between start and mid columns")
    await expect(start).toHaveAttribute("aria-orientation", "vertical")
    await expect(start).toHaveAttribute("aria-valuenow", "25")
    await expect(start).toHaveAttribute("tabindex", "0")
    await expect(sep(fcl, "end")).toHaveAttribute("aria-label", "Resize between mid and end columns")
    await expect(sep(fcl, "end")).toHaveAttribute("aria-valuenow", "75")
    const arrow = start.getByRole("button", { name: "Switch between start and middle column layouts" })
    await expect(arrow).toBeVisible()
    // ThreeColumnsEndExpanded: the start separator has the arrow but no grip, so it is not focusable / named.
    await setLayout(page, "ThreeColumnsEndExpanded")
    await expect(start).not.toHaveAttribute("tabindex", /.*/)
    await expect(start).not.toHaveAttribute("aria-label", /.*/)
    await expect(arrow).toBeVisible()
  })

  test("arrow hides and reveals the start column (mouse and keyboard)", async ({ page }) => {
    const fcl = demo(page)
    await setLayout(page, "ThreeColumnsMidExpanded")
    const arrow = sep(fcl, "start").getByRole("button")
    await arrow.click()
    await expect(page.locator("#flexible-column-layout-demo-status")).toContainText("ThreeColumnsStartHiddenMidExpanded")
    await settled(fcl)
    expect((await widths(fcl))[0]).toBe(0)
    await arrow.focus()
    await page.keyboard.press("Enter")
    await expect(page.locator("#flexible-column-layout-demo-status")).toContainText("ThreeColumnsMidExpanded")
    await page.keyboard.press("Space")
    await expect(page.locator("#flexible-column-layout-demo-status")).toContainText("ThreeColumnsStartHiddenMidExpanded")
  })

  test("keyboard resizing: arrows (20px), Shift+arrows (2px), Home / End", async ({ page }) => {
    const fcl = demo(page)
    await setLayout(page, "TwoColumnsMidExpanded")
    await settled(fcl)
    const s = sep(fcl, "start")
    await s.focus()
    const [start0] = await widths(fcl)
    await page.keyboard.press("ArrowRight")
    expect((await widths(fcl))[0]).toBe(start0 + 20)
    await page.keyboard.press("Shift+ArrowLeft")
    expect((await widths(fcl))[0]).toBe(start0 + 18)
    await page.keyboard.press("Home")
    expect(await widths(fcl)).toEqual([248, 1100 - 16 - 248, 0])
    await page.keyboard.press("End")
    // Start grows past the middle column: layout switches to TwoColumnsStartExpanded.
    expect(await widths(fcl)).toEqual([1100 - 16 - 248, 248, 0])
    await expect(page.locator("#flexible-column-layout-demo-status")).toContainText("TwoColumnsStartExpanded")
    await expect(s).toBeFocused()
  })

  test("dragging a separator resizes with a 248px minimum and switches layout", async ({ page }) => {
    const fcl = demo(page)
    await setLayout(page, "ThreeColumnsMidExpanded")
    await settled(fcl)
    const grip = sep(fcl, "end").locator(".fiori-fcl__grip")
    const box = (await grip.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 5 })
    expect((await widths(fcl))[2]).toBeGreaterThan(330)
    await page.mouse.move(box.x - 700, box.y + box.height / 2, { steps: 10 })
    await page.mouse.up()
    // Mid column cannot go below 248px; end column became larger -> ThreeColumnsEndExpanded.
    const w = await widths(fcl)
    expect(w[1]).toBe(248)
    await expect(page.locator("#flexible-column-layout-demo-status")).toContainText("ThreeColumnsEndExpanded")
    await expect(sep(fcl, "end")).toBeFocused()
  })

  test("container width sets the max column count (desktop 3, tablet 2, phone 1)", async ({ page }) => {
    const fcl = demo(page)
    await setLayout(page, "ThreeColumnsMidExpanded")
    await expect(fcl).toHaveAttribute("data-media", "desktop")
    await page.getByRole("button", { name: "800px" }).click()
    await expect(fcl).toHaveAttribute("data-media", "tablet")
    await expect(page.locator("#flexible-column-layout-demo-status")).toContainText("max 2 columns")
    await settled(fcl)
    const tablet = await widths(fcl)
    expect(tablet[0]).toBe(0)
    expect(tablet[1]).toBeGreaterThan(tablet[2])
    await expect(sep(fcl, "start").getByRole("button")).toHaveCount(0)
    await page.getByRole("button", { name: "500px" }).click()
    await expect(fcl).toHaveAttribute("data-media", "phone")
    await settled(fcl)
    expect(await widths(fcl)).toEqual([0, 0, 500])
  })

  test("column width changes animate like UI5 and collapsed columns end display:none", async ({ page }) => {
    const fcl = demo(page)
    await setLayout(page, "TwoColumnsMidExpanded")
    await settled(fcl)
    expect(await col(fcl, "start").evaluate((e) => getComputedStyle(e).transitionDuration)).toContain("0.56s")
    await setLayout(page, "MidColumnFullScreen")
    await expect(col(fcl, "start")).toHaveAttribute("data-collapsing", "")
    await expect(col(fcl, "start")).toHaveAttribute("data-hidden", "", { timeout: 2000 })
    await expect(col(fcl, "start")).toBeHidden()
  })
})

test.describe("useFlexibleColumnLayout", () => {
  test.beforeEach(async ({ page }) => open(page))

  test("list -> detail -> detail-detail, full screen and close", async ({ page }) => {
    const fcl = demo(page)
    const status = page.locator("#flexible-column-layout-demo-status")
    await col(fcl, "start").getByText("Order 1002").click()
    await expect(status).toContainText("TwoColumnsStartExpanded")
    await col(fcl, "mid").getByText("USB-C Dock").click()
    await expect(status).toContainText("ThreeColumnsMidExpanded")
    await col(fcl, "end").getByRole("button", { name: "Enter Full Screen Mode" }).click()
    await expect(status).toContainText("EndColumnFullScreen")
    await col(fcl, "end").getByRole("button", { name: "Exit Full Screen Mode" }).click()
    await expect(status).toContainText("ThreeColumnsMidExpanded")
    await col(fcl, "end").getByRole("button", { name: "Close" }).click()
    await expect(status).toContainText("TwoColumnsStartExpanded")
    await col(fcl, "mid").getByRole("button", { name: "Enter Full Screen Mode" }).click()
    await expect(status).toContainText("MidColumnFullScreen")
    // From a full-screen mid column, the next level stays full screen.
    await col(fcl, "mid").getByText("Wireless Mouse").click()
    await expect(status).toContainText("EndColumnFullScreen")
    await col(fcl, "end").getByRole("button", { name: "Close" }).click()
    await expect(status).toContainText("MidColumnFullScreen")
    await col(fcl, "mid").getByRole("button", { name: "Close" }).click()
    await expect(status).toContainText("OneColumn")
  })

  test("phone width: navigation uses full-screen layouts", async ({ page }) => {
    const fcl = demo(page)
    const status = page.locator("#flexible-column-layout-demo-status")
    await page.getByRole("button", { name: "500px" }).click()
    await expect(status).toContainText("max 1 columns")
    await col(fcl, "start").getByText("Order 1001").click()
    await expect(status).toContainText("MidColumnFullScreen")
    await expect(col(fcl, "mid").getByRole("button", { name: "Enter Full Screen Mode" })).toHaveCount(0)
    await col(fcl, "mid").getByText("USB-C Dock").click()
    await expect(status).toContainText("EndColumnFullScreen")
    await col(fcl, "end").getByRole("button", { name: "Close" }).click()
    await expect(status).toContainText("MidColumnFullScreen")
  })
})

// The same separator interaction on UI5's own component (ui5.html fixture) and ours must give the same columns.
test("keyboard resizing matches ui5-flexible-column-layout", async ({ browser }) => {
  const id = "flexible-column-layout-three-columns-mid-expanded"
  const run = async (url: string) => {
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForSelector("html[data-ready=true]")
    const cell = page.locator(`[data-fixture=${id}]`)
    const separators = cell.locator(".ui5-fcl-separator, .fiori-fcl__separator")
    const cols = cell.locator(".ui5-fcl-column, .fiori-fcl__column")
    const read = () => cols.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)))
    const out: number[][] = []
    await separators.nth(1).focus()
    for (const key of ["ArrowLeft", "ArrowLeft", "Shift+ArrowLeft", "Home"]) {
      await page.keyboard.press(key)
      await page.waitForTimeout(700)
      out.push(await read())
    }
    await separators.nth(0).focus()
    for (const key of ["ArrowRight", "End"]) {
      await page.keyboard.press(key)
      await page.waitForTimeout(700)
      out.push(await read())
    }
    await page.close()
    return out
  }
  const ui5 = await run(`/ui5.html?only=${id}`)
  const ours = await run(`/index.html?fixtures&only=${id}`)
  expect(ours).toEqual(ui5)
})


test("flexible-column-layout: RTL mirrors separator resizing and preserves Home/End column limits", async ({ page }) => {
  // FlexibleColumnLayout.js moveSeparator reverses offsetX in RTL; _onSeparatorKeyDown
  // reverses Home/End's offsets too, keeping the same start-column minimum/maximum.
  await page.goto("/index.html?dir=rtl#/flexible-column-layout")
  await page.waitForSelector("html[data-ready=true]")
  const root = demo(page)
  await setLayout(page, "TwoColumnsMidExpanded")
  await expect.poll(() => widths(root)).toEqual([358, 726, 0])
  const separator = sep(root, "start")
  await separator.focus()
  await expect(separator).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect.poll(() => widths(root)).toEqual([378, 706, 0])
  await page.keyboard.press("ArrowRight")
  await expect.poll(() => widths(root)).toEqual([358, 726, 0])
  await page.keyboard.press("Home")
  await expect.poll(() => widths(root)).toEqual([248, 836, 0])
  await page.keyboard.press("End")
  await expect.poll(() => widths(root)).toEqual([836, 248, 0])
})
