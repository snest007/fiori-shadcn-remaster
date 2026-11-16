import { expect, test } from "@playwright/test"
import { axeViolations } from "./accessibility"
import { attachAudit, classifyViolations } from "./known-issues"

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
