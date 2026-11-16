import { Label } from "@/components/ui/label"
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer } from "@/components/ui/toolbar"
import { Icon } from "@/components/ui/icon"
import { action } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

export const TOOLBAR_WIDTH = "30rem"

// Items: "|" separator, "<->" flexible spacer, "2rem" fixed spacer, "#Text" a label, anything else a button.
type Props = { items: string[]; alignContent?: "start" | "end"; design?: "solid" | "transparent"; width?: string; always?: string[]; never?: string[]; open?: boolean; overflowHeight?: string }

const LONG_ACTIONS = Array.from({ length: 12 }, (_, index) => `Action ${index + 1}`)

export default defineFixtures<Props>({
  name: "toolbar",
  cases: ([
    { id: "toolbar-buttons", props: { items: ["Edit", "Share", "Delete"] } },
    { id: "toolbar-align-start", props: { items: ["Edit", "Share", "Delete"], alignContent: "start" } },
    { id: "toolbar-spacer", props: { items: ["#Products (12)", "<->", "Add", "Delete"] } },
    { id: "toolbar-separator", props: { items: ["Edit", "|", "Copy", "Paste", "|", "Delete"] } },
    { id: "toolbar-fixed-spacer", props: { items: ["Edit", "2rem", "Delete"], alignContent: "start" } },
    { id: "toolbar-transparent", props: { items: ["Edit", "Share"], design: "transparent" } },
    { id: "toolbar-overflow", props: { items: ["Edit", "|", "Copy", "Paste", "|", "Delete", "Share"], width: "15rem" } },
    { id: "toolbar-overflow-always", props: { items: ["Edit", "Share", "Delete"], always: ["Share"], width: "15rem" } },
    { id: "toolbar-overflow-never", props: { items: ["Edit", "Copy", "Paste", "Delete", "Share"], never: ["Share"], width: "15rem" } },
    { id: "toolbar-overflow-open", props: { items: ["Edit", "|", "Copy", "Paste", "|", "Delete", "Share"], width: "8rem", open: true } },
    { id: "toolbar-overflow-scroll", props: { items: LONG_ACTIONS, always: LONG_ACTIONS, width: "8rem", open: true, overflowHeight: "10rem" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "toolbar-rtl" }] : [fixture]),
  react: ({ items, alignContent, design, width, always, never, open, overflowHeight }) => (
    <div className={open ? inPlace : undefined}>
    <Toolbar aria-label="Actions" alignContent={alignContent} design={design} style={{ width: width ?? TOOLBAR_WIDTH }}
      // UI5 paints its closed overflow surface in place and never computes a viewport side.
      // Disable collision flipping for this static fixture to retain the same source order.
      // Integration cause 3: another fixture can take focus; keep this static surface
      // painted, matching toolbar.ui5.ts's in-place rendering of UI5's closed popup.
      defaultOverflowOpen={open} overflowContentProps={open ? { portal: false, avoidCollisions: false, className: "w-48", style: overflowHeight ? { maxHeight: overflowHeight } : undefined, onFocusOutside: (event) => event.preventDefault(), onOpenAutoFocus: (event) => event.preventDefault(), onCloseAutoFocus: (event) => event.preventDefault() } : undefined}>
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
          <ToolbarButton key={i} overflowPriority={always?.includes(t) ? "alwaysOverflow" : never?.includes(t) ? "neverOverflow" : undefined}
            size={open && t === "Share" ? "icon" : undefined} title={open && t === "Share" ? "Share" : undefined}>
            {open && t === "Share" ? <Icon icon={action} /> : t}
          </ToolbarButton>
        )
      )}
    </Toolbar>
    </div>
  ),
})
