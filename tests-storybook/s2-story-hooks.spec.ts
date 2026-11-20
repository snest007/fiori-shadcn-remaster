import { expect, test } from "@playwright/test"

// S2: these real render functions combine useArgs with an issued-id ref. Theme
// changes and their load/delete callbacks must keep one Storybook hook context.
for (const item of ["table", "list"] as const) {
  test(`S2 ${item} growing callbacks retain issued ids across toolbar theme changes`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
    const story = `data-${item}--growing-button`
    await page.goto(`/?path=/story/${story}&args=${item === "table" ? "withActions:true" : "selectionMode:delete"}`)
    const frame = page.frameLocator("#storybook-preview-iframe")
    const canvas = frame.locator(`[data-fiori-story="${story}"]`)
    const rows = canvas.locator(`[data-slot="${item === "table" ? "table-row" : "list-item"}"]`)
    const initialCount = item === "table" ? 4 : 3
    await expect(rows).toHaveCount(initialCount)
    const more = canvas.getByRole("button", { name: "More", exact: true })
    const themes = [
      { title: "High Contrast Black", value: "sap_horizon_hcb" },
      { title: "Evening Horizon", value: "sap_horizon_dark" },
    ]
    const issued: string[] = []
    for (const [index, theme] of themes.entries()) {
      await page.getByRole("button", { name: /Horizon theme/ }).click()
      await page.getByRole("listbox", { name: "Horizon theme" }).getByText(theme.title, { exact: true }).click()
      await expect(canvas).toHaveAttribute("data-theme", theme.value)
      const preview = await (await page.locator("#storybook-preview-iframe").elementHandle())!.contentFrame()
      await preview!.waitForFunction(() => {
        const render = (window as Window & { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__?.currentRender
        return render?.phase === "finished"
      })
      await more.press("Enter")
      await expect(rows).toHaveCount(initialCount + 1)
      const number = initialCount + index + 1
      const name = item === "table" ? `Notebook Pro ${number}` : `Seasonal fruit ${number}`
      const added = rows.filter({ hasText: name })
      await expect(added).toHaveCount(1)
      const key = await added.getAttribute(item === "table" ? "data-row-key" : "data-nav-key")
      expect(key).toBe(item === "table" ? `p${number}` : `product-${number}`)
      expect(issued).not.toContain(key)
      issued.push(key!)
      if (item === "table") await added.getByRole("button", { name: `Delete ${name}`, exact: true }).press("Enter")
      else {
        await added.focus()
        await expect(added).toBeFocused()
        await page.keyboard.press("Delete")
      }
      await expect(rows).toHaveCount(initialCount)
      await expect(added).toHaveCount(0)
    }
    expect(errors).toEqual([])
    await testInfo.attach("s2-growing-issued-ids.json", { body: JSON.stringify({ story, issued, themes }), contentType: "application/json" })
  })
}
