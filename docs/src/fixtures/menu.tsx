import * as React from "react"
import { Button } from "@/components/ui/button"
import { Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from "@/components/ui/menu"
import { copy, deleteIcon, paste } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Direction = "ltr" | "rtl"
type Props = { icons?: boolean; checkMode?: "single" | "multiple"; disabledSubmenu?: boolean; interaction?: boolean; ownerDir?: Direction; openerDir?: Direction; openerAncestorDir?: Direction; menuDir?: Direction }

function DirectionMenu({ ownerDir, openerDir, openerAncestorDir, menuDir }: Props) {
  return <div dir={ownerDir} className="inline-flex">
    <Menu dir={menuDir}>
      <div dir={openerAncestorDir}>
        <MenuTrigger asChild><Button dir={openerDir}>Open menu</Button></MenuTrigger>
      </div>
      <MenuContent aria-label="Direction actions">
        <MenuItem>Copy</MenuItem>
        <MenuSub><MenuSubTrigger>Share</MenuSubTrigger><MenuSubContent><MenuItem>Email</MenuItem></MenuSubContent></MenuSub>
      </MenuContent>
    </Menu>
  </div>
}

function MenuFrame({ interaction, children }: { interaction?: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    // The static open-surface fixture suppresses initial focus. Retain the first item's
    // tab stop, as Menu.js/_afterPopoverOpen does, without painting an initial focus ring.
    if (interaction) ref.current!.querySelector<HTMLElement>('[role="menuitem"]')!.tabIndex = 0
  }, [interaction])
  return <div ref={ref} className={inPlace}>{children}</div>
}

// The menu surface is rendered open, in place (non-modal, no portal) with a fixed width (content-sized
// widths are fractional and would shift later cells off whole pixels). UI5's side shows ui5-menu's
// internal popover in place (menu.ui5.ts). Submenus open on demand and are covered by tests/menu.spec.ts.
const fixtureSet = defineFixtures<Props>({
  name: "menu",
  cases: [
    { id: "menu", props: {} },
    { id: "menu-interaction", props: { interaction: true }, interact: { selector: '[role="menuitem"]', ui5Selector: "ui5-menu-item" } },
    { id: "menu-icons", props: { icons: true } },
    { id: "menu-check-single", props: { checkMode: "single" } },
    { id: "menu-check-single-icons", props: { checkMode: "single", icons: true } },
    { id: "menu-check-multiple", props: { checkMode: "multiple" } },
    { id: "menu-check-multiple-icons", props: { checkMode: "multiple", icons: true } },
    { id: "menu-check-single-disabled-submenu", props: { checkMode: "single", disabledSubmenu: true, icons: true } },
    { id: "menu-check-multiple-disabled-submenu", props: { checkMode: "multiple", disabledSubmenu: true } },
    { id: "menu-direction-owner-rtl-opener-ltr", props: { ownerDir: "rtl", openerDir: "ltr" } },
    { id: "menu-direction-owner-rtl-opener-ancestor-ltr", props: { ownerDir: "rtl", openerAncestorDir: "ltr" } },
    { id: "menu-direction-owner-ltr-opener-ancestor-rtl", props: { ownerDir: "ltr", openerAncestorDir: "rtl" } },
    { id: "menu-direction-explicit-ltr", props: { ownerDir: "rtl", openerDir: "rtl", menuDir: "ltr" } },
    { id: "menu-direction-explicit-rtl", props: { ownerDir: "ltr", openerDir: "ltr", menuDir: "rtl" } },
  ],
  react: (props) => props.ownerDir ? <DirectionMenu {...props} /> : staticMenu(props),
})

function staticMenu({ icons, checkMode, disabledSubmenu, interaction }: Props) {
  return checkMode ? (
    <MenuFrame interaction={interaction}>
      <Menu open modal={false}>
        <MenuContent portal={false} aria-label="Options" preventInitialFocus className="w-40">
          <MenuItem icon={icons ? copy : undefined}>Options</MenuItem>
          <MenuGroup checkMode={checkMode}>
            <MenuItem defaultChecked icon={icons ? paste : undefined} additionalText="Ctrl+A">Alpha</MenuItem>
            <MenuItem defaultChecked={checkMode === "multiple"}>Beta</MenuItem>
            <MenuItem disabled defaultChecked={checkMode === "multiple"}>Disabled</MenuItem>
            <MenuSub defaultOpen={disabledSubmenu}><MenuSubTrigger disabled={disabledSubmenu} defaultChecked={checkMode === "multiple" || disabledSubmenu}>Nested</MenuSubTrigger><MenuSubContent><MenuItem>Child</MenuItem></MenuSubContent></MenuSub>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup><MenuItem defaultChecked>Ordinary</MenuItem></MenuGroup>
        </MenuContent>
      </Menu>
    </MenuFrame>
  ) : (
    <MenuFrame interaction={interaction}>
      <Menu open modal={false}>
        <MenuContent portal={false} aria-label="Actions" preventInitialFocus className="w-40">
          {/* Menu.js/_afterPopoverOpen makes the first item the open surface's keyboard stop. */}
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
    </MenuFrame>
  )
}


// E4: consumer host replacement changes the DOM host while the component keeps
// the owning semantics. The native renderer uses the same underlying state.
function customHost(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) return node.map(customHost)
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node
  const children = customHost(node.props.children)
  if (node.type === MenuItem || node.type === MenuSubTrigger) return React.cloneElement(node, { asChild: true } as Partial<typeof node.props>, <div data-custom-host="menu" role="presentation" tabIndex={13} id="menu-caller-host">{children}</div>)
  return node.props.children === undefined ? node : React.cloneElement(node, {}, children)
}
const baseCase = fixtureSet.cases.find((entry) => entry.id === "menu-check-multiple")!
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "menu-custom-host", props: { ...baseCase.props, customHost: true } }],
  react: (props: typeof baseCase.props & { customHost?: boolean }) => props.customHost ? customHost(fixtureSet.react(props)) : fixtureSet.react(props),
}
