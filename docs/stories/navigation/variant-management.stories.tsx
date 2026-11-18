import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn, expect, userEvent, within } from "storybook/test"
import { VariantManagement, type VariantManagementProps, type VariantItem } from "@/components/ui/variant-management"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const views: VariantItem[] = [{ key: "standard", title: "Standard", rename: false, remove: false, author: "SAP" }, { key: "personal", title: "My view", changeable: true, rename: true, remove: true, author: "Alex" }, { key: "public", title: "Shared view", changeable: true, rename: true, remove: true, author: "Morgan", sharing: "Public" }, { key: "other", title: "Other view", favorite: false, changeable: true, remove: true, author: "Alex" }]
const base = fioriMeta({ name: "variant-management", component: VariantManagement })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { items: views, selectedKey: "personal", defaultKey: "standard", modified: false, supportDefault: true, supportFavorites: true, supportApplyAutomatically: true, supportPublic: true, supportContexts: false, showSaveAs: true, creationAllowed: true, showFooter: true, inErrorState: false, popoverTitle: "My Views", level: "Auto", titleStyle: "Auto", roles: [{ key: "sales-role", title: "Sales team" }, { key: "admin-role", title: "Administrators" }], onSelect: fn(), onSave: fn(), onManage: fn(), onManageCancel: fn(), onCancel: fn() },
  argTypes: { ...base.argTypes, items: { control: "object" }, selectedKey: { control: "text" }, defaultKey: { control: "text" }, modified: { control: "boolean" }, supportDefault: { control: "boolean" }, supportFavorites: { control: "boolean" }, supportApplyAutomatically: { control: "boolean" }, supportPublic: { control: "boolean" }, supportContexts: { control: "boolean" }, showSaveAs: { control: "boolean" }, creationAllowed: { control: "boolean" }, showFooter: { control: "boolean" }, inErrorState: { control: "boolean" }, popoverTitle: { control: "text" }, level: { control: "select", options: ["Auto", "H1", "H2", "H3", "H4", "H5", "H6"] }, titleStyle: { control: "select", options: ["Auto", "H1", "H2", "H3", "H4", "H5", "H6"] }, maxWidth: { control: "text" }, defaultOpen: { control: "select", options: [undefined, "list", "save", "manage"] }, portal: { control: false }, texts: { control: false }, roles: { control: "object" }, onSelect: { control: false }, onSave: { control: false }, onManage: { control: false }, onManageCancel: { control: false }, onCancel: { control: false } },
  render: function SavedViews(args: VariantManagementProps) {
    const [, updateArgs] = useArgs<VariantManagementProps>()
    const current = React.useRef(args)
    // Controls are authoritative when replacing/resetting data. Commit the next snapshot
    // synchronously too, so multiple callbacks before a Storybook rerender keep every view.
    current.current = args
    const allocatedKeys = React.useRef(new Set<string>())
    for (const item of args.items) allocatedKeys.current.add(item.key)
    const commit = (patch: Partial<VariantManagementProps>) => {
      current.current = { ...current.current, ...patch }
      updateArgs(patch)
    }
    return <VariantManagement key={args.defaultOpen} {...args}
      onSelect={(event) => { current.current.onSelect?.(event); commit({ selectedKey: event.key, modified: false }) }}
      onSave={(event) => {
        const state = current.current
        state.onSave?.(event)
        if (event.overwrite) { commit({ modified: false }); return }
        // registry/lib/fiori-variants.ts#saveVariant uses crypto.randomUUID. Keep
        // allocated identities reserved even after deletion or a Controls data reset.
        let key: string
        do { key = globalThis.crypto.randomUUID() } while (allocatedKeys.current.has(key) || state.items.some((item) => item.key === key))
        allocatedKeys.current.add(key)
        commit({ items: [...state.items, { key, title: event.name, changeable: true, remove: true, author: "You", executeOnSelect: event.execute, sharing: event.public ? "Public" : "Private", contexts: event.contexts }], selectedKey: key, defaultKey: event.def ? key : state.defaultKey, modified: false })
      }}
      onManage={(event) => {
        const state = current.current
        state.onManage?.(event)
        const items = state.items.filter((item) => !event.deleted?.includes(item.key)).map((item) => ({ ...item, title: event.renamed?.find((change) => change.key === item.key)?.name ?? item.title, favorite: event.fav?.find((change) => change.key === item.key)?.visible ?? item.favorite, executeOnSelect: event.exe?.find((change) => change.key === item.key)?.exe ?? item.executeOnSelect, contexts: event.contexts?.find((change) => change.key === item.key)?.contexts ?? item.contexts }))
        // OpenUI5 VariantManager.js#switchToDefaultIfCurrentVariantIsDeleted:
        // the same Manage event's new default wins, else use the current default.
        const requestedDefault = event.def ?? state.defaultKey
        const defaultKey = items.find((item) => item.key === requestedDefault && item.visible !== false)?.key
          ?? items.find((item) => item.key === "standard")?.key ?? items.find((item) => item.visible !== false)?.key ?? ""
        const selectedWasDeleted = event.deleted?.includes(state.selectedKey ?? "") ?? false
        // OpenUI5 VariantManagementState.js derives modified from the current view's
        // own unsaved controlChanges. Like fiori-variants.ts#manageVariants, loading
        // the fallback restores its saved state. This metadata-only example retains
        // no per-view unsaved state, so that fallback is clean; a surviving selection
        // keeps its current draft flag through unrelated Manage changes.
        const modified = selectedWasDeleted ? false : state.modified
        commit({ items, defaultKey, selectedKey: selectedWasDeleted ? defaultKey : state.selectedKey, modified })
      }} />
  },
} satisfies Meta<typeof VariantManagement>
export default meta
type Story = StoryObj<typeof meta>
const isolated = { docs: { story: { inline: false, height: "600px" } } }
export const Playground: Story = {}
export const Modified: Story = { args: { modified: true } }
export const Error: Story = { args: { inErrorState: true } }
export const Open: Story = { args: { defaultOpen: "list" }, parameters: isolated }
export const SearchableList: Story = { args: { defaultOpen: "list", selectedKey: "standard", items: [views[0], ...Array.from({ length: 10 }, (_, index) => ({ key: `view-${index}`, title: `View ${index + 1}`, changeable: true, remove: true, author: "Alex" }))] }, parameters: isolated }
export const EmptyList: Story = { args: { defaultOpen: "list", items: [], selectedKey: "" }, parameters: isolated }
export const SaveOptions: Story = { args: { defaultOpen: "save" }, parameters: isolated }
export const Manage: Story = { args: { defaultOpen: "manage" }, parameters: isolated }
export const SaveContexts: Story = { args: { defaultOpen: "save", supportContexts: true }, parameters: isolated }
export const ManageContexts: Story = { args: { defaultOpen: "manage", supportContexts: true, items: views.map((item) => ({ ...item, contexts: { role: item.key === "public" ? ["sales-role"] : [] } })) }, parameters: isolated }
export const ErrorOpen: Story = { args: { defaultOpen: "list", inErrorState: true }, parameters: isolated }
export const NoSearchResults: Story = { ...SearchableList, args: { defaultOpen: "list", selectedKey: "standard", items: [views[0], ...Array.from({ length: 10 }, (_, index) => ({ key: `view-${index}`, title: `View ${index + 1}`, changeable: true, remove: true, author: "Alex" }))] }, parameters: isolated, play: async ({ canvasElement }) => { const field = within(canvasElement.ownerDocument.body).getByRole("searchbox", { name: "Search" }); await userEvent.type(field, "unmatched"); await expect(within(canvasElement.ownerDocument.body).getByText("No views found", { exact: true })).toBeVisible() } }
export const SaveDuplicate: Story = { args: { defaultOpen: "save" }, parameters: isolated, play: async ({ canvasElement }) => { const dialog = within(canvasElement.ownerDocument.body).getByRole("dialog", { name: "Save View" }); const field = within(dialog).getByRole("textbox", { name: /^View:?$/ }); await userEvent.clear(field); await userEvent.type(field, "Shared view"); await expect(field).toHaveAttribute("aria-invalid", "true") } }
export const ManageRenameError: Story = { args: { defaultOpen: "manage" }, parameters: isolated, play: async ({ canvasElement }) => { const field = canvasElement.ownerDocument.querySelector<HTMLInputElement>('[data-variant-name="personal"]')!; await userEvent.clear(field); await userEvent.type(field, "Shared view"); await expect(field).toHaveAttribute("aria-invalid", "true") } }
export const RolesOpen: Story = { args: { defaultOpen: "manage", supportContexts: true, items: views.map((item) => ({ ...item, contexts: { role: item.key === "public" ? ["sales-role"] : [] } })) }, parameters: isolated, play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", { name: "Change Visibility for Shared view" })); await expect(within(canvasElement.ownerDocument.body).getByRole("dialog", { name: "Select Roles" })).toBeVisible() } }
export const Heading: Story = { args: { level: "H3", titleStyle: "H1" } }
export const NarrowTitle: Story = { args: { maxWidth: "8rem" } }
export const CustomTexts: Story = { args: { texts: { SAVE: "Save order view", SAVEAS: "Create order view", MANAGE: "Manage order views", NAME: "Order view", SAVEDIALOG: "Save order view", MANAGEDIALOG: "Manage order views", VARIANTS: "Order views", TRIGGER_TT: "Choose order view" } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/variant-management.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.SAVE",
    "VARIANT_MANAGEMENT_SAVE",
    "Save"
  ],
  [
    "texts.SAVE_TT",
    "VARIANT_MANAGEMENT_SAVE_TT",
    "CTRL + Enter"
  ],
  [
    "texts.SAVE_TT_MAC",
    "VARIANT_MANAGEMENT_SAVE_TT_MAC",
    "CMD + Enter"
  ],
  [
    "texts.SAVE_MAIN_TT",
    "VARIANT_MANAGEMENT_SAVE_MAIN_TT",
    "CTRL + S"
  ],
  [
    "texts.SAVE_MAIN_TT_MAC",
    "VARIANT_MANAGEMENT_SAVE_MAIN_TT_MAC",
    "CMD + S"
  ],
  [
    "texts.SAVEAS",
    "VARIANT_MANAGEMENT_SAVEAS",
    "Save As"
  ],
  [
    "texts.OK",
    "VARIANT_MANAGEMENT_OK",
    "OK"
  ],
  [
    "texts.CANCEL",
    "VARIANT_MANAGEMENT_CANCEL",
    "Cancel"
  ],
  [
    "texts.MANAGE",
    "VARIANT_MANAGEMENT_MANAGE",
    "Manage"
  ],
  [
    "texts.NAME",
    "VARIANT_MANAGEMENT_NAME",
    "View"
  ],
  [
    "texts.SETASDEFAULT",
    "VARIANT_MANAGEMENT_SETASDEFAULT",
    "Set as Default"
  ],
  [
    "texts.SETASPUBLIC",
    "VARIANT_MANAGEMENT_SETASPUBLIC",
    "Public"
  ],
  [
    "texts.VARIANTTYPE",
    "VARIANT_MANAGEMENT_VARIANTTYPE",
    "Sharing"
  ],
  [
    "texts.PUBLIC",
    "VARIANT_MANAGEMENT_PUBLIC",
    "Public"
  ],
  [
    "texts.PRIVATE",
    "VARIANT_MANAGEMENT_PRIVATE",
    "Private"
  ],
  [
    "texts.SAVEDIALOG",
    "VARIANT_MANAGEMENT_SAVEDIALOG",
    "Save View"
  ],
  [
    "texts.MANAGEDIALOG",
    "VARIANT_MANAGEMENT_MANAGEDIALOG",
    "Manage Views"
  ],
  [
    "texts.NODATA_FOUND",
    "VARIANT_MANAGEMENT_NODATA_FOUND",
    "No views found"
  ],
  [
    "texts.NODATA_FOUND_DESCR",
    "VARIANT_MANAGEMENT_NODATA_FOUND_DESCR",
    "Try adjusting the search criteria."
  ],
  [
    "texts.NODATA",
    "VARIANT_MANAGEMENT_NODATA",
    "No views available"
  ],
  [
    "texts.NODATA_DESCR",
    "VARIANT_MANAGEMENT_NODATA_DESCR",
    "Please create views."
  ],
  [
    "texts.DEFAULT",
    "VARIANT_MANAGEMENT_DEFAULT",
    "Default"
  ],
  [
    "texts.EXECUTEONSELECT",
    "VARIANT_MANAGEMENT_EXECUTEONSELECT",
    "Apply Automatically"
  ],
  [
    "texts.AUTHOR",
    "VARIANT_MANAGEMENT_AUTHOR",
    "Created By"
  ],
  [
    "texts.FAVORITE_COLUMN",
    "VARIANT_MANAGEMENT_FAVORITE_COLUMN",
    "Favorite"
  ],
  [
    "texts.ACTION_COLUMN",
    "VARIANT_MANAGEMENT_ACTION_COLUMN",
    "Action"
  ],
  [
    "texts.SEL_VARIANT",
    "VARIANT_MANAGEMENT_SEL_VARIANT",
    "View {0}."
  ],
  [
    "texts.SEL_VARIANT_MOD",
    "VARIANT_MANAGEMENT_SEL_VARIANT_MOD",
    "Modified view {0}."
  ],
  [
    "texts.VARIANTS",
    "VARIANT_MANAGEMENT_VARIANTS",
    "My Views"
  ],
  [
    "texts.ERROR_DUPLICATE",
    "VARIANT_MANAGEMENT_ERROR_DUPLICATE",
    "The view name already exists. Please enter a different name."
  ],
  [
    "texts.ERROR_DUPLICATE_SAVE",
    "VARIANT_MANAGEMENT_ERROR_DUPLICATE_SAVE",
    "The view name already exists. Please enter a different name or re-check without active search."
  ],
  [
    "texts.ERROR_EMPTY",
    "VARIANT_MANAGEMENT_ERROR_EMPTY",
    "Please enter a name."
  ],
  [
    "texts.NOT_ALLOWED_CHAR",
    "VARIANT_MANAGEMENT_NOT_ALLOWED_CHAR",
    "Character {0} not allowed for view names"
  ],
  [
    "texts.MAX_LEN",
    "VARIANT_MANAGEMENT_MAX_LEN",
    "View names are restricted to {0} characters"
  ],
  [
    "texts.TRIGGER_TT",
    "VARIANT_MANAGEMENT_TRIGGER_TT",
    "Select View"
  ],
  [
    "texts.DELETE",
    "VARIANT_MANAGEMENT_DELETE",
    "Delete View"
  ],
  [
    "texts.FAV_ADD_ACC",
    "VARIANT_MANAGEMENT_FAV_ADD_ACC",
    "Favorite icon not checked"
  ],
  [
    "texts.FAV_DEL_ACC",
    "VARIANT_MANAGEMENT_FAV_DEL_ACC",
    "Favorite icon checked"
  ],
  [
    "texts.FAV_DEL_TOOLTIP",
    "VARIANT_MANAGEMENT_FAV_DEL_TOOLTIP",
    "Selected as Favorite"
  ],
  [
    "texts.FAV_ADD_TOOLTIP",
    "VARIANT_MANAGEMENT_FAV_ADD_TOOLTIP",
    "Unselected as Favorite"
  ],
  [
    "texts.ERROR_TEXT1",
    "VARIANT_MANAGEMENT_ERROR_TEXT1",
    "Unable to load the data."
  ],
  [
    "texts.ERROR_TEXT2",
    "VARIANT_MANAGEMENT_ERROR_TEXT2",
    "This can happen if you are not connected to the Internet, or if an underlying system or component is not available."
  ],
  [
    "texts.VISIBILITY",
    "VARIANT_MANAGEMENT_VISIBILITY",
    "Visibility"
  ],
  [
    "texts.CHANGE_VISIBILITY",
    "VARIANT_MANAGEMENT_CHANGE_VISIBILITY",
    "Change Visibility for {0}"
  ],
  [
    "texts.VISIBILITY_NON_RESTRICTED",
    "VARIANT_MANAGEMENT_VISIBILITY_NON_RESTRICTED",
    "All Users"
  ],
  [
    "texts.VISIBILITY_RESTRICTED",
    "VARIANT_MANAGEMENT_VISIBILITY_RESTRICTED",
    "Restricted"
  ],
  [
    "texts.VISIBILITY_ICON_TT",
    "VARIANT_MANAGEMENT_VISIBILITY_ICON_TT",
    "To change visibility, press space."
  ],
  [
    "texts.SELECTROLES_DIALOG",
    "VARIANT_MANAGEMENT_SELECTROLES_DIALOG",
    "Select Roles"
  ],
  [
    "texts.CREATETILE",
    "VARIANT_MANAGEMENT_CREATETILE",
    "Create Tile"
  ],
  [
    "texts.NO_DEFAULT_ON_RESTRICTED_VIEWS",
    "VARIANT_MANAGEMENT_NO_DEFAULT_ON_RESTRICTED_VIEWS",
    "The visibility of this view is based on a role. You can't select it as the default view."
  ],
  [
    "texts.VIEW_LIST",
    "VARIANT_MANAGEMENT_VIEW_LIST",
    "List of assigned Views"
  ],
  [
    "texts.SEARCH",
    "Application / shared-control text; see owning OpenUI5 control",
    "Search"
  ],
  [
    "texts.SEARCH_RESET",
    "Application / shared-control text; see owning OpenUI5 control",
    "Reset"
  ],
  [
    "texts.SELECTED",
    "Application / shared-control text; see owning OpenUI5 control",
    "Selected"
  ],
  [
    "texts.NOT_SELECTED",
    "Application / shared-control text; see owning OpenUI5 control",
    "Not Selected"
  ],
  [
    "texts.DRAG_RESIZE_LABEL",
    "Application / shared-control text; see owning OpenUI5 control",
    "Drag and resize dialog"
  ],
  [
    "texts.DRAG_RESIZE_DESCRIPTION",
    "Application / shared-control text; see owning OpenUI5 control",
    "Use Arrow keys to move, Shift+Arrow keys to resize"
  ],
  [
    "texts.RESIZE_LABEL",
    "Application / shared-control text; see owning OpenUI5 control",
    "Resize popover"
  ],
  [
    "texts.RESIZE_DESCRIPTION",
    "Application / shared-control text; see owning OpenUI5 control",
    "Use Shift+Arrow keys to resize"
  ],
  [
    "texts.RESIZE_TOOLTIP",
    "Application / shared-control text; see owning OpenUI5 control",
    "Drag handle to resize (Shift+Arrow)"
  ],
  [
    "texts.HANDLE_ROLE",
    "Application / shared-control text; see owning OpenUI5 control",
    "Handle"
  ]
]
// Source: registry/items/variant-management.json and registry/ui/variant-management.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "OpenUI5-compatible view selection, Save View and Manage Views with application-owned persistence.",
  "usage": {
    "summary": "Save, select and maintain named views of filter or table personalization settings.",
    "useWhen": [
      "Let users return to recurring combinations of filter values or table settings through saved views.",
      "Let users organize views through naming, favorites, defaults and sharing when the application supports them.",
      "Handle onSelect, onSave and onManage in the host application; this control does not persist or retrieve view settings itself."
    ],
    "avoidWhen": [
      {
        "when": "Choose one of 2–12 fixed predefined views without creating or managing saved settings; sort alphabetically above 8.",
        "use": [
          "select"
        ]
      },
      {
        "when": "Edit current filter criteria without saving or managing reusable views.",
        "use": [
          "filter-bar"
        ]
      },
      {
        "when": "Adjust sorting, grouping or predefined filter values for the current view without saving it.",
        "use": [
          "view-settings-dialog"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "The selected view title and texts.SEL_VARIANT name the trigger; texts names Save, Manage, validation and role dialogs. The component owns list/grid selection and dialog focus. Keyboard shortcuts follow OpenUI5 VariantManagement, with Ctrl/Cmd+S and Ctrl/Cmd+Enter for saving; dialogs return focus to the opener."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/variant-management"
  return <main><DocsTitle /><p>{guide.description}</p>
    <section aria-label="Install component"><div className="flex items-center gap-3"><pre><code>{command}</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{guide.usage.summary}</p><h2>When to use</h2><ul>{guide.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{guide.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}{entry.use.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><ul><li>{accessibilityNote}</li></ul></section>
    <section aria-label="Localization"><h2>Localization</h2>{textKeys.length ? <><p>Override these props for application terminology. Function texts receive their parameters in UI5 order.</p><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textKeys.map(([key, ui5, value]) => <tr key={key}><td><code>{key}</code></td><td>{ui5}</td><td>{value}</td></tr>)}</tbody></table></> : <p>Supply application labels and native accessible names through the component's content and aria props. The Direction toolbar applies RTL to each example.</p>}</section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Props</h2><ArgTypes />
    <h2>Variants and examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
