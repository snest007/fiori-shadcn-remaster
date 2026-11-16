import { Breadcrumbs, BreadcrumbsItem, type BreadcrumbsSeparator } from "@/components/ui/breadcrumbs"

import { inPlace } from "./popover"

import { defineFixtures } from "../fixture-types"

export const BREADCRUMBS_WIDTH = "30rem"
export const BREADCRUMBS_OVERFLOW_WIDTH = "12rem"
export const BREADCRUMBS_HIDDEN_MIDDLE_WIDTH = "100px"

type Props = { separators?: BreadcrumbsSeparator; design?: "standard" | "no-current-page"; lastLink?: boolean; overflow?: boolean; open?: boolean; hiddenMiddle?: boolean }

export const trail = ["Home", "Products", "Laptops", "Notebook 15"]

const separators: BreadcrumbsSeparator[] = ["double-slash", "back-slash", "double-back-slash", "greater-than", "double-greater-than"]

export default defineFixtures<Props>({
  name: "breadcrumbs",
  cases: ([
    { id: "breadcrumbs", props: {} },
    ...separators.map((s) => ({ id: `breadcrumbs-${s}`, props: { separators: s } })),
    { id: "breadcrumbs-no-current-page", props: { design: "no-current-page" } },
    { id: "breadcrumbs-last-link", props: { lastLink: true } },
    { id: "breadcrumbs-overflow", props: { overflow: true } },
    { id: "breadcrumbs-overflow-no-current-page", props: { overflow: true, design: "no-current-page" } },
    { id: "breadcrumbs-overflow-last-link", props: { overflow: true, lastLink: true } },
    ...separators.map((s) => ({ id: `breadcrumbs-overflow-${s}`, props: { overflow: true, separators: s } })),
    { id: "breadcrumbs-overflow-open", props: { overflow: true, open: true } },
    { id: "breadcrumbs-overflow-hidden-middle", props: { overflow: true, hiddenMiddle: true } },
    { id: "breadcrumbs-overflow-hidden-middle-open", props: { overflow: true, hiddenMiddle: true, open: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "breadcrumbs-rtl" }] : [fixture]),
  react: ({ separators, design, lastLink, overflow, open, hiddenMiddle }) => {
    const width = hiddenMiddle ? BREADCRUMBS_HIDDEN_MIDDLE_WIDTH : overflow ? BREADCRUMBS_OVERFLOW_WIDTH : BREADCRUMBS_WIDTH
    const breadcrumbs = (
      // Unique names: the docs page shows many trails and landmarks must be distinguishable.
      <Breadcrumbs
        aria-label={`Example trail (${separators ?? design ?? (lastLink ? "last link" : "slash")}${overflow ? ", narrow" : ""}${open ? ", open" : ""}${hiddenMiddle ? ", hidden middle" : ""})`}
        separators={separators}
        design={design}
        style={{ width }}
        defaultOverflowOpen={open}
        overflowContentProps={open ? {
          portal: false,
          style: { width: hiddenMiddle ? BREADCRUMBS_HIDDEN_MIDDLE_WIDTH : BREADCRUMBS_OVERFLOW_WIDTH },
          onOpenAutoFocus: (e) => e.preventDefault(),
          onInteractOutside: (e) => e.preventDefault(),
        } : undefined}
      >
        {trail.map((t, i) => (
          <BreadcrumbsItem key={t} hidden={hiddenMiddle && i === 1} href={i < trail.length - 1 || lastLink ? "#" : undefined}>{t}</BreadcrumbsItem>
        ))}
      </Breadcrumbs>
    )
    return open ? <div className={inPlace}>{breadcrumbs}</div> : breadcrumbs
  },
})
