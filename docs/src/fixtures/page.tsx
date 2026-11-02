import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Page, type PageBackgroundDesign } from "@/components/ui/page"
import { Text } from "@/components/ui/text"

import { defineFixtures } from "../fixture-types"

type Props = { background?: PageBackgroundDesign; fixedFooter?: boolean; footer?: boolean; width?: string }
export const PAGE_TITLE = "Page title"
export const PAGE_TEXT = "Page content. The footer floats above the content unless it is fixed."
export const PAGE_HEIGHT = "16rem"

export default defineFixtures<Props>({
  name: "page",
  cases: [
    { id: "page-floating-footer", props: { footer: true } },
    { id: "page-fixed-footer", props: { footer: true, fixedFooter: true } },
    { id: "page-list-background", props: { background: "list" } },
    { id: "page-transparent-wide", props: { background: "transparent", footer: true, width: "40rem" } },
  ],
  react: ({ background, fixedFooter, footer, width = "26rem" }) => (
    <div style={{ width, height: PAGE_HEIGHT }}>
      <Page
        backgroundDesign={background}
        fixedFooter={fixedFooter}
        header={
          <Bar design="header">
            <Label>{PAGE_TITLE}</Label>
          </Bar>
        }
        footer={
          footer && (
            <Bar
              design={fixedFooter ? "footer" : "floating-footer"}
              endContent={
                <>
                  <Button variant="emphasized">Save</Button>
                  <Button>Cancel</Button>
                </>
              }
            />
          )
        }
      >
        <Text>{PAGE_TEXT}</Text>
      </Page>
    </div>
  ),
})
