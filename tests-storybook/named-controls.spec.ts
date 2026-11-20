import { expect, test } from "@playwright/test"
import { expectNamedControls } from "./accessibility"

// expectNamedControls exempts only a completely empty gridcell (a blank data cell).
// Everything else that it checks must still have a name.
const grid = (cell: string) => `<div role="grid" aria-label="Views"><div role="row"><div role="gridcell">Standard</div>${cell}</div></div>`

test("a completely empty gridcell needs no name", async ({ page }) => {
  await page.setContent(grid('<div role="gridcell" tabindex="-1"></div>'))
  await expectNamedControls(page)
})

for (const [label, cell] of [
  ["an empty element inside it", '<div role="gridcell"><span class="icon"></span></div>'],
  ["an unnamed button inside it", '<div role="gridcell"><button></button></div>'],
]) {
  test(`a gridcell with ${label} still needs a name`, async ({ page }) => {
    await page.setContent(grid(cell))
    await expect(expectNamedControls(page)).rejects.toThrow(/toHaveAccessibleName/)
  })
}

// Focusable movement handles (role=img, tabindex=0) need a name only while they are in the accessibility tree.
test("a focusable image handle hidden by a modal needs no name", async ({ page }) => {
  await page.setContent('<div aria-hidden="true"><div role="img" tabindex="0"></div></div><div role="alertdialog" aria-label="Warning"></div>')
  await expectNamedControls(page)
})

test("a visible focusable image handle still needs a name", async ({ page }) => {
  await page.setContent('<div role="img" tabindex="0"></div>')
  await expect(expectNamedControls(page)).rejects.toThrow(/toHaveAccessibleName/)
})
