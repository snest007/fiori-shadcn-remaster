import { expect, test, type Page } from "@playwright/test"

const fcl = (page: Page) => page.locator("#master-detail")
const begin = (page: Page) => page.getByRole("region", { name: "Products", exact: true })
const mid = (page: Page) => page.getByRole("region", { name: "Product", exact: true })
const end = (page: Page) => page.getByRole("region", { name: "Sales order item", exact: true })

async function open(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: 800 })
  await page.goto(`/block.html?name=master-detail`)
  await page.waitForSelector("html[data-ready=true]")
}

test("search filters the product list", async ({ page }) => {
  await open(page)
  await begin(page).getByRole("searchbox", { name: "Search products" }).fill("notebook")
  await expect(begin(page).getByRole("listitem")).toHaveCount(3)
  await expect(begin(page).getByText("Products (3)")).toBeVisible()
  await begin(page).getByRole("searchbox").fill("zzz")
  await expect(begin(page).getByText("No products found")).toBeVisible()
})

test("list -> object -> line item, full screen and close", async ({ page }) => {
  await open(page)
  await expect(fcl(page)).toHaveAttribute("data-layout", "OneColumn")
  await expect(mid(page)).toHaveCount(0)
  await begin(page).getByText("Notebook Basic 15").click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "TwoColumnsStartExpanded")
  await expect(mid(page).getByRole("heading", { name: "Notebook Basic 15" })).toBeVisible()
  await expect(mid(page).getByText("Very Best Screens")).toBeVisible()

  await mid(page).getByRole("button", { name: "Enter Full Screen Mode" }).click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "MidColumnFullScreen")
  await expect(begin(page)).toHaveCount(0) // hidden column: no region role
  await mid(page).getByRole("button", { name: "Exit Full Screen Mode" }).click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "TwoColumnsStartExpanded")

  await mid(page).getByText("SO-0500000014").click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "ThreeColumnsMidExpanded")
  await expect(end(page).getByText("Becker Berlin")).toBeVisible()
  await end(page).getByRole("button", { name: "Enter Full Screen Mode" }).click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "EndColumnFullScreen")
  await end(page).getByRole("button", { name: "Close" }).click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "MidColumnFullScreen")
  await mid(page).getByRole("button", { name: "Close" }).click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "OneColumn")
  await expect(mid(page)).toHaveCount(0)
})

test("selecting another product in three columns goes back to two", async ({ page }) => {
  await open(page)
  await begin(page).getByText("Notebook Professional 15").click()
  await mid(page).getByText("SO-0500000031").click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "ThreeColumnsMidExpanded")
  // Begin column arrow hides it.
  await page.getByRole("button", { name: "Switch between start and middle column layouts" }).click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "ThreeColumnsStartHiddenMidExpanded")
  await page.getByRole("button", { name: "Switch between start and middle column layouts" }).click()
  await begin(page).getByText("Flat Future").click()
  await expect(mid(page).getByRole("heading", { name: "Flat Future" })).toBeVisible()
  await expect(end(page)).toHaveCount(0)
})

test("tablet width shows two columns; phone width one", async ({ page }) => {
  await open(page, 900)
  await expect(fcl(page)).toHaveAttribute("data-media", "tablet")
  await begin(page).getByText("Notebook Basic 15").click()
  await mid(page).getByText("SO-0500000001").click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "ThreeColumnsMidExpanded")
  await expect(begin(page)).toHaveCount(0)
  await expect(mid(page)).toBeVisible()
  await expect(end(page)).toBeVisible()

  await open(page, 500)
  await expect(fcl(page)).toHaveAttribute("data-media", "phone")
  await begin(page).getByText("Wireless Mouse").click()
  await expect(fcl(page)).toHaveAttribute("data-layout", "MidColumnFullScreen")
  await expect(mid(page).getByRole("button", { name: "Enter Full Screen Mode" })).toHaveCount(0)
  await expect(mid(page).getByText("No sales orders")).toBeVisible()
})
