import * as React from "react"

import { Icon } from "@/components/ui/icon"
import { Tag } from "@/components/ui/tag"
import { favorite } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function TagDemo() {
  const [clicks, setClicks] = React.useState(0)
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>Neutral</Tag>
        <Tag design="positive">Positive</Tag>
        <Tag design="negative">Negative</Tag>
        <Tag design="critical">Critical</Tag>
        <Tag design="information">Information</Tag>
        <Tag design="information" size="L">Large</Tag>
        <Tag design="set1" colorScheme={6} icon={<Icon icon={favorite} />}>With icon</Tag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
          <Tag key={n} design="set1" colorScheme={n}>{`Set1 ${n}`}</Tag>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
          <Tag key={n} design="set2" colorScheme={n}>{`Set2 ${n}`}</Tag>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Tag design="negative" interactive onClick={() => setClicks((c) => c + 1)}>Interactive</Tag>
        <span className="text-(--sapContent_LabelColor)">{`Clicked ${clicks} times`}</span>
      </div>
    </div>
  )
}

export default defineDemo({ title: "Tag", order: 31, Demo: TagDemo })
