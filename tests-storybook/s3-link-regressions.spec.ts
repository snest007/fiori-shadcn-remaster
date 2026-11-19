import { expect, test } from "@playwright/test"
import { classifyS3NoHrefActionLink } from "./known-issues"
import { expectNamedControls, waitForStoryFinished } from "./accessibility"

// S3
// component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
for (const theme of ["sap_horizon", "sap_horizon_hcb"]) for (const story of ["display-link--playground", "display-link--rtl"]) {
  test("S3 action-link role marker binds only " + story + " (" + theme + ")", async ({ page }) => {
    const context = { story, theme }
    await page.goto("/iframe.html?id=" + context.story + "&viewMode=story&globals=theme:" + theme)
    await waitForStoryFinished(page)
    const link = page.locator('#storybook-root a[data-slot="link"]')
    await expect(link).toBeVisible()
    expect(await classifyS3NoHrefActionLink(link, context)).toBe(true)
    await expect(link).toHaveAccessibleName("")
    expect(await classifyS3NoHrefActionLink(link, { ...context, primary: true })).toBe(false)
    expect(await classifyS3NoHrefActionLink(link, { ...context, story: "display-link--default" })).toBe(false)
    expect(await classifyS3NoHrefActionLink(link, { ...context, theme: "sap_horizon_dark" })).toBe(false)
    await link.evaluate((node) => node.setAttribute("role", "link"))
    expect(await classifyS3NoHrefActionLink(link, context)).toBe(false)
    await expect(link).toHaveAccessibleName("View purchase order")
    await link.evaluate((node) => node.removeAttribute("role"))
    await link.evaluate((node) => node.setAttribute("href", "#purchase-order"))
    expect(await classifyS3NoHrefActionLink(link, context)).toBe(false)
    await expect(link).toHaveAccessibleName("View purchase order")
  })
}

test("S3 action-link marker rejects foreign nodes and keeps unnamed buttons strict", async ({ page }) => {
  const context = { story: "display-link--playground", theme: "sap_horizon" }
  await page.setContent('<html data-theme="sap_horizon"><body><div id="storybook-root"><div data-fiori-story="display-link--playground"><button></button></div></div><a data-slot="link" class="fiori-link" tabindex="0"><span class="fiori-link__text">View purchase order</span></a></body></html>')
  expect(await classifyS3NoHrefActionLink(page.locator("a"), context)).toBe(false)
  expect(await classifyS3NoHrefActionLink(page.locator("button"), context)).toBe(false)
  await expect(expectNamedControls(page, context)).rejects.toThrow()
})
