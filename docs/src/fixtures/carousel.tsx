import { Carousel, type CarouselProps } from "@/components/ui/carousel"

import { defineFixtures } from "../fixture-types"

type Props = Pick<
  CarouselProps,
  "itemsPerPage" | "hideNavigationArrows" | "hidePageIndicator" | "pageIndicatorType" | "arrowsPlacement" | "backgroundDesign" | "pageIndicatorBackgroundDesign" | "pageIndicatorBorderDesign" | "cyclic"
> & { page?: number; count?: number; width?: string }

// Plain boxes, so the cells test the carousel and not the slotted content.
export const slideStyle = "width:100%;height:6rem;display:flex;align-items:center;justify-content:center;background:var(--sapNeutralBackground);color:var(--sapTextColor);font-family:var(--sapFontFamily);font-size:var(--sapFontSize)"
const slideCss = { width: "100%", height: "6rem", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sapNeutralBackground)", color: "var(--sapTextColor)", fontFamily: "var(--sapFontFamily)", fontSize: "var(--sapFontSize)" }

export default defineFixtures<Props>({
  name: "carousel",
  cases: ([
    { id: "carousel-default", props: {} },
    { id: "carousel-page-2", props: { page: 2 } },
    { id: "carousel-last-page", props: { page: 4 } },
    { id: "carousel-single", props: { count: 1 } },
    { id: "carousel-numeric", props: { pageIndicatorType: "Numeric", page: 1 } },
    { id: "carousel-many-pages", props: { count: 12, page: 3 } },
    { id: "carousel-navigation-arrows", props: { arrowsPlacement: "Navigation", page: 1 } },
    { id: "carousel-navigation-arrows-first", props: { arrowsPlacement: "Navigation" } },
    { id: "carousel-navigation-cyclic", props: { arrowsPlacement: "Navigation", cyclic: true } },
    { id: "carousel-navigation-numeric", props: { arrowsPlacement: "Navigation", pageIndicatorType: "Numeric", page: 1 } },
    { id: "carousel-no-indicator", props: { hidePageIndicator: true } },
    { id: "carousel-no-indicator-navigation", props: { hidePageIndicator: true, arrowsPlacement: "Navigation" } },
    { id: "carousel-no-arrows", props: { hideNavigationArrows: true, arrowsPlacement: "Navigation" } },
    { id: "carousel-solid", props: { backgroundDesign: "Solid", pageIndicatorBackgroundDesign: "Translucent", pageIndicatorBorderDesign: "None" } },
    { id: "carousel-transparent", props: { backgroundDesign: "Transparent", pageIndicatorBackgroundDesign: "Transparent" } },
    { id: "carousel-items-s2", props: { itemsPerPage: "S2 M3 L4 XL5", width: "30rem", page: 1 } },
    { id: "carousel-items-m3", props: { itemsPerPage: "S2 M3 L4 XL5", width: "48rem" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "carousel-rtl" }] : [fixture]),
  react: ({ page, count = 5, width = "24rem", ...props }) => (
    <Carousel {...props} accessibleName="Fixture" defaultPageIndex={page} style={{ width }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={slideCss}>Slide {i + 1}</div>
      ))}
    </Carousel>
  ),
})
