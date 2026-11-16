import { expect, test } from "@playwright/test"
import { applyAllowedWrappers, captureAX, diffTree, normalizeAX, normalizeSnapshot, relocateTableLoadingOverlay, type AXNode } from "./a11y-tree-normalize"

test("normalize only whitespace in quoted accessible names", () => {
  expect(normalizeSnapshot('- button "  Save  \\n changes  " [disabled]\n  - text: Keep  spacing')).toEqual([
    { role: "button", name: "Save changes", states: ["[disabled]"], children: [
      { role: "text", text: "Keep  spacing", states: [], children: [] },
    ] },
  ])
  expect(normalizeSnapshot("- 'button \"Country: options\" [expanded]':\n  - option \"France\" [selected]")[0]).toMatchObject({ role: "button", name: "Country: options", states: ["[expanded]"] })

})
test("retain all AX roles, nesting, descriptions, states and numeric bounds", () => {
  const nodes: AXNode[] = [{ nodeId: "1", ignored: true, childIds: ["2"] }, {
    nodeId: "2", role: { value: "generic" }, childIds: ["3"],
  }, { nodeId: "3", role: { value: "spinbutton" }, name: { value: " Order   quantity " },
    description: { value: "At least one" }, value: { value: 3 }, properties: [
      ...["checked", "selected", "expanded", "pressed", "disabled", "required", "invalid", "modal", "focusable", "focused"].map((name) => ({ name, value: { value: true } })),
      ...["level", "valuemin", "valuemax", "valuenow"].map((name) => ({ name, value: { value: 3 } })),
    ] }]
  const tree: any = normalizeAX(nodes, "1")
  expect(tree[0].role).toBe("generic")
  expect(tree[0].children[0]).toMatchObject({ role: "spinbutton", name: "Order quantity", description: "At least one", value: 3 })
  expect(Object.keys(tree[0].children[0].properties)).toHaveLength(14)
  for (const key of ["role", "name", "description", "value", "children", "properties"]) {
    const changed = structuredClone(tree)
    changed[0].children[0][key] = "changed"
    expect(diffTree(tree, changed).length, key).toBeGreaterThan(0)
  }
})
test("allow one exact path while retaining sibling and state differences", () => {
  expect(diffTree({ role: "dialog", name: "Choices", properties: { modal: true } },
    { role: "dialog", name: "", properties: { modal: false } }, ["/name"])).toEqual(['/properties/modal: ours true; UI5 false'])
  expect(diffTree({ children: [{ name: "A" }, { name: "B" }] }, { children: [{ name: "C" }, { name: "D" }] }, ["/children/0/name"])).toEqual(['/children/1/name: ours "B"; UI5 "D"'])
})

test("hidden label and description targets preserve text, validity and order across DOM representations", () => {
  const make = (role: string, ignored: boolean, description = "Choose fruit", target = 3): AXNode[] => [{
    nodeId: "1", role: { value: "listitem" }, name: { value: "Apples" }, description: { value: "Choose fruit" }, properties: [
      { name: "labelledby", value: { relatedNodes: [{ backendDOMNodeId: 2, text: " Apples " }] } as any },
      { name: "describedby", value: { relatedNodes: [{ backendDOMNodeId: target, text: description }] } as any },
    ],
  }, { nodeId: "2", backendDOMNodeId: 2, role: { value: role }, ignored, name: { value: ignored ? "Apples" : "" } },
    { nodeId: "3", backendDOMNodeId: 3, role: { value: role }, ignored, name: { value: ignored ? description : "" } }]
  const ours = normalizeAX(make("generic", false), "1")
  expect(normalizeAX(make("none", true), "1")).toEqual(ours)
  expect(diffTree(ours, normalizeAX(make("none", true, "Choose vegetables"), "1"))).toContain('/0/properties/describedby/0/text: ours "Choose fruit"; UI5 "Choose vegetables"')
  expect(diffTree(ours, normalizeAX(make("none", true, "Choose fruit", 99), "1"))).toContain('/0/properties/describedby/0/valid: ours true; UI5 false')
  const reactSpan = make("generic", false), hiddenSpan = make("none", true)
  for (const nodes of [reactSpan, hiddenSpan]) delete (nodes[0].properties![1].value as any).relatedNodes[0].text
  reactSpan[2].childIds = ["4"]
  reactSpan.push({ nodeId: "4", role: { value: "StaticText" }, name: { value: "Choose fruit" } })
  expect(normalizeAX(reactSpan, "1")).toEqual(normalizeAX(hiddenSpan, "1"))
})


test("an allowed wrapper name never hides descendant role, name or state", () => {
  const ours = [{ role: "generic", name: "Ours", children: [{ role: "option", name: "France", states: ["[selected]"] }] }]
  const reference = [{ role: "generic", name: "Native", children: [{ role: "button", name: "Germany", states: ["[disabled]"] }] }]
  const diff = diffTree(ours, reference, ["/0/name"])
  expect(diff).toEqual([
    '/0/children/0/role: ours "option"; UI5 "button"',
    '/0/children/0/name: ours "France"; UI5 "Germany"',
    '/0/children/0/states/0: ours "[selected]"; UI5 "[disabled]"',
  ])
  expect(() => diffTree(ours, reference, ["/0"])).toThrow("cannot suppress a subtree")
  for (const path of ["/snapshot", "/ax"]) expect(() => diffTree({ snapshot: ours, ax: ours }, { snapshot: reference, ax: reference }, [path])).toThrow("cannot suppress a subtree")
})

test("capture the descriptions and numeric states ariaSnapshot does not serialize", async ({ page }) => {
  await page.setContent('<main><p id="limit">At least two units</p><input type="number" aria-label="Quantity" aria-describedby="limit" aria-invalid="true" min="2" max="9" value="3"></main>')
  const first = await captureAX(page, "main")
  const serialized = JSON.stringify(first.ax)
  expect(serialized).toContain('"description":"At least two units"')
  expect(serialized).toContain('"invalid":"true"')
  expect(serialized).toContain('"valuemin":2')
  expect(serialized).toContain('"valuemax":9')
  await page.locator("input").evaluate((input) => input.setAttribute("aria-describedby", "missing-description"))
  const second = await captureAX(page, "main")
  expect(diffTree(first.ax, second.ax).some((line) => line.includes("/description:"))).toBe(true)
})


test("explicit inert wrapper allowances compare every semantic descendant", () => {
  const option = { role: "option", name: "France", properties: { selected: true }, children: [] }
  const ours = { ax: [option] }
  const native = { ax: [{ role: "generic", name: "", properties: {}, children: [option] }] }
  const adjusted = applyAllowedWrappers(ours, native, ["/ui5/ax/0"])
  expect(diffTree(adjusted.ours, adjusted.ui5)).toEqual([])
  for (const [key, value] of [["role", "button"], ["name", "Germany"], ["properties", { selected: false }]] as const) {
    const changed = structuredClone(native)
    ;(changed.ax[0].children[0] as any)[key] = value
    const next = applyAllowedWrappers(ours, changed, ["/ui5/ax/0"])
    expect(diffTree(next.ours, next.ui5).length, key).toBeGreaterThan(0)
  }
  for (const changed of [
    { ...native.ax[0], role: "group" },
    { ...native.ax[0], name: "Countries" },
    { ...native.ax[0], description: "Choose a country" },
    { ...native.ax[0], properties: { live: "polite" } },
  ]) expect(() => applyAllowedWrappers(ours, { ax: [changed] }, ["/ui5/ax/0"])).toThrow("only an unnamed state-free generic wrapper")
})


test("implicit invalid=false allowance cannot conceal an actual invalid state", () => {
  const path = "/properties/invalid"
  expect(diffTree({ properties: { invalid: "false" } }, { properties: {} }, [path])).toEqual([])
  for (const invalid of ["true", "grammar", "spelling", false, true]) {
    expect(() => diffTree({ properties: { invalid } }, { properties: {} }, [path])).toThrow("requires invalid=false versus absence")
  }
  expect(() => diffTree({ properties: { invalid: "false" } }, { properties: { invalid: "true" } }, [path])).toThrow("requires invalid=false versus absence")
})

test("explicit shadow ownership relocation preserves complete nodes and actual AX differences", () => {
  const row = { role: "listitem", name: "Apples", states: ["[selected]"], children: [{ role: "button", name: "Edit", states: [], children: [] }] }
  const list = { role: "list", name: "Fruits", states: [] as string[], children: [row] }
  const header = { role: "listitem", name: "Fruits", states: [] as string[], children: [list] }
  const ax = [{ role: "list", name: "Fruits", properties: { owns: [{ role: "generic", name: "", ignored: false, valid: true }] }, children: [{ role: "listitem", name: "Apples", properties: { selected: true }, children: [{ role: "button", name: "Edit", properties: {}, children: [] }] }] }]
  const ours = { snapshot: [{ role: "list", name: "List", states: [], children: [header] }], ax }
  const native = structuredClone(ours)
  native.snapshot[0].children[0].children[0].children = []
  native.snapshot[0].children.push(row as any)
  const path = "/ui5/snapshot/0/children/0/children/0/children"
  const adjusted = applyAllowedWrappers(ours, native, [path])
  expect(diffTree(adjusted.ours, adjusted.ui5)).toEqual([])
  const changed = structuredClone(native)
  changed.ax[0].children[0].properties.selected = false
  const next = applyAllowedWrappers(ours, changed, [path])
  expect(diffTree(next.ours, next.ui5)).toContain('/ax/0/children/0/properties/selected: ours true; UI5 false')
  const snapshotChanged = structuredClone(native)
  snapshotChanged.snapshot[0].children[1].states = ["[disabled]"]
  const snapshotNext = applyAllowedWrappers(ours, snapshotChanged, [path])
  expect(diffTree(snapshotNext.ours, snapshotNext.ui5).some((line) => line.includes('/states/0:'))).toBe(true)
  const misplaced = structuredClone(native)
  misplaced.snapshot[0].children[1].name = "Pears"
  expect(() => applyAllowedWrappers(ours, misplaced, [path])).toThrow("must preserve the actual AX child roles, names and order")
  const noOwner = structuredClone(native)
  delete (noOwner.ax[0].properties as any).owns
  expect(() => applyAllowedWrappers(ours, noOwner, [path])).toThrow("requires a unique nonempty actual AX owner")
  const invalidOwner = structuredClone(native)
  invalidOwner.ax[0].properties.owns[0].valid = false
  expect(() => applyAllowedWrappers(ours, invalidOwner, [path])).toThrow("with valid targets")
})

test("case-declared Table loading relocation preserves complete overlay nodes and every unrelated channel", () => {
  const row = { role: "row", name: "Product", properties: {}, children: [] }
  const progress = { role: "progressbar", name: "Please wait", description: "Native detail", value: 3, properties: { valuemin: 0, valuemax: 100, focusable: true }, children: [{ role: "StaticText", name: "Nested detail", properties: {}, children: [] }] }
  const sentinel = { role: "generic", name: "", properties: { focusable: true }, children: [] }
  const grid = { role: "grid", name: "Products", properties: { busy: 1 }, children: [row, progress, sentinel] }
  const snapshotProgress = { role: "progressbar", name: "Please wait", states: ["[disabled]"], children: [{ role: "text", text: "Nested detail", states: [], children: [] }] }
  const native = { ax: [grid, sentinel], snapshot: [{ role: "grid", name: "Products", states: ["[disabled]"], children: [{ role: "row", name: "Product", states: [], children: [] }, snapshotProgress] }] }
  const declaration = { gridName: "Products", progressbarName: "Please wait", ax: "/ax/0/children/1", snapshot: "/snapshot/0/children/1" }
  const untouched = structuredClone(native)
  const moved = relocateTableLoadingOverlay(native, declaration)
  expect(native).toEqual(untouched)
  expect(moved.ax).toEqual([{ ...grid, children: [row] }, progress, sentinel, sentinel])
  expect(moved.snapshot).toEqual([{ ...native.snapshot[0], children: [native.snapshot[0].children[0]] }, snapshotProgress])
  const ours = structuredClone(moved)
  for (const [key, value] of [["role", "button"], ["name", "Other"], ["description", "Other detail"], ["value", 8], ["properties", { valuemin: 1 }], ["children", []]] as const) {
    const changed = structuredClone(ours)
    changed.ax[1][key] = value
    expect(diffTree(changed, moved).length, String(key)).toBeGreaterThan(0)
  }
  const changedGrid = structuredClone(ours)
  changedGrid.ax[0].properties.busy = undefined
  expect(diffTree(changedGrid, moved)).toContain('/ax/0/properties/busy: ours undefined; UI5 1')
  const changedSnapshot = structuredClone(ours)
  changedSnapshot.snapshot[1].states = []
  expect(diffTree(changedSnapshot, moved).some((line) => line.includes('/snapshot/1/states/0'))).toBe(true)
  for (const change of [
    (capture: any) => { capture.ax[0].name = "Other grid" },
    (capture: any) => { capture.ax[0].children[1].name = "Other spinner" },
    (capture: any) => { capture.ax[0].children.push(row) },
    (capture: any) => { capture.ax.push(progress) },
    (capture: any) => { capture.ax[0].children[2].properties.busy = 1 },
    (capture: any) => { capture.snapshot[0].children.push(snapshotProgress) },
  ]) {
    const changed = structuredClone(native); change(changed)
    expect(() => relocateTableLoadingOverlay(changed, declaration)).toThrow(/Table loading relocation requires/)
  }
  expect(() => relocateTableLoadingOverlay(native, { ...declaration, ax: "/ax/9/children/1" })).toThrow("exact named grid")
})
