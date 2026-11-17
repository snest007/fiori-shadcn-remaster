import { expect, test } from "@playwright/test"

for (const locale of ["en-US", "de-DE", "zh-CN", "ar-EG"]) {
  test(`Tag hidden description matches the native owning counterpart (${locale})`, async ({ browser }) => {
    const id = locale === "en-US" ? "tag-negative" : `tag-l10n-${locale}`
    const native = await browser.newPage()
    const ours = await browser.newPage()
    try {
      await native.goto(`/ui5.html?locale=${locale}&only=${id}`)
      await native.waitForSelector("html[data-ready=true]")
      const description = await native.locator(`[data-fixture="${id}"] ui5-tag`).evaluate((host: HTMLElement) => host.shadowRoot!.querySelector(".ui5-hidden-text")!.textContent)
      await ours.goto(`/?fixtures&locale=${locale}&only=${id}`)
      await ours.waitForSelector("html[data-ready=true]")
      await expect(ours.locator(`[data-fixture="${id}"] [data-slot="tag"] > .sr-only`)).toHaveText(description!)
    } finally { await native.close(); await ours.close() }
  })
}
