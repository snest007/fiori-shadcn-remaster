import type { ArgTypes } from "@storybook/react-vite"
import data from "virtual:fiori-demo-metadata"

/** Explicit argTypes override docgen descriptions, retaining handwritten docs guidance. */
export function fioriArgTypes(name: string, exportName: string): ArgTypes {
  return Object.fromEntries((data.metadata[name]?.props ?? [])
    .filter((prop) => prop.name.startsWith(`${exportName}.`))
    .map((prop) => [prop.name.slice(exportName.length + 1), {
      description: prop.description,
      table: { type: { summary: prop.type }, ...(prop.defaultValue === undefined ? {} : { defaultValue: { summary: prop.defaultValue } }) },
    }]))
}

export const hiddenArgs: ArgTypes = Object.fromEntries([
  "className", "asChild", "ref", "children", "style", "wrapperClassName",
].map((name) => [name, { table: { disable: true }, control: false }]))
