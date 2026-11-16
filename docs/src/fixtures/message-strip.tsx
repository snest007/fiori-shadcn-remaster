import { Icon } from "@/components/ui/icon"
import { MessageStrip, type MessageStripDesign } from "@/components/ui/message-strip"
import { favorite } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = { design: MessageStripDesign; scheme?: number; hideIcon?: boolean; hideClose?: boolean; icon?: boolean; long?: boolean }
const designs = ["information", "positive", "negative", "critical"] as const
export const MS_TEXT = "Message strip text"
export const MS_LONG = "A longer message strip text that wraps onto a second line because the strip is narrow."

export default defineFixtures<Props>({
  name: "message-strip",
  cases: ([
    ...designs.map((design) => ({ id: `message-strip-${design}`, props: { design } })),
    { id: "message-strip-no-icon", props: { design: "information", hideIcon: true } },
    { id: "message-strip-no-close", props: { design: "positive", hideClose: true } },
    { id: "message-strip-no-icon-no-close", props: { design: "negative", hideIcon: true, hideClose: true } },
    { id: "message-strip-long", props: { design: "critical", long: true } },
    ...[1, 4, 7, 10].map((scheme) => ({ id: `message-strip-set1-${scheme}`, props: { design: "color-set-1" as const, scheme } })),
    ...[1, 4, 7, 10].map((scheme) => ({ id: `message-strip-set2-${scheme}`, props: { design: "color-set-2" as const, scheme } })),
    { id: "message-strip-set1-icon", props: { design: "color-set-1", scheme: 3, icon: true } },
    { id: "message-strip-set2-icon", props: { design: "color-set-2", scheme: 5, icon: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "message-strip-rtl" }] : [fixture]),
  react: ({ design, scheme, hideIcon, hideClose, icon, long }) => (
    <div style={{ width: "20rem" }}>
      <MessageStrip
        design={design}
        colorScheme={scheme as 1}
        hideIcon={hideIcon}
        hideCloseButton={hideClose}
        icon={icon ? <Icon icon={favorite} /> : undefined}
      >
        {long ? MS_LONG : MS_TEXT}
      </MessageStrip>
    </div>
  ),
})
