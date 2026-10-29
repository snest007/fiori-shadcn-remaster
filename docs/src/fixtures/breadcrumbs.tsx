import { Breadcrumbs, BreadcrumbsItem, type BreadcrumbsSeparator } from "@/components/ui/breadcrumbs"

import { defineFixtures } from "../fixture-types"

export const BREADCRUMBS_WIDTH = "30rem"

type Props = { separators?: BreadcrumbsSeparator; design?: "standard" | "no-current-page"; lastLink?: boolean }

export const trail = ["Home", "Products", "Laptops", "Notebook 15"]

const separators: BreadcrumbsSeparator[] = ["double-slash", "back-slash", "double-back-slash", "greater-than", "double-greater-than"]

export default defineFixtures<Props>({
  name: "breadcrumbs",
  cases: [
    { id: "breadcrumbs", props: {} },
    ...separators.map((s) => ({ id: `breadcrumbs-${s}`, props: { separators: s } })),
    { id: "breadcrumbs-no-current-page", props: { design: "no-current-page" } },
    { id: "breadcrumbs-last-link", props: { lastLink: true } },
  ],
  react: ({ separators, design, lastLink }) => (
    // Unique names: the docs page shows many trails and landmarks must be distinguishable.
    <Breadcrumbs aria-label={`Example trail (${separators ?? design ?? (lastLink ? "last link" : "slash")})`} separators={separators} design={design} style={{ width: BREADCRUMBS_WIDTH }}>
      {trail.map((t, i) => (
        <BreadcrumbsItem key={t} href={i < trail.length - 1 || lastLink ? "#" : undefined}>
          {t}
        </BreadcrumbsItem>
      ))}
    </Breadcrumbs>
  ),
})
