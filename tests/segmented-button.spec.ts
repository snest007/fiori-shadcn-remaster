import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/segmented-button`)
  await page.waitForSelector("html[data-ready=true]")
})

test("segmented button: listbox of options with aria-selected", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "View" })
  await expect(lb).toHaveAttribute("aria-multiselectable", "false")
  await expect(lb).toHaveAttribute("aria-orientation", "horizontal")
  await expect(lb.getByRole("option")).toHaveCount(4)
  await expect(lb.getByRole("option", { name: "Week" })).toHaveAttribute("aria-selected", "true")
  await expect(lb.getByRole("option", { name: "Day" })).toHaveAttribute("aria-selected", "false")
  await expect(lb.getByRole("option", { name: "Week" })).not.toHaveAttribute("aria-pressed", /.*/)
  await expect(page.getByRole("listbox", { name: "Text style" })).toHaveAttribute("aria-multiselectable", "true")
})

test("segmented button: Tab lands on the selected item; arrows move focus only", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "View" })
  const o = (name: string) => lb.getByRole("option", { name })
  await o("Week").focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(o("Week")).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(o("Month")).toBeFocused()
  await expect(o("Week")).toHaveAttribute("aria-selected", "true") // focus moved, selection didn't
  await page.keyboard.press("ArrowRight") // "Year" is disabled and there is no wrap
  await expect(o("Month")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(o("Day")).toBeFocused()
  await page.keyboard.press("ArrowLeft") // no wrap at the start either
  await expect(o("Day")).toBeFocused()
  await page.keyboard.press("End")
  await expect(o("Month")).toBeFocused()
})

test("segmented button: Space and Enter select; single mode never deselects", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "View" })
  const o = (name: string) => lb.getByRole("option", { name })
  await o("Week").focus()
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Space")
  await expect(o("Day")).toHaveAttribute("aria-selected", "true")
  await expect(o("Week")).toHaveAttribute("aria-selected", "false")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect(o("Week")).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("Enter") // activating the selected item keeps it selected
  await expect(o("Week")).toHaveAttribute("aria-selected", "true")
  await o("Week").click()
  await expect(o("Week")).toHaveAttribute("aria-selected", "true")
})

test("segmented button: multiple mode toggles items independently", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "Text style" })
  const o = (name: string) => lb.getByRole("option", { name })
  await o("Bold").focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Space")
  await expect(o("Italic")).toHaveAttribute("aria-selected", "true")
  await expect(o("Bold")).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Enter")
  await expect(o("Bold")).toHaveAttribute("aria-selected", "false")
})
