import * as React from "react"
import { VariantManagement, type VariantItem } from "@/components/ui/variant-management"
import { defineFixtures } from "../fixture-types"

type Props = { state: "trigger" | "list" | "list-empty" | "save" | "save-error" | "manage" | "manage-error" | "save-contexts" | "manage-contexts" | "roles" | "error-open"; modified?: boolean; error?: boolean }
const baseItems: VariantItem[] = [
  { key: "standard", title: "Standard", rename: false, remove: false, favorite: true, author: "SAP" },
  { key: "personal", title: "My View", rename: true, remove: true, changeable: true, favorite: true, author: "Me" },
  { key: "public", title: "Shared View", sharing: "Public", rename: true, remove: true, changeable: true, favorite: true, executeOnSelect: true, author: "Alex" },
  { key: "other", title: "Other View", rename: true, remove: true, favorite: false, author: "Me" },
]
const listItems: VariantItem[] = [baseItems[0], ...Array.from({ length: 10 }, (_, i) => ({ key: `view-${i + 1}`, title: `View ${String(i + 1).padStart(2, "0")}`, favorite: true, rename: true, remove: true, changeable: true, author: "Me" }))]
const roles = [{ key: "sales-role", title: "Sales Team" }, { key: "admin-role", title: "Administrators" }]
const contextItems = baseItems.map((item) => ({ ...item, contexts: { role: item.key === "public" ? ["sales-role"] : [] } }))

function Fixture({ state, modified, error }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const input = ref.current?.querySelector<HTMLInputElement>(state === "list-empty" ? 'input[type="search"]' : state === "save-error" ? '.fiori-vm-name input' : state === "manage-error" ? '[data-variant-name="personal"]' : "[data-never]")
    if (input) {
      // Exercise React's public input event path, just as the reference calls liveChange.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, state === "list-empty" ? "unmatched" : "Shared View")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }
    if (state === "roles") {
      ref.current?.querySelector<HTMLButtonElement>('[aria-label="Change Visibility for Shared View"]')?.click()
      // Nested Dialog autofocus runs when its surface mounts. Freeze its visual
      // fixture only after that render boundary, as the SAPUI5 helper does.
      const frame = requestAnimationFrame(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
      return () => cancelAnimationFrame(frame)
    }
    document.activeElement instanceof HTMLElement && document.activeElement.blur()
  }, [state])
  const overlay = state !== "trigger"
  const contexts = state.endsWith("contexts") || state === "roles"
  const open = state.startsWith("list") || state === "error-open" ? "list" : state.startsWith("save") ? "save" : state.startsWith("manage") || state === "roles" ? "manage" : undefined
  return <div ref={ref} className={overlay ? "fiori-vm-fixture-surface" : undefined} data-vm-fixture-overlay={overlay ? "" : undefined} data-vm-fixture-roles={state === "roles" ? "" : undefined}>
    <VariantManagement items={state.startsWith("list") ? listItems : contexts ? contextItems : baseItems} selectedKey={state.startsWith("list") ? "standard" : "personal"}
      defaultKey="standard" modified={modified} inErrorState={error || state === "error-open"} defaultOpen={open} portal={false}
      supportContexts={contexts} roles={roles} />
  </div>
}

export default defineFixtures<Props>({
  name: "variant-management",
  cases: [
    { id: "variant-management-trigger", props: { state: "trigger" } },
    { id: "variant-management-modified", props: { state: "trigger", modified: true } },
    { id: "variant-management-error", props: { state: "trigger", error: true } },
    { id: "variant-management-list-search", props: { state: "list" } },
    { id: "variant-management-list-no-results", props: { state: "list-empty" } },
    { id: "variant-management-save-options", props: { state: "save" } },
    { id: "variant-management-save-duplicate", props: { state: "save-error" } },
    { id: "variant-management-manage", props: { state: "manage" } },
    { id: "variant-management-manage-rename-error", props: { state: "manage-error" } },
    { id: "variant-management-save-contexts", props: { state: "save-contexts" } },
    { id: "variant-management-manage-contexts", props: { state: "manage-contexts" } },
    { id: "variant-management-roles-open", props: { state: "roles" } },
    { id: "variant-management-error-open", props: { state: "error-open" } },
  ], react: (props) => <Fixture {...props} />,
})
