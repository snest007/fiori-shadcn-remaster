import * as React from "react"

import { Button } from "@/components/ui/button"
import { SideNavigation, SideNavigationGroup, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import { actionSettings, building, calendar, chainLink, group, history, home, sysHelp } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function SideNavigationDemo() {
  const [collapsed, setCollapsed] = React.useState(false)
  const [short, setShort] = React.useState(false)
  const [value, setValue] = React.useState("home")
  const [clicks, setClicks] = React.useState(0)
  const [preventEventsSelection, setPreventEventsSelection] = React.useState(false)
  const [eventsClicks, setEventsClicks] = React.useState(0)
  const [lastModifiers, setLastModifiers] = React.useState("none")
  const recordModifiers = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    setLastModifiers([e.ctrlKey && "Control", e.altKey && "Alt", e.metaKey && "Meta", e.shiftKey && "Shift"].filter(Boolean).join("+") || "none")
  }
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <Button id="side-navigation-demo-toggle" aria-pressed={collapsed} onClick={() => setCollapsed((c) => !c)}>
          Collapsed
        </Button>
        <Button id="side-navigation-demo-prevent-events" aria-pressed={preventEventsSelection} onClick={() => setPreventEventsSelection((prevent) => !prevent)}>
          Prevent Events selection
        </Button>
        <Button id="side-navigation-demo-resize" aria-pressed={short} onClick={() => setShort((s) => !s)}>
          Short height
        </Button>
        <span className="text-(--sapContent_LabelColor)">
          Selected: <span data-testid="side-navigation-demo-value">{value}</span> · clicks:{" "}
          <span data-testid="side-navigation-demo-clicks" data-modifiers={lastModifiers}>{clicks}</span>
          {" "}· Events callbacks: <span data-testid="side-navigation-demo-events-clicks">{eventsClicks}</span>
        </span>
      </div>
      <div id="side-navigation-demo" style={{ height: short ? "18rem" : "30rem" }}>
        <SideNavigation
          accessibleName="Main navigation"
          collapsed={collapsed}
          value={value}
          onValueChange={setValue}
          onItemClick={() => setClicks((c) => c + 1)}
          fixedItems={
            <>
              <SideNavigationItem text="Legal" icon={sysHelp} unselectable>
                <SideNavigationSubItem text="Terms of use" value="terms" />
                <SideNavigationSubItem text="Privacy" value="privacy" />
              </SideNavigationItem>
              <SideNavigationItem text="Settings" value="settings" icon={actionSettings} />
            </>
          }
        >
          <SideNavigationItem text="Home" value="home" icon={home} />
          <SideNavigationGroup text="Organization" defaultExpanded>
            <SideNavigationItem text="People" value="people" icon={group} defaultExpanded>
              <SideNavigationSubItem text="From My Team" value="team" />
              <SideNavigationSubItem text="From Other Teams" value="other" />
            </SideNavigationItem>
            <SideNavigationItem text="Locations" value="locations" icon={building} disabled />
            <SideNavigationItem text="Events" value="events" icon={calendar} onClick={(e) => {
              recordModifiers(e)
              setEventsClicks((count) => count + 1)
              if (preventEventsSelection) e.preventDefault()
            }}>
              <SideNavigationSubItem text="Local" value="local" />
              <SideNavigationSubItem text="Others" value="others" />
            </SideNavigationItem>
          </SideNavigationGroup>
          <SideNavigationGroup text="Archive">
            <SideNavigationItem text="History" value="history" icon={history} onClick={recordModifiers} />
          </SideNavigationGroup>
          <SideNavigationItem text="SAP Community" icon={chainLink} href="https://community.sap.com" target="_blank" />
        </SideNavigation>
      </div>
    </div>
  )
}

export default defineDemo({ title: "SideNavigation", order: 70, Demo: SideNavigationDemo })
