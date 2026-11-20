import { expect, test } from "@playwright/test"

test("label: custom host retains the owned field association and hidden colon/required marker", async ({ page, browser }) => {
  const reference = await browser.newPage()
  try {
    for (const [current, native] of [[page, false], [reference, true]] as const) {
      await current.goto(`/${native ? "ui5" : "index"}.html?fixtures&only=label-custom-host`)
      await current.waitForSelector("html[data-ready=true]")
      const holder = current.locator('[data-fixture="label-custom-host"]')
      const input = holder.getByRole("textbox", { name: "Company name", exact: true })
      await expect.poll(() => input.evaluate((node) => node.matches(":required") || node.getAttribute("aria-required") === "true")).toBe(true)
      if (!native) {
        const label = holder.locator('[data-custom-host="label"]')
        await expect(label).toHaveAttribute("for", "label-custom-host-input")
        await expect(label).not.toHaveAttribute("tabindex")
        await label.click()
        await expect(input).toBeFocused()
      }
      await expect(input).toHaveAccessibleName("Company name")
    }
  } finally { await reference.close() }
})
