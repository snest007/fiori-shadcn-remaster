import { Label } from "@/components/ui/label"
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer } from "@/components/ui/toolbar"

import { defineFixtures } from "../fixture-types"

export const TOOLBAR_WIDTH = "30rem"

// Items: "|" separator, "<->" flexible spacer, "2rem" fixed spacer, "#Text" a label, anything else a button.
type Props = { items: string[]; alignContent?: "start" | "end"; design?: "solid" | "transparent" }

export default defineFixtures<Props>({
  name: "toolbar",
  cases: [
    { id: "toolbar-buttons", props: { items: ["Edit", "Share", "Delete"] } },
    { id: "toolbar-align-start", props: { items: ["Edit", "Share", "Delete"], alignContent: "start" } },
    { id: "toolbar-spacer", props: { items: ["#Products (12)", "<->", "Add", "Delete"] } },
    { id: "toolbar-separator", props: { items: ["Edit", "|", "Copy", "Paste", "|", "Delete"] } },
    { id: "toolbar-fixed-spacer", props: { items: ["Edit", "2rem", "Delete"], alignContent: "start" } },
    { id: "toolbar-transparent", props: { items: ["Edit", "Share"], design: "transparent" } },
  ],
  react: ({ items, alignContent, design }) => (
    <Toolbar aria-label="Actions" alignContent={alignContent} design={design} style={{ width: TOOLBAR_WIDTH }}>
      {items.map((t, i) =>
        t === "|" ? (
          <ToolbarSeparator key={i} />
        ) : t === "<->" ? (
          <ToolbarSpacer key={i} />
        ) : t.endsWith("rem") ? (
          <ToolbarSpacer key={i} width={t} />
        ) : t.startsWith("#") ? (
          <Label key={i}>{t.slice(1)}</Label>
        ) : (
          <ToolbarButton key={i}>{t}</ToolbarButton>
        )
      )}
    </Toolbar>
  ),
})
