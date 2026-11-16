import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { aliases } from "../vite.aliases"
import { demoMetadataPlugin } from "./demo-metadata"
import { storySourcePlugin } from "./story-source"

export default defineConfig({
  plugins: [react(), tailwindcss(), demoMetadataPlugin(), storySourcePlugin()],
  resolve: { alias: aliases },
})
