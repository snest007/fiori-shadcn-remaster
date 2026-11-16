import { toId, storyNameFromExport } from "storybook/internal/csf"
import type { StorybookConfig } from "@storybook/react-vite"
import { readDemoMetadata, storyItemOptions } from "./demo-metadata"

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../docs/stories/**/*.stories.tsx", "../docs/stories/**/*.mdx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  core: { disableTelemetry: true, builder: { name: "@storybook/builder-vite", options: { viteConfigPath: ".storybook/vite.config.ts" } } },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: { shouldExtractLiteralValuesFromEnum: true, shouldRemoveUndefinedFromOptional: true },
  },
  docs: { defaultName: "Docs" },
  // CSF's static indexer cannot evaluate a meta helper. Retain its story/source indexing,
  // then derive the same sidebar title and autodocs tag from the parsed owning demo.
  experimental_indexers: async (indexers) => (indexers ?? []).map((indexer) => ({
    ...indexer,
    createIndex: async (file, options) => {
      const entries = await indexer.createIndex(file, options)
      const story = storyItemOptions(file)
      const name = story.name
      if (!name) return entries
      const item = readDemoMetadata().metadata[name]
      if (!item) throw new Error(`No owning demo for ${name}`)
      if (story.category && story.category !== item.category) throw new Error(`Category does not match the owning demo for ${name}`)
      const title = `${item.category}/${story.title ?? item.title}`
      const metaId = toId(`${item.category}/${name}`)
      return entries.map((entry) => ({ ...entry, title, metaId, __id: toId(metaId, entry.name ?? storyNameFromExport(entry.exportName)), tags: [...new Set([...(entry.tags ?? []), "autodocs"])] }))
    },
  })),
}
export default config
