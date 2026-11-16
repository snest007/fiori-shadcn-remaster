import * as React from "react"
import { ArgTypes, Controls, Primary, Stories, Title, useOf } from "@storybook/addon-docs/blocks"
import { Button } from "@/components/ui/button"
import { docsLink } from "./meta"

interface Item {
  title: string
  description: string
  usage?: { summary: string; useWhen: string[]; avoidWhen: { when: string; use: string[] }[] }
}
// Vite JSON imports keep registry descriptions and optional G0 usage as the owning source.
const items = import.meta.glob<Item>("../../../registry/items/*.json", { eager: true, import: "default" })

export function DocsPage() {
  const { preparedMeta } = useOf("meta", ["meta"])
  const name = preparedMeta.parameters.fiori?.name as string | undefined
  const item = name ? items[`../../../registry/items/${name}.json`] : undefined
  const [copied, setCopied] = React.useState(false)
  if (!item || !name) return null
  const command = `npx shadcn add @fiori/${name}`
  return <>
    <Title />
    <p>{item.description}</p>
    <section aria-label="Install component" className="mb-6">
      <div className="flex items-center gap-3"><pre><code>{command}</code></pre>
        <Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button>
      </div>
      <span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span>
    </section>
    {item.usage && <section aria-label="Usage guidance">
      <p>{item.usage.summary}</p>
      <h2>When to use</h2><ul>{item.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul>
      <h2>Don't use</h2><ul>{item.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}
        {entry.use.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}
      </li>)}</ul>
    </section>}
    <h2>Playground</h2><Primary /><Controls />
    <h2>Props</h2><ArgTypes />
    <Stories includePrimary={false} title="Variants and examples" />
  </>
}
