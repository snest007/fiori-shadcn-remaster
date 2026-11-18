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
