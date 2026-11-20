import { Bar, type BarDesign } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Label } from "@/components/ui/label"
import { navBack, settings } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

/** Shared width so the bars are the same width on both pages. */
export const BAR_WIDTH = "30rem"

type Props = { design: BarDesign; start?: boolean; title?: string; end?: string[] }

export default defineFixtures<Props>({
  name: "bar",
  cases: [
    { id: "bar-header", props: { design: "header", start: true, title: "Page title", end: ["settings"] } },
    { id: "bar-subheader", props: { design: "subheader", title: "Subheader", end: ["Edit"] } },
    { id: "bar-footer", props: { design: "footer", end: ["Submit", "Cancel"] } },
    { id: "bar-floating-footer", props: { design: "floating-footer", end: ["Submit", "Cancel"] } },
  ],
  react: ({ design, start, title, end }) => (
    <Bar
      design={design}
      style={{ width: BAR_WIDTH }}
      startContent={start && <Button variant="transparent" size="icon" aria-label="Back"><Icon icon={navBack} /></Button>}
      endContent={end?.map((t, i) =>
        t === "settings" ? (
          <Button key={t} variant="transparent" size="icon" aria-label="Settings"><Icon icon={settings} /></Button>
        ) : (
          <Button key={t} variant={i === 0 && end.length > 1 ? "emphasized" : "default"}>{t}</Button>
        )
      )}
    >
      {title && <Label>{title}</Label>}
    </Bar>
  ),
})
