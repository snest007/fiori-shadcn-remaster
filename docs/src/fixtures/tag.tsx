import { Icon } from "@/components/ui/icon"
import { Tag, type TagDesign } from "@/components/ui/tag"
import { favorite } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = {
  design: TagDesign
  scheme?: number
  hideStateIcon?: boolean
  icon?: boolean
  text?: string | null
  size?: "S" | "L"
  interactive?: boolean
  width?: string
  nowrap?: boolean
}
const semantic = ["neutral", "positive", "negative", "critical", "information"] as const
const schemes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default defineFixtures<Props>({
  name: "tag",
  cases: [
    ...semantic.map((design) => ({ id: `tag-${design}`, props: { design } })),
    ...semantic.map((design) => ({ id: `tag-${design}-no-icon`, props: { design, hideStateIcon: true } })),
    ...schemes.map((scheme) => ({ id: `tag-set1-${scheme}`, props: { design: "set1" as const, scheme } })),
    ...schemes.map((scheme) => ({ id: `tag-set2-${scheme}`, props: { design: "set2" as const, scheme } })),
    { id: "tag-custom-icon", props: { design: "set1", scheme: 6, icon: true } },
    { id: "tag-icon-only", props: { design: "information", icon: true, text: null } },
    { id: "tag-size-l", props: { design: "positive", size: "L" } },
    { id: "tag-size-l-set2", props: { design: "set2", scheme: 4, size: "L", hideStateIcon: true } },
    { id: "tag-interactive", props: { design: "negative", interactive: true } },
    { id: "tag-wrap", props: { design: "critical", text: "A long tag text that wraps", width: "6rem" } },
    { id: "tag-nowrap", props: { design: "critical", text: "A long tag text that truncates", width: "6rem", nowrap: true } },
  ],
  react: ({ design, scheme, hideStateIcon, icon, text, size, interactive, width, nowrap }) => (
    <Tag
      design={design}
      colorScheme={scheme as 1}
      hideStateIcon={hideStateIcon}
      icon={icon ? <Icon icon={favorite} /> : undefined}
      size={size}
      interactive={interactive}
      wrappingType={nowrap ? "none" : "normal"}
      style={width ? { width } : undefined}
    >
      {text === undefined ? "Tag" : text}
    </Tag>
  ),
})
