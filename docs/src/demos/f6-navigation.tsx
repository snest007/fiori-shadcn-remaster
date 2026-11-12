import * as React from "react"

import { Button } from "@/components/ui/button"
import { useF6Navigation } from "@/lib/fiori-f6"

import { defineDemo } from "./types"

function F6NavigationDemo() {
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null)
  const [enabled, setEnabled] = React.useState(true)
  const [focused, setFocused] = React.useState("None")
  useF6Navigation(enabled ? root : null)
  return (
    <div id="f6-navigation-demo" className="grid gap-4">
      <p className="m-0 text-(--sapContent_LabelColor)">Focus a button below, then use F6 or Shift+F6 to move between page regions. Ctrl/Meta+Alt+Down/Up also work.</p>
      <Button onClick={() => setEnabled((value) => !value)}>{enabled ? "Disable navigation" : "Enable navigation"}</Button>
      <div ref={setRoot} className="grid gap-4" onFocusCapture={(event) => setFocused((event.target as HTMLElement).closest<HTMLElement>("[data-region]")?.dataset.region ?? "None")}>
        {["Page title", "Filter header", "Content", "Footer"].map((region, index) => (
          <section key={region} data-region={region} data-sap-ui-fastnavgroup="true" className="grid gap-2">
            <strong>{region}</strong>
            <div className="flex gap-2">
              <Button id={`f6-navigation-${index}-first`}>First action</Button>
              <Button id={`f6-navigation-${index}-second`} variant="transparent">Second action</Button>
            </div>
          </section>
        ))}
      </div>
      <p className="m-0 text-(--sapContent_LabelColor)" aria-live="polite">Focused region: {focused}</p>
    </div>
  )
}

export default defineDemo({
  category: "Navigation", title: "F6 navigation", order: 86,
  docs: [{
    name: "f6-navigation",
    description: "Opt-in UI5 fast navigation between page groups. This example installs only on its four regions; floorplan blocks install on document so their portalled Popup scopes participate.",
    props: [
      { name: "installF6Navigation(root)", type: "Document | HTMLElement | ShadowRoot", defaultValue: "document", description: "Install navigation and return an idempotent cleanup; duplicate and overlapping roots share one coordinator." },
      { name: "useF6Navigation(root)", type: "Document | HTMLElement | ShadowRoot | null", defaultValue: "document", description: "Install after mount and clean up on root change/unmount; null disables it. Safe to server-render." },
      { name: "data-sap-ui-fastnavgroup", type: '"true" | "false"', description: "Mark application shell, navigation, title, header, content and footer regions in DOM order. Native-equivalent components mark their own groups; static/empty and hidden/inert regions are skipped." },
      { name: "data-sap-ui-fastnavgroup-container", type: '"true"', description: "Bound navigation to the nearest scope. Popup components supply this automatically; explicit inner groups cycle inside modal and nonmodal popups." },
    ],
  }], Demo: F6NavigationDemo,
})
