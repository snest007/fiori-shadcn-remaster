import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { overflow } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function CardDemo() {
  const [opened, setOpened] = React.useState(0)
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Card accessibleName="Team" className="w-80">
        <CardHeader
          titleText="Team"
          subtitleText="Project Phoenix"
          additionalText="4 of 12"
          avatar={<Avatar initials="TP" colorScheme="accent2" />}
          action={
            <Button variant="transparent" size="icon" aria-label="More actions">
              <Icon icon={overflow} />
            </Button>
          }
        />
        <CardContent className="px-4 pb-4">
          <Text>Four members are working on this project this week.</Text>
        </CardContent>
      </Card>
      <Card accessibleName="Sales" className="w-80">
        <CardHeader
          id="card-interactive-header"
          interactive
          titleText="Quarterly Sales"
          subtitleText="Click, Enter or Space"
          additionalText={`Opened ${opened}×`}
          onClick={() => setOpened((n) => n + 1)}
        />
        <CardContent className="px-4 pb-4">
          <Text>The header of this card is interactive.</Text>
        </CardContent>
      </Card>
    </div>
  )
}

export default defineDemo({ title: "Card", order: 33, Demo: CardDemo })
