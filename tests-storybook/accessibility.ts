import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"

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
  return result.violations.map((violation) => ({ id: violation.id, help: violation.help, nodes: violation.nodes.map((node) => ({ target: node.target, html: node.html, summary: node.failureSummary })) }))
}

export async function expectNamedControls(page: Page) {
  await waitForStoryFinished(page)
  for (const role of ["button", "link", "textbox", "searchbox", "combobox", "checkbox", "radio", "spinbutton", "slider", "switch", "tab", "option", "menuitem", "menuitemcheckbox", "menuitemradio", "treeitem", "gridcell", "columnheader"] as const) {
    for (const control of await page.getByRole(role).all()) await expect(control).toHaveAccessibleName(/\S/)
  }
  // Password fields have no implicit textbox role; keyboard movement handles are images.
  for (const control of await page.locator('input[type="password"], [role="img"][tabindex="0"]').all()) await expect(control).toHaveAccessibleName(/\S/)
}
