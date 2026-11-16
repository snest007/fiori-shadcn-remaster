import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Markdown, Primary, Title, useOf } from "@storybook/addon-docs/blocks"
import documentation from "virtual:fiori-demo-metadata"
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
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const name = preparedMeta.parameters.fiori?.name as string | undefined
  const item = name ? items[`../../../registry/items/${name}.json`] : undefined
  const [copied, setCopied] = React.useState(false)
  if (!item || !name) return null
  const command = `npx shadcn add @fiori/${name}`
  const guide = documentation.documentation[name]
  return <main>
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
    <section aria-label="Accessibility"><h2>Accessibility</h2>
      <ul>{guide?.accessibility.map((note) => <li key={note}>{note}</li>)}</ul>
      {guide?.audit && <Markdown>{guide.audit}</Markdown>}
    </section>
    <section aria-label="Localization"><h2>Localization</h2>
      {guide?.textKeys.length ? <table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>
        {guide.textKeys.map((text) => <tr key={`${text.prop}.${text.key}`}><td><code>{text.prop}.{text.key}</code></td><td>{text.ui5Keys.length ? text.ui5Keys.join(", ") : "Application text; no matching UI5 2.28 key"}</td><td>{text.defaultText}</td></tr>)}
      </tbody></table> : <p>Provide the action content and accessible name through the component's native props.</p>}
    </section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Props</h2><ArgTypes />
    <h2>Variants and examples</h2>
    {/* StoriesImpl forces initial args, which prevents controlled variants from
        updating. Each DocsStory retains its own args and live useArgs callbacks. */}
    {variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
