import { expect, test } from "@playwright/test"
import { waitForStoryFinished } from "./accessibility"
import { classifyS2InitialPickerDraft, s2PickerDraftDefect } from "./known-issues"

test.use({ timezoneId: "UTC" })
const stories = ["dates-time-picker--open", "dates-time-picker--open-negative", "dates-time-picker--open-critical", "dates-date-time-picker--open", "dates-date-time-picker--open-negative"]
for (const story of stories) for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
  test(`S2 ${story} initial-open draft marker rejects changed and foreign clock nodes (${theme})`, async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date("2026-11-19T08:10:20Z"))
    await page.goto(`/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`)
    // Keep this locator on the original node when the negative case adds a clone.
    const hour = page.getByRole("spinbutton", { name: "Hours", exact: true }).and(page.locator(":not(#s2-foreign-hour)"))
    await expect(hour).toBeVisible()
    await waitForStoryFinished(page)
    const context = { story, theme, rule: "initial-open-draft" }
    // UI5's valid-value draft is 3:25:40 PM; the current React component starts
    // from the fixed current time. Preserve this exact defect, never a new one.
    await expect(hour).toHaveAttribute("aria-valuenow", "8")
    await expect(page.getByRole("spinbutton", { name: "Minutes", exact: true })).toHaveAttribute("aria-valuenow", "10")
    await expect(page.getByRole("spinbutton", { name: "Seconds", exact: true })).toHaveAttribute("aria-valuenow", "20")
    expect(await classifyS2InitialPickerDraft(hour, context)).toBe(true)
    testInfo.annotations.push({ type: "component defect", description: s2PickerDraftDefect })
    await testInfo.attach("S2-initial-open-draft.json", { body: JSON.stringify({ context, comment: s2PickerDraftDefect, input: await page.locator("input").inputValue(), clock: await hour.evaluate(node => node.outerHTML) }), contentType: "application/json" })
    expect(await classifyS2InitialPickerDraft(hour, { ...context, story: "dates-time-picker--playground" })).toBe(false)
    expect(await classifyS2InitialPickerDraft(hour, { ...context, rule: "unrelated-value-check" })).toBe(false)
    expect(await classifyS2InitialPickerDraft(hour, { ...context, primary: true })).toBe(false)
    await hour.evaluate(node => { const foreign = node.cloneNode(true) as HTMLElement; foreign.id = "s2-foreign-hour"; node.parentElement!.append(foreign) })
    expect(await classifyS2InitialPickerDraft(page.locator("#s2-foreign-hour"), context)).toBe(false)
    expect(await classifyS2InitialPickerDraft(hour, context)).toBe(false)
    await page.locator("#s2-foreign-hour").evaluate(node => node.remove())
    expect(await classifyS2InitialPickerDraft(hour, context)).toBe(true)
    await hour.evaluate(node => node.setAttribute("aria-valuenow", "3"))
    expect(await classifyS2InitialPickerDraft(hour, context)).toBe(false)
  })
}
