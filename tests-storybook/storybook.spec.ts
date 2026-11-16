import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { axeViolations, expectNamedControls, waitForStoryFinished } from "./accessibility"
import { attachAudit, classifyViolations } from "./known-issues"

interface StoryEntry { id: string; type: "story" | "docs"; title: string; name: string }
const entries = Object.values(JSON.parse(readFileSync(new URL("../storybook-static/index.json", import.meta.url), "utf8")).entries) as StoryEntry[]
const stories = entries.filter((entry) => entry.type === "story")
const storyId = (title: string, name = "Playground") => {
  const story = stories.find((story) => story.title === title && story.name === name)
  if (!story) throw new Error(`Missing ${title}/${name} story`)
  return story.id
}
const iframe = (id: string, globals?: string, args?: string, mode = "story") => {
  const query = new URLSearchParams({ id, viewMode: mode })
  if (globals) query.set("globals", globals)
  if (args) query.set("args", args)
  return `/iframe.html?${query}`
}
async function render(page: Page, id: string, globals?: string, args?: string) {
  await page.goto(iframe(id, globals, args))
  await expect(page.locator("#storybook-root [data-slot]").first()).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await waitForStoryFinished(page)
}
async function tokenColor(page: Page, token: string) {
  return page.evaluate((token) => {
    const probe = document.createElement("span")
    probe.style.backgroundColor = `var(${token})`
    document.body.append(probe)
    const color = getComputedStyle(probe).backgroundColor
    probe.remove()
    return color
  }, token)
}

for (const story of stories) {
  test(`${story.title}/${story.name} renders named controls without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
    await render(page, story.id)
    await expect(page.locator("#storybook-root [data-slot]").first()).toBeAttached()
    await expectNamedControls(page)
    expect(errors).toEqual([])
  })
  for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
    test(`${story.title}/${story.name} has no unexpected axe violations (${theme})`, async ({ page }, testInfo) => {
      await render(page, story.id, `theme:${theme}`)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      if (story.name === "Loading") await expect(page.getByRole("progressbar")).toBeVisible()
      const violations = await axeViolations(page, theme)
      const audit = await classifyViolations(page, violations, { story: story.id, theme })
      await attachAudit(testInfo, "axe-violations", audit)
      expect(audit.unexpected).toEqual([])
    })
  }
}

test("toolbar globals set root attributes and Horizon canvas color", async ({ page }) => {
  await render(page, storyId("Actions/Button"), "theme:sap_horizon_dark;density:compact;dir:rtl")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sap_horizon_dark")
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact")
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  const background = await tokenColor(page, "--sapBackgroundColor")
  await expect(page.locator(".fiori-story-canvas")).toHaveCSS("background-color", background)
})

for (const title of ["Actions/Button", "Data/DataTable"]) {
  test(`${title} docs shows install command and optional usage`, async ({ page, context }) => {
    const docs = entries.find((entry) => entry.type === "docs" && entry.title === title)
    expect(docs).toBeDefined()
    await page.goto(iframe(docs!.id, undefined, undefined, "docs"))
    const name = title === "Actions/Button" ? "button" : "data-table"
    const item = JSON.parse(readFileSync(new URL(`../registry/items/${name}.json`, import.meta.url), "utf8"))
    await expect(page.getByText(`npx shadcn add @fiori/${name}`, { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Copy install command" })).toBeVisible()
    // G1 now supplies Button usage; the card's old conditional example is stale.
    await expect(page.getByRole("heading", { name: "When to use", exact: true })).toHaveCount(item.usage ? 1 : 0)
    await expect(page.getByRole("heading", { name: "Props", exact: true })).toBeVisible()
    await expect(page.getByText(name === "button" ? "Semantic appearance of the action." : "Rows to render.").first()).toBeVisible()
    if (name === "data-table") {
      const alternative = page.getByRole("region", { name: "Usage guidance" }).getByRole("link", { name: "table", exact: true })
      await expect(alternative).toHaveAttribute("target", "_top")
      expect(await alternative.evaluate((link) => {
        const url = new URL((link as HTMLAnchorElement).href)
        return { path: url.pathname, docs: url.searchParams.get("path") }
      })).toEqual({ path: "/", docs: "/docs/data-table--docs" })
    }
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.getByRole("button", { name: "Copy install command" }).click()
    await expect(page.getByRole("button", { name: "Copy install command" })).toHaveText("Copied")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`npx shadcn add @fiori/${name}`)
    await page.getByRole("switch", { name: "Show code" }).first().click()
    await expect(page.locator(".sbdocs-content")).toContainText(name === "button" ? "<Button" : "<DataTable")
  })
}

test("Button args control its emphasized background", async ({ page }) => {
  await render(page, storyId("Actions/Button"), undefined, "variant:emphasized")
  const button = page.getByRole("button", { name: "Save", exact: true })
  await expect(button).toHaveAttribute("data-variant", "emphasized")
  await expect(button).toHaveCSS("background-color", await tokenColor(page, "--sapButton_Emphasized_Background"))
})

test("Input playground typing updates its controlled value", async ({ page }) => {
  await render(page, storyId("Forms/Input"))
  const input = page.getByRole("textbox", { name: "Company" })
  await input.fill("Northwind Traders")
  await expect(input).toHaveValue("Northwind Traders")
})

test("Select playground commits a new option", async ({ page }) => {
  await render(page, storyId("Forms/Select"))
  const select = page.getByRole("combobox", { name: "Country" })
  await select.focus()
  await expect(select).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(select).toHaveText("France")
  await page.keyboard.press("F4")
  await expect(page.getByRole("option", { name: "France", exact: true })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("option", { name: "China", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await expect(select).toHaveText("China")
  await expect(select).toBeFocused()
})

test("Select Open retains component-owned listbox selection and focus restoration", async ({ page }) => {
  await render(page, storyId("Forms/Select", "Open"))
  await expect(page.getByRole("listbox", { name: "Country choices" })).toBeVisible()
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("option", { name: "France", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  const select = page.getByRole("combobox", { name: "Country" })
  await expect(select).toHaveText("France")
  await expect(select).toBeFocused()
})

test("Dialog trigger opens and closes a labelled dialog", async ({ page }) => {
  await render(page, storyId("Overlays/Dialog"))
  await page.getByRole("button", { name: "Edit product" }).click()
  await expect(page.getByRole("dialog", { name: "Edit product" })).toBeVisible()
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})


test("Calendar CustomTexts names its header without altering owned grid states", async ({ page }, testInfo) => {
  await render(page, storyId("Dates/Calendar", "Custom Texts"))
  await expect(page.getByRole("button", { name: "Next delivery month" })).toBeVisible()
  await expect(page.getByRole("gridcell", { selected: true })).toHaveAttribute("aria-selected", "true")
  await render(page, storyId("Dates/Calendar", "Custom Texts"), undefined, "initialPicker:year")
  const range = page.locator('[data-slot="calendar-year-range-button"]')
  await expect(range).toHaveAttribute("aria-label", "Delivery years from 2015 to 2034")
  await expect(range).toHaveAccessibleName("2015 - 2034 Delivery years from 2015 to 2034")
  const checkRange = async (phase: string) => {
    const audit = await classifyViolations(page, await axeViolations(page, "sap_horizon"), {
      story: "dates-calendar--custom-texts", theme: "sap_horizon", yearMode: true,
    })
    await attachAudit(testInfo, `calendar-custom-${phase}`, audit)
    expect(audit.unexpected).toEqual([])
  }
  await checkRange("initial")
  await page.getByRole("button", { name: "Next Year Range", exact: true }).click()
  await expect(range).toHaveAttribute("aria-label", "Delivery years from 2035 to 2054")
  await expect(range).toHaveAccessibleName("2035 - 2054 Delivery years from 2035 to 2054")
  await checkRange("paged")
  await range.focus()
  await expect(range).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator('[data-picker="yearrange"]')).toBeVisible()
})
