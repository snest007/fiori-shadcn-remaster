import { Menu, MenuContent, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger } from "@/components/ui/menu"
import { copy, deleteIcon, paste } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { icons?: boolean }

// The menu surface is rendered open, in place (non-modal, no portal) with a fixed width (content-sized
// widths are fractional and would shift later cells off whole pixels). UI5's side shows ui5-menu's
// internal popover in place (menu.ui5.ts). Submenus open on demand and are covered by tests/menu.spec.ts.
export default defineFixtures<Props>({
  name: "menu",
  cases: [
    { id: "menu", props: {} },
    { id: "menu-icons", props: { icons: true } },
  ],
  react: ({ icons }) => (
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
