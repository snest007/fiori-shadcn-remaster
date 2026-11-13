// Full-page preview of one block: block.html?name=<block>&theme=…&density=…
// Each registry/blocks/<name>.tsx default-exports its page component.
import * as React from "react"
import { createRoot } from "react-dom/client"

import { readPageOptions } from "./fixture-types"
import "./index.css"

const blocks = import.meta.glob<{ default: React.ComponentType }>("../../registry/blocks/*.tsx", { eager: true })
const byName = Object.fromEntries(Object.entries(blocks).map(([p, m]) => [p.split("/").pop()!.replace(/\.tsx$/, ""), m.default]))

const opts = readPageOptions()
document.documentElement.dataset.theme = opts.theme
document.documentElement.dataset.density = opts.density
const name = new URLSearchParams(location.search).get("name") ?? ""
const Block = byName[name]

function Index() {
  return (
    <main className="p-6">
      <h1 className="mb-4 font-(family-name:--sapFontBoldFamily) text-(length:--sapFontHeader3Size)">Blocks</h1>
      <ul className="grid gap-2">
        {Object.keys(byName).map((n) => (
          <li key={n}><a className="text-(--sapLinkColor) underline" href={`${import.meta.env.BASE_URL}block.html?name=${n}`}>{n}</a></li>
        ))}
      </ul>
    </main>
  )
}

function Ready({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    document.fonts.ready.then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  return <>{children}</>
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Ready>{Block ? <Block /> : <Index />}</Ready>
  </React.StrictMode>
)
