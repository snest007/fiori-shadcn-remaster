import { expect, test } from "@playwright/test"
import { axeViolations, expectNamedControls, waitForStoryFinished } from "./accessibility"
import { attachAudit, classifyS3UnnamedModeControl, classifyViolations } from "./known-issues"

test("Loading's E4 record does not hide a new invalid grid node or an unapproved story", async ({ page }, testInfo) => {
  await page.goto("/iframe.html?id=data-data-table--loading&viewMode=story")
  await expect(page.getByRole("progressbar")).toBeVisible()
  await page.locator('[data-fiori-story="data-data-table--loading"]').evaluate((canvas) => {
    const grid = document.createElement("div")
    grid.id = "unrelated-invalid-grid"
    grid.setAttribute("role", "grid")
    grid.setAttribute("aria-label", "Unrelated grid")
    grid.innerHTML = '<div role="row"><div role="columnheader">Unrelated header</div></div><div role="progressbar" aria-label="Unrelated loading" aria-valuemin="0" aria-valuemax="100">Unrelated loading</div>'
    canvas.append(grid)
  })
  const raw = await axeViolations(page, "sap_horizon")
  const audit = await classifyViolations(page, raw, { story: "data-data-table--loading", theme: "sap_horizon" })
  await attachAudit(testInfo, "new-grid-guard", audit)
  // A repaired original grid may produce no known record; the injected defect
  // must still fail classification even after E4 removes the original violation.
  for (const node of audit.known.flatMap((rule) => rule.nodes)) expect(node.target).toEqual([".fiori-table__grid"])
  expect(audit.unexpected.find((rule) => rule.id === "aria-required-children")?.nodes.map((node) => node.target)).toContainEqual(["#unrelated-invalid-grid"])
  const unapproved = await classifyViolations(page, raw, { story: "data-data-table--playground", theme: "sap_horizon" })
  expect(unapproved.known).toEqual([])
  expect(unapproved.unexpected).toEqual(raw)
  await page.getByRole("grid", { name: "Products", exact: true }).evaluate((grid) => {
    const extra = document.createElement("div")
    extra.setAttribute("role", "progressbar")
    extra.setAttribute("aria-label", "Unexpected product loading")
    extra.setAttribute("aria-valuemin", "0")
    extra.setAttribute("aria-valuemax", "100")
    extra.textContent = "Unexpected product loading"
    grid.append(extra)
  })
  const changed = await classifyViolations(page, await axeViolations(page, "sap_horizon"), {
    story: "data-data-table--loading", theme: "sap_horizon",
  })
  await attachAudit(testInfo, "changed-owned-grid-guard", changed)
  expect(changed.known).toEqual([])
  expect(changed.unexpected.find((rule) => rule.id === "aria-required-children")?.nodes.map((node) => node.target)).toContainEqual([".fiori-table__grid"])
})

// S3
// component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
const s3ModeStories = ["open", "sort-filter-and-group", "descending", "reset-enabled", "custom-texts", "rtl"]
for (const variant of s3ModeStories) for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
  test(`S3 ${variant} mode-name marker accepts only its linked component node (${theme})`, async ({ page }, testInfo) => {
    const story = `overlays-view-settings-dialog--${variant}`
    await page.goto(`/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`)
    const mode = page.locator('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]')
    await expect(mode).toBeVisible()
    await waitForStoryFinished(page)
    await expect(mode).toHaveAccessibleName("")
    expect(await classifyS3UnnamedModeControl(mode, { story, theme })).toBe(true)
    await expectNamedControls(page, { story, theme }, testInfo)
    expect(await classifyS3UnnamedModeControl(mode, { story: "overlays-view-settings-dialog--playground", theme })).toBe(false)
    expect(await classifyS3UnnamedModeControl(mode, { story, theme, primary: true })).toBe(false)
    expect(await classifyS3UnnamedModeControl(mode, { story, theme: "sap_horizon_dark" })).toBe(false)
    const opener = page.locator(`#storybook-root [data-fiori-story="${story}"] [data-slot="dialog-trigger"]`)
    await opener.evaluate((node) => node.setAttribute("aria-controls", "foreign-dialog-id"))
    expect(await classifyS3UnnamedModeControl(mode, { story, theme })).toBe(false)
  })
}

test("S3 name marker rejects a matching foreign dialog and foreign node", async ({ page }) => {
  const context = { story: "overlays-view-settings-dialog--open", theme: "sap_horizon" }
  await page.goto(`/iframe.html?id=${context.story}&viewMode=story`)
  const mode = page.locator('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]')
  await expect(mode).toBeVisible()
  await waitForStoryFinished(page)
  const ownedId = await page.locator('.fiori-vsd[role="dialog"]').getAttribute("id")
  await mode.evaluate((node) => {
    const foreign = node.cloneNode(true) as HTMLElement
    foreign.id = "s3-foreign-mode"
    node.closest('[role="dialog"]')!.append(foreign)
  })
  expect(await classifyS3UnnamedModeControl(page.locator("#s3-foreign-mode"), context)).toBe(false)
  await page.locator("#s3-foreign-mode").evaluate((node) => node.remove())
  await page.locator('.fiori-vsd[role="dialog"]').evaluate((node) => {
    const foreign = node.cloneNode(true) as HTMLElement
    foreign.id = "s3-foreign-dialog"
    foreign.querySelector('[data-slot="dialog-title"]')!.id = "s3-foreign-title"
    foreign.setAttribute("aria-labelledby", "s3-foreign-title")
    node.parentElement!.append(foreign)
  })
  const foreign = page.locator('#s3-foreign-dialog .fiori-vsd__sub-header [role="listbox"]')
  expect(await classifyS3UnnamedModeControl(foreign, context)).toBe(false)
  await page.locator(`[id="${ownedId}"]`).evaluate((node) => node.remove())
  // Only one identical foreign portal remains, but the owned trigger still
  // points at the removed portal. Matching markup never proves ownership.
  expect(await classifyS3UnnamedModeControl(foreign, context)).toBe(false)
})

test("S3 marker keeps strict names for unrelated controls and unnamed foreign listboxes", async ({ page }) => {
  const context = { story: "overlays-view-settings-dialog--open", theme: "sap_horizon" }
  await page.setContent(`<html data-theme="sap_horizon"><body><div id="storybook-root"><div data-fiori-story="${context.story}"><button id="s3-unnamed-button"></button><div id="s3-unnamed-list" role="listbox" tabindex="0"></div></div></div></body></html>`)
  expect(await classifyS3UnnamedModeControl(page.locator("#s3-unnamed-button"), context)).toBe(false)
  expect(await classifyS3UnnamedModeControl(page.locator("#s3-unnamed-list"), context)).toBe(false)
  await expect(expectNamedControls(page, context)).rejects.toThrow(/toHaveAccessibleName/)
  await page.locator("#s3-unnamed-button").evaluate((node) => node.setAttribute("aria-label", "Named negative control"))
  await expect(expectNamedControls(page, context)).rejects.toThrow(/toHaveAccessibleName/)
})

// S3 Playground is deliberately separate from the six existing mode stories.
for (const primary of [false, true]) for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
  test(`S3 Playground-open marker binds its live ${primary ? "primary docs" : "story"} canvas (${theme})`, async ({ page }, testInfo) => {
    const story = "overlays-view-settings-dialog--playground"
    const context = { story, theme, primary }
    await page.goto(`/iframe.html?id=${primary ? "overlays-view-settings-dialog--docs" : story}&viewMode=${primary ? "docs" : "story"}&globals=theme:${theme}`)
    const canvas = page.locator(`${primary ? "#storybook-docs [data-fiori-primary]" : "#storybook-root"} [data-fiori-story="${story}"]`)
    const opener = canvas.getByRole("button", { name: "Configure product view", exact: true })
    await expect(opener).toBeVisible()
    await expect.poll(async () => JSON.parse(await canvas.getAttribute("data-fiori-args") ?? "{}").open).toBe(false)
    // A real supported interaction opens the component and updates its own args.
    await opener.press("Enter")
    const dialog = page.locator('.fiori-vsd[role="dialog"]')
    const mode = dialog.locator('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]')
    await expect(mode).toBeVisible()
    await expect.poll(async () => JSON.parse(await canvas.getAttribute("data-fiori-args") ?? "{}").open).toBe(true)
    await waitForStoryFinished(page)
    expect(await classifyS3UnnamedModeControl(mode, context)).toBe(true)
    await expectNamedControls(page, context, testInfo)
    const raw = await axeViolations(page, theme)
    const audit = await classifyViolations(page, raw, context)
    await attachAudit(testInfo, "S3-live-playground-open", audit)
    expect(audit.known.find((rule) => rule.id === "aria-input-field-name")?.nodes).toHaveLength(1)
    expect(audit.unexpected).toEqual([])
    expect(await classifyS3UnnamedModeControl(mode, { ...context, story: "overlays-view-settings-dialog--open" })).toBe(false)
    expect(await classifyS3UnnamedModeControl(mode, { ...context, primary: !primary })).toBe(false)
    await canvas.evaluate((node) => node.setAttribute("data-fiori-args", JSON.stringify({ open: false })))
    expect(await classifyS3UnnamedModeControl(mode, context)).toBe(false)
    const closed = await classifyViolations(page, raw, context)
    expect(closed.known).toEqual([])
    await canvas.evaluate((node) => node.setAttribute("data-fiori-args", JSON.stringify({ open: true })))
    await opener.evaluate((node) => node.setAttribute("aria-controls", "foreign-playground-dialog"))
    expect(await classifyS3UnnamedModeControl(mode, context)).toBe(false)
    const foreign = await classifyViolations(page, raw, context)
    expect(foreign.known).toEqual([])
  })
}

test("S3 Playground rejects a foreign primary canvas and an unrelated unnamed node", async ({ page }) => {
  const context = { story: "overlays-view-settings-dialog--playground", theme: "sap_horizon", primary: true }
  await page.goto("/iframe.html?id=overlays-view-settings-dialog--docs&viewMode=docs")
  const canvas = page.locator(`#storybook-docs [data-fiori-primary] [data-fiori-story="${context.story}"]`)
  await canvas.getByRole("button", { name: "Configure product view", exact: true }).press("Enter")
  const mode = page.locator('.fiori-vsd__sub-header > [data-slot="segmented-button"][role="listbox"]')
  await expect(mode).toBeVisible()
  await expect.poll(async () => JSON.parse(await canvas.getAttribute("data-fiori-args") ?? "{}").open).toBe(true)
  await mode.evaluate((node) => {
    const foreign = node.cloneNode(true) as HTMLElement
    foreign.id = "s3-unrelated-playground-mode"
    node.closest('[role="dialog"]')!.append(foreign)
  })
  expect(await classifyS3UnnamedModeControl(page.locator("#s3-unrelated-playground-mode"), context)).toBe(false)
  await page.locator("#s3-unrelated-playground-mode").evaluate((node) => node.remove())
  await canvas.evaluate((node) => {
    const foreignPrimary = document.createElement("div")
    foreignPrimary.setAttribute("data-fiori-primary", "")
    document.body.append(foreignPrimary)
    foreignPrimary.append(node)
  })
  expect(await classifyS3UnnamedModeControl(mode, context)).toBe(false)
  const audit = await classifyViolations(page, await axeViolations(page, "sap_horizon"), context)
  expect(audit.known).toEqual([])
})
