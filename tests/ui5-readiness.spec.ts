import { expect, test } from "@playwright/test"

for (const id of ["button-emphasized", "input-value"]) {
  test(`UI5 ${id} waits for the real host theme before declaring its measured fixture ready`, async ({ page }, testInfo) => {
    let releaseTheme!: () => void
    let themeHeld!: (url: string) => void
    const release = new Promise<void>((resolve) => { releaseTheme = resolve })
    const held = new Promise<string>((resolve) => { themeHeld = resolve })

    // UI5 2.28 generated/json-imports/Themes.js loads main host properties separately
    // from the base theme. Match that original response by its own parameters, so
    // this regression survives build hashes and never substitutes theme CSS.
    await page.route(/\/assets\/parameters-bundle\.css-[^/]+\.js(?:\?.*)?$/, async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes("--_ui5_button_base_height:") && body.includes("--_ui5_input_height:")) {
        themeHeld(route.request().url())
        await release
      }
      await route.fulfill({ response })
    })

    try {
      await page.goto(`/ui5.html?theme=sap_horizon_hcb&density=cozy&only=${id}`, { waitUntil: "domcontentloaded" })
      const themeUrl = await held
      const cell = page.locator(`[data-fixture="${id}"]`)
      await expect(cell).toHaveCount(1)
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--sapBackgroundColor").trim() === "#000")

      // Advance rendering opportunities while the required response is held. This
      // exercises the existing layout-stability/frame barriers without a timed sleep.
      const pendingFrames = await cell.evaluate(async (fixture) => {
        const slot = fixture.parentElement!
        const frames: { ready: string | undefined; width: string; height: string }[] = []
        for (let frame = 0; frame < 30; frame++) {
          await new Promise((resolve) => requestAnimationFrame(resolve))
          frames.push({ ready: document.documentElement.dataset.ready, width: slot.style.width, height: slot.style.height })
        }
        return frames
      })
      await testInfo.attach("pending-real-host-theme", { body: JSON.stringify({ themeUrl, pendingFrames }, null, 2), contentType: "application/json" })
      expect(pendingFrames.some((frame) => frame.ready === "true"), "readiness must wait for the outstanding real host theme").toBe(false)
      expect(pendingFrames.every((frame) => frame.width === "" && frame.height === ""), "slot measurements must wait for the outstanding real host theme").toBe(true)

      releaseTheme()
      await page.waitForSelector("html[data-ready=true]")
      const measured = await cell.evaluate((fixture) => {
        const host = fixture.firstElementChild!
        const slot = fixture.parentElement!
        const fixtureStyle = getComputedStyle(fixture)
        const hostStyle = getComputedStyle(host)
        return {
          fixture: fixture.getBoundingClientRect().height,
          host: host.getBoundingClientRect().height,
          natural: host.getBoundingClientRect().height + parseFloat(hostStyle.marginTop) + parseFloat(hostStyle.marginBottom)
            + parseFloat(fixtureStyle.paddingTop) + parseFloat(fixtureStyle.paddingBottom),
          slot: slot.getBoundingClientRect().height,
          pinned: parseFloat(slot.style.height),
        }
      })
      await testInfo.attach("ready-measurement", { body: JSON.stringify(measured, null, 2), contentType: "application/json" })
      expect(measured.host).toBeGreaterThan(0)
      expect(measured.fixture).toBeCloseTo(measured.natural, 5)
      expect(measured.slot).toBe(Math.ceil(measured.natural))
      expect(measured.pinned).toBe(Math.ceil(measured.natural))
    } finally {
      releaseTheme()
      await page.unrouteAll({ behavior: "wait" })
    }
  })
}
