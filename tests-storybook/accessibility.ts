import AxeBuilder from "@axe-core/playwright"
import { expect, type Page, type TestInfo } from "@playwright/test"
import { classifyS3UnnamedModeControl, s3ComponentDefect, type AuditContext } from "./known-issues"

export async function waitForStoryFinished(page: Page) {
  // Storybook 10.6 StoryRender finishes addon-a11y's afterEach scan before phase
  // "finished". Wait for that real lifecycle state so the two axe runs cannot overlap.
  await page.waitForFunction(() => {
    const render = (window as Window & { __STORYBOOK_PREVIEW__?: { currentRender?: { type?: string; phase?: string } } }).__STORYBOOK_PREVIEW__?.currentRender
    return render?.type !== "story" || render.phase === "finished"
  })
}

export async function axeViolations(page: Page, theme: string, include?: string) {
  await waitForStoryFinished(page)
  let builder = new AxeBuilder({ page }).disableRules(["color-contrast"])
  if (include) builder = builder.include(include)
  const result = await builder.analyze()
  if (theme === "sap_horizon") {
    // Exactly tests/a11y.spec.ts's Morning contrast exclusion. Disabled controls
    // remain in the complete non-contrast audit; no ARIA rule is disabled.
    let contrast = new AxeBuilder({ page }).withRules(["color-contrast"]).exclude("[disabled]").exclude("[data-disabled]")
    if (include) contrast = contrast.include(include)
    result.violations.push(...(await contrast.analyze()).violations)
  }
  return result.violations
}

export async function expectNamedControls(page: Page, context?: AuditContext, testInfo?: TestInfo) {
  await waitForStoryFinished(page)
  for (const role of ["button", "link", "textbox", "searchbox", "combobox", "checkbox", "radio", "spinbutton", "slider", "switch", "tab", "option", "menuitem", "menuitemcheckbox", "menuitemradio", "treeitem", "gridcell", "columnheader", "rowheader", "progressbar", "listbox", "dialog", "alertdialog"] as const) {
    for (const control of await page.getByRole(role).all()) {
      // A blank data cell is valid ARIA: it has nothing to name. UI5 renders these too, e.g. VariantManagement's
      // manage table leaves the Standard row's Delete cell empty (OpenUI5 ColumnListItemRenderer.js gives the blank
      // cell role=gridcell without a name). Only exempt a cell that is completely empty: no element children and
      // no text. Any content, including an unnamed icon or button inside it, is still checked.
      if (role === "gridcell" && await control.evaluate((node) => node.childElementCount === 0 && !node.textContent?.trim())) continue
      // component defect, fixed by E4 — see docs/plan/handoff/S3-a11y-candidates
      // This sole approved P4 listbox is checked against its actual owning node.
      // No callback, generic selector or other role can bypass name assertions.
      if (role === "listbox" && context && await classifyS3UnnamedModeControl(control, context)) {
        await expect(control).toHaveAccessibleName("")
        if (testInfo) {
          testInfo.annotations.push({ type: "component defect", description: s3ComponentDefect })
          await testInfo.attach("S3-unnamed-mode-control.json", {
            body: JSON.stringify({ comment: s3ComponentDefect, owner: "P4", context,
              html: await control.evaluate((node) => node.outerHTML), tree: await control.ariaSnapshot() }, null, 2),
            contentType: "application/json",
          })
        }
      } else await expect(control).toHaveAccessibleName(/\S/)
    }
  }
  for (const row of await page.getByRole("row").all()) {
    if (await row.evaluate((node) => node.hasAttribute("tabindex") || node.hasAttribute("data-table-nav-row"))) await expect(row).toHaveAccessibleName(/\S/)
  }
  for (const grid of await page.getByRole("grid").all()) {
    // Calendar's non-focusable structural grids describe their purpose with
    // aria-roledescription; its individually focusable gridcells are checked above.
    if (await grid.evaluate((node) => node.hasAttribute("tabindex") || (node as HTMLElement).isContentEditable)) await expect(grid).toHaveAccessibleName(/\S/)
  }
  // Password fields have no implicit textbox role; keyboard movement handles are images.
  for (const control of await page.locator('input[type="password"], [role="img"][tabindex="0"]').all()) await expect(control).toHaveAccessibleName(/\S/)
}
