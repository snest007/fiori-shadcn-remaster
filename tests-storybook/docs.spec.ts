import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

interface Entry { id: string; type: string; title: string; name: string }
const entries = Object.values(JSON.parse(readFileSync(new URL("../storybook-static/index.json", import.meta.url), "utf8")).entries) as Entry[]

for (const name of ["button", "input", "select", "calendar", "data-table", "dialog"]) {
  const primary = entries.find((entry) => entry.type === "story" && entry.id.endsWith(`-${name}--playground`))!
  const stories = entries.filter((entry) => entry.type === "story" && entry.title === primary.title)

  test(`${name} docs renders every variant with its actual JSX source`, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=docs&id=${primary.id.replace(/--playground$/, "--docs")}`)
    await expect(page.locator("[data-story-block]")).toHaveCount(stories.length)
    for (const story of stories.filter((entry) => entry.id !== primary.id)) {
      const anchor = page.locator(`[id="anchor--${story.id}"]`)
      // Storybook nests an accessible permalink in the heading; assert its
      // visible title independently of that generated link's accessible name.
      await expect(anchor.locator("h3")).toHaveText(story.name)
      const block = anchor.locator(`[id="story--${story.id}"]`)
      const frame = block.locator("iframe")
      if (await frame.count()) {
        await expect(block.frameLocator("iframe").locator("#storybook-root [data-slot]").first()).toBeAttached()
      } else {
        await expect(block.locator(`[data-fiori-story="${story.id}"] [data-slot]`).first()).toBeAttached()
      }
      await anchor.getByRole("switch", { name: "Show code" }).click()
      await expect(anchor.getByRole("switch", { name: "Hide code" })).toBeChecked()
      await expect(anchor).toContainText("const Example")
      await expect(anchor).toContainText(/<[A-Z]/)
    }
  })
}

test("inline RTL docs examples stay controlled without changing toolbar globals", async ({ page }) => {
  await page.goto("/iframe.html?viewMode=docs&id=forms-input--docs")
  const canvas = page.locator('[data-fiori-story="forms-input--rtl"]')
  const input = canvas.getByRole("textbox", { name: "Company", exact: true })
  await expect(canvas).toHaveAttribute("dir", "rtl")
  await input.fill("Northwind Traders")
  await expect(input).toHaveValue("Northwind Traders")
  await expect.poll(async () => JSON.parse(await canvas.getAttribute("data-fiori-args") ?? "{}").value).toBe("Northwind Traders")
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sap_horizon")
})

for (const id of ["overlays-dialog--docs", "introduction--docs"]) {
  test(`${id} applies toolbar globals without an inline primary canvas`, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=docs&id=${id}&globals=theme:sap_horizon_dark;density:compact;dir:rtl`)
    await expect(page.locator("html")).toHaveAttribute("data-theme", "sap_horizon_dark")
    await expect(page.locator("html")).toHaveAttribute("data-density", "compact")
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(page.locator(".sbdocs-content")).toBeVisible()
  })
}
