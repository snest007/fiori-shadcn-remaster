import { Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger } from "@/components/ui/menu"
import { copy, deleteIcon, paste } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { icons?: boolean; checkMode?: "single" | "multiple" }

// The menu surface is rendered open, in place (non-modal, no portal) with a fixed width (content-sized
// widths are fractional and would shift later cells off whole pixels). UI5's side shows ui5-menu's
// internal popover in place (menu.ui5.ts). Submenus open on demand and are covered by tests/menu.spec.ts.
export default defineFixtures<Props>({
  name: "menu",
  cases: [
    { id: "menu", props: {} },
    { id: "menu-icons", props: { icons: true } },
    { id: "menu-check-single", props: { checkMode: "single" } },
    { id: "menu-check-single-icons", props: { checkMode: "single", icons: true } },
    { id: "menu-check-multiple", props: { checkMode: "multiple" } },
    { id: "menu-check-multiple-icons", props: { checkMode: "multiple", icons: true } },
  ],
  react: ({ icons, checkMode }) => checkMode ? (
    <div className={inPlace}>
      <Menu open modal={false}>
        <MenuContent portal={false} aria-label="Options" preventInitialFocus className="w-40">
          <MenuItem icon={icons ? copy : undefined}>Options</MenuItem>
          <MenuGroup checkMode={checkMode}>
            <MenuItem defaultChecked icon={icons ? paste : undefined} additionalText="Ctrl+A">Alpha</MenuItem>
            <MenuItem defaultChecked={checkMode === "multiple"}>Beta</MenuItem>
            <MenuItem disabled defaultChecked={checkMode === "multiple"}>Disabled</MenuItem>
            <MenuSub><MenuSubTrigger defaultChecked={checkMode === "multiple"}>Nested</MenuSubTrigger><MenuSubContent><MenuItem>Child</MenuItem></MenuSubContent></MenuSub>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup><MenuItem defaultChecked>Ordinary</MenuItem></MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  ) : (
    <div className={inPlace}>
      <Menu open modal={false}>
        <MenuContent portal={false} aria-label="Actions" preventInitialFocus className="w-40">
          <MenuItem icon={icons ? copy : undefined} additionalText="Ctrl+C">Copy</MenuItem>
          <MenuItem icon={icons ? paste : undefined} disabled>Paste</MenuItem>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>Share</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Email</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuItem icon={icons ? deleteIcon : undefined}>Delete</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  ),
})
