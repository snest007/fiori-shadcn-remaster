import { toId } from "storybook/internal/csf"
import type * as React from "react"
import data from "virtual:fiori-demo-metadata"
import { fioriArgTypes, hiddenArgs } from "./argTypes"

// scripts/build-registry-json.mjs assigns registry:block to these owning items.
// Blocks have no defineDemo metadata; keep their registered title and Floorplans category.
const blocks = import.meta.glob<{ title: string }>("../../../registry/block-items/*.json", { eager: true, import: "default" })

export function fioriMeta<C extends React.ComponentType<any>>({ name, component, category, title }: {
  name: string; component: C; category?: string; title?: string
}) {
  const block = blocks[`../../../registry/block-items/${name}.json`]
  const item = block ? { category: "Floorplans", title: block.title } : data.metadata[name]
  if (!item) throw new Error(`No owning demo for @fiori/${name}`)
  if (category && category !== item.category) throw new Error(`Category does not match the owning demo for ${name}`)
  return {
    id: toId(`${item.category}/${name}`),
    title: `${item.category}/${title ?? item.title}`,
    component,
    tags: ["autodocs"],
    argTypes: { ...fioriArgTypes(name, component.displayName ?? component.name), ...hiddenArgs },
    parameters: { fiori: { name, ...(block ? { ownsLandmarks: true } : {}) } },
  }
}

export function docsLink(name: string) {
  const item = data.metadata[name]
  if (!item) return undefined
  const id = toId(`${item.category}/${name}`)
  // Docs also render in iframe.html; target the sibling manager with _top links.
  return `./?path=/docs/${id}--docs`
}
