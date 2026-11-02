import { Bar } from "@/components/ui/bar"
import { Label } from "@/components/ui/label"
import { NavigationLayout } from "@/components/ui/navigation-layout"
import { SideNavigation, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import { Text } from "@/components/ui/text"
import { actionSettings, group, home, product } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = { mode: "expanded" | "collapsed" }
export const NL_WIDTH = "40rem"
export const NL_HEIGHT = "20rem"
export const NL_TITLE = "Application"
export const NL_CONTENT = "Content area"

export default defineFixtures<Props>({
  name: "navigation-layout",
  cases: [
    { id: "navigation-layout-expanded", props: { mode: "expanded" } },
    { id: "navigation-layout-collapsed", props: { mode: "collapsed" } },
  ],
  react: ({ mode }) => (
    <div style={{ position: "relative", width: NL_WIDTH, height: NL_HEIGHT }}>
      <NavigationLayout
        mode={mode}
        header={
          <Bar design="header">
            <Label>{NL_TITLE}</Label>
          </Bar>
        }
        sideContent={
          <SideNavigation
            accessibleName={`Navigation layout fixture ${mode}`}
            defaultValue="team"
            fixedItems={<SideNavigationItem text="Settings" value="settings" icon={actionSettings} />}
          >
            <SideNavigationItem text="Home" value="home" icon={home} />
            <SideNavigationItem text="People" value="people" icon={group} defaultExpanded>
              <SideNavigationSubItem text="From My Team" value="team" />
              <SideNavigationSubItem text="From Other Teams" value="other" />
            </SideNavigationItem>
            <SideNavigationItem text="Products" value="products" icon={product} />
          </SideNavigation>
        }
      >
        <div style={{ padding: "1rem" }}>
          <Text>{NL_CONTENT}</Text>
        </div>
      </NavigationLayout>
    </div>
  ),
})
