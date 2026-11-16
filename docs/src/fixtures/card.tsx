import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { overflow, calendar } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = {
  subtitle?: boolean
  status?: boolean
  avatar?: "avatar" | "icon"
  action?: boolean
  interactive?: boolean
  content?: boolean
  noHeader?: boolean
  long?: boolean
}
export const CARD_TITLE = "Quarterly Sales"
export const CARD_LONG_TITLE = "A very long card title that needs more than one line to be displayed completely in the header"
export const CARD_SUBTITLE = "Europe, Middle East and Africa"
export const CARD_STATUS = "3 of 10"
export const CARD_CONTENT = "Revenue grew by 12% compared to the previous quarter."
export const CARD_WIDTH = "20rem"

export default defineFixtures<Props>({
  name: "card",
  cases: ([
    { id: "card-title", props: {} },
    { id: "card-subtitle", props: { subtitle: true } },
    { id: "card-status", props: { subtitle: true, status: true } },
    { id: "card-avatar", props: { subtitle: true, avatar: "avatar" } },
    { id: "card-icon", props: { subtitle: true, avatar: "icon", status: true } },
    { id: "card-action", props: { subtitle: true, action: true } },
    { id: "card-interactive", props: { subtitle: true, interactive: true }, interact: { selector: '[data-slot="card-header"]', ui5Selector: "ui5-card-header" } },
    { id: "card-content", props: { subtitle: true, status: true, avatar: "icon", content: true } },
    { id: "card-no-header", props: { noHeader: true, content: true } },
    { id: "card-long-title", props: { long: true, subtitle: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "card-rtl" }] : [fixture]),
  // Fixture cells carry an id-like accessibleName only so the many fixture landmarks on the docs page stay unique.
  react: (props) => {
    const { subtitle, status, avatar, action, interactive, content, noHeader, long } = props
    return (
    <Card style={{ width: CARD_WIDTH }} accessibleName={`fixture ${JSON.stringify(props)}`}>
      {!noHeader && (
        <CardHeader
          titleText={long ? CARD_LONG_TITLE : CARD_TITLE}
          subtitleText={subtitle ? CARD_SUBTITLE : undefined}
          additionalText={status ? CARD_STATUS : undefined}
          avatar={avatar === "avatar" ? <Avatar initials="QS" /> : avatar === "icon" ? <Icon icon={calendar} /> : undefined}
          action={
            action ? (
              <Button variant="transparent" size="icon" aria-label="More">
                <Icon icon={overflow} />
              </Button>
            ) : undefined
          }
          interactive={interactive}
        />
      )}
      {content && <CardContent style={{ padding: "0 1rem 1rem" }}>{CARD_CONTENT}</CardContent>}
    </Card>
    )
  },
})
