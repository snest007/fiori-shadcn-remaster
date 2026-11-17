import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { build } from "vite"

const root = fileURLToPath(new URL("../", import.meta.url))

export async function buildHtmlContextFixture(worker: string | number) {
  // Exercise the real decorator and fioriMeta without registering S2's incoming
  // stories in SX. These are the same public HeaderFooter and Empty arguments.
  const source = resolve(root, `.integration/SX-html-context-evidence/html-context-fixture-${worker}`)
  const output = resolve(root, `storybook-static/sx-html-context-${worker}`)
  await mkdir(source, { recursive: true })
  await writeFile(resolve(source, "index.html"), '<!doctype html><html lang="en"><head><title>Storybook HTML context</title></head><body><div id="storybook-root"></div><script type="module" src="virtual:sx-html-context"></script></body></html>')
  await build({
    root: source,
    configFile: resolve(root, ".storybook/vite.config.ts"),
    base: "./",
    logLevel: "warn",
    plugins: [{
      name: "sx-html-context-fixture",
      resolveId: (id) => id === "virtual:sx-html-context" ? "\0sx-html-context" : undefined,
      load: (id) => id === "\0sx-html-context" ? `
        import { createElement as h, Fragment } from "react";
        import { createRoot } from "react-dom/client";
        import { composeStory } from "@storybook/react-vite";
        import preview from ${JSON.stringify(resolve(root, ".storybook/preview.tsx"))};
        import { fioriMeta } from ${JSON.stringify(resolve(root, "docs/stories/_lib/meta.ts"))};
        import { List, ListItemStandard } from ${JSON.stringify(resolve(root, "registry/ui/list.tsx"))};
        import { Tree, TreeItem } from ${JSON.stringify(resolve(root, "registry/ui/tree.tsx"))};
        const params = new URLSearchParams(location.search);
        const kind = params.get("kind");
        const ExplicitLandmarks = () => h(Fragment, null,
          h("header", { role: "banner", "aria-label": "Explicit banner" }, "Explicit banner"),
          h("button", null, "Save"),
          h("footer", { role: "contentinfo", "aria-label": "Explicit footer" }, "Explicit footer"));
        const LandmarkPage = () => h(Fragment, null,
          h("header", null, h("h2", null, "Application header")),
          h("main", { "aria-label": "Application content", "data-slot": "owned-main" },
            h("p", null, "Review purchase orders."), h("button", null, "Save")),
          h("footer", null, "Application footer"));
        let meta, args, name;
        if (kind === "explicit-roles") {
          meta = fioriMeta({ name: "button", component: ExplicitLandmarks });
          args = {}; name = "ExplicitRoles";
        } else if (kind === "owned-landmarks") {
          const base = fioriMeta({ name: "page", component: LandmarkPage });
          meta = { ...base, parameters: { ...base.parameters, fiori: { ...base.parameters.fiori, ownsLandmarks: true } } };
          args = {}; name = "OwnedLandmarks";
        } else if (kind === "tree-header-footer") {
          meta = fioriMeta({ name: "tree", component: Tree });
          args = { headerText: "Files", footerText: "Shared workspace", "aria-label": "Files", selectionMode: "multiple", defaultValue: ["reports"],
            children: [h(TreeItem, { key: "docs", value: "docs", text: "Documents", defaultExpanded: true },
              h(TreeItem, { value: "reports", text: "Reports" })), h(TreeItem, { key: "notes", value: "notes", text: "Notes.txt" })] };
          name = "HeaderFooter";
        } else {
          meta = fioriMeta({ name: "list", component: List });
          name = kind === "list-empty" ? "Empty" : kind === "listbox" ? "Listbox" : "HeaderFooter";
          args = kind === "list-empty" ? { headerText: "Products", noDataText: "No products available", "aria-label": "Products" }
            : { headerText: "Fruits", footerText: "Fresh produce", "aria-label": "Products",
                ...(kind === "listbox" ? { accessibleRole: "listbox", selectionMode: "multiple", defaultValue: ["bananas"] } : {}),
                children: ["Apples", "Bananas", "Cherries"].map((text) => h(ListItemStandard, { key: text, value: text.toLowerCase(), text })) };
        }
        meta = { ...meta, parameters: { ...meta.parameters, layout: "fullscreen" } };
        const Story = composeStory({ args, globals: { theme: params.get("theme") ?? "sap_horizon", density: params.get("density") ?? "cozy", dir: params.get("dir") ?? "ltr" } }, meta, preview, name);
        createRoot(document.getElementById("storybook-root")).render(h(Story));
      ` : undefined,
    }],
    build: { outDir: output, emptyOutDir: true, rollupOptions: { input: resolve(source, "index.html") } },
  })
  return `/sx-html-context-${worker}/index.html`
}
