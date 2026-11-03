import { Breadcrumbs, BreadcrumbsItem, type BreadcrumbsSeparator } from "@/components/ui/breadcrumbs"

import { inPlace } from "./popover"

import { defineFixtures } from "../fixture-types"

export const BREADCRUMBS_WIDTH = "30rem"
export const BREADCRUMBS_OVERFLOW_WIDTH = "12rem"

type Props = { separators?: BreadcrumbsSeparator; design?: "standard" | "no-current-page"; lastLink?: boolean; overflow?: boolean; open?: boolean }

export const trail = ["Home", "Products", "Laptops", "Notebook 15"]

const separators: BreadcrumbsSeparator[] = ["double-slash", "back-slash", "double-back-slash", "greater-than", "double-greater-than"]

export default defineFixtures<Props>({
  name: "breadcrumbs",
  cases: [
    { id: "breadcrumbs", props: {} },
    ...separators.map((s) => ({ id: `breadcrumbs-${s}`, props: { separators: s } })),
    { id: "breadcrumbs-no-current-page", props: { design: "no-current-page" } },
    { id: "breadcrumbs-last-link", props: { lastLink: true } },
    { id: "breadcrumbs-overflow", props: { overflow: true } },
    { id: "breadcrumbs-overflow-no-current-page", props: { overflow: true, design: "no-current-page" } },
    { id: "breadcrumbs-overflow-last-link", props: { overflow: true, lastLink: true } },
    ...separators.map((s) => ({ id: `breadcrumbs-overflow-${s}`, props: { overflow: true, separators: s } })),
    { id: "breadcrumbs-overflow-open", props: { overflow: true, open: true } },
  ],
  react: ({ separators, design, lastLink, overflow, open }) => {
    const breadcrumbs = (
      // Unique names: the docs page shows many trails and landmarks must be distinguishable.
      <Breadcrumbs
        aria-label={`Example trail (${separators ?? design ?? (lastLink ? "last link" : "slash")}${overflow ? ", narrow" : ""}${open ? ", open" : ""})`}
        separators={separators}
        design={design}
        style={{ width: overflow ? BREADCRUMBS_OVERFLOW_WIDTH : BREADCRUMBS_WIDTH }}
        defaultOverflowOpen={open}
        overflowContentProps={open ? {
          portal: false,
          style: { width: BREADCRUMBS_OVERFLOW_WIDTH },
          onOpenAutoFocus: (e) => e.preventDefault(),
          onInteractOutside: (e) => e.preventDefault(),
        } : undefined}
      >
        {trail.map((t, i) => (
          <BreadcrumbsItem key={t} href={i < trail.length - 1 || lastLink ? "#" : undefined}>{t}</BreadcrumbsItem>
        ))}
      </Breadcrumbs>
    )
    return open ? <div className={inPlace}>{breadcrumbs}</div> : breadcrumbs
  },
})
