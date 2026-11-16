import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Carousel, type CarouselProps } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = CarouselProps & { count: number; multipleWidth: boolean; actions: boolean }

// Source-backed defaults from registry/ui/carousel.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "Carousel.ofText",
    "key": "CAROUSEL_OF_TEXT",
    "value": "of"
  },
  {
    "prop": "Carousel.previousPageText",
    "key": "CAROUSEL_PREVIOUS_ARROW_TEXT",
    "value": "Previous Page"
  },
  {
    "prop": "Carousel.nextPageText",
    "key": "CAROUSEL_NEXT_ARROW_TEXT",
    "value": "Next Page"
  },
  {
    "prop": "Carousel.roleDescription",
    "key": "CAROUSEL_ARIA_ROLE_DESCRIPTION",
    "value": "Carousel"
  },
  {
    "prop": "Carousel.listLabel",
    "key": "CAROUSEL_ARIA_LIST_LABEL",
    "value": "Item Container"
  }
]

const base = fioriMeta({ name: "carousel", component: Carousel })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { accessibleName: "Products", pageIndex: 0, count: 5, cyclic: false, itemsPerPage: "S1 M1 L1 XL1", hideNavigationArrows: false, hidePageIndicator: false, pageIndicatorType: "Default", arrowsPlacement: "Content", backgroundDesign: "Translucent", pageIndicatorBackgroundDesign: "Solid", pageIndicatorBorderDesign: "Solid", multipleWidth: false, actions: false, onNavigate: fn() },
  argTypes: { ...base.argTypes, pageIndex: { control: "number" }, count: { control: "number" }, cyclic: { control: "boolean" }, itemsPerPage: { control: "text" }, hideNavigationArrows: { control: "boolean" }, hidePageIndicator: { control: "boolean" }, pageIndicatorType: { control: "inline-radio", options: ["Default", "Numeric"] }, arrowsPlacement: { control: "inline-radio", options: ["Content", "Navigation"] }, backgroundDesign: { control: "select", options: ["Translucent", "Solid", "Transparent"] }, pageIndicatorBackgroundDesign: { control: "select", options: ["Translucent", "Solid", "Transparent"] }, pageIndicatorBorderDesign: { control: "inline-radio", options: ["Solid", "None"] }, accessibleName: { control: "text" }, ofText: { control: "text" }, previousPageText: { control: "text" }, nextPageText: { control: "text" }, roleDescription: { control: "text" }, listLabel: { control: "text" }, multipleWidth: { control: "boolean" }, actions: { control: "boolean" }, onNavigate: { control: false } },
  render: function ProductCarousel(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { count, multipleWidth, actions, ...props } = args
    return <div className={multipleWidth ? "max-w-3xl" : "max-w-sm"}><Carousel {...props} onNavigate={(pageIndex) => { args.onNavigate?.(pageIndex); updateArgs({ pageIndex }) }}>{Array.from({ length: Math.max(0, count) }, (_, index) => <div key={index} className="flex h-32 w-full items-center justify-center bg-(--sapNeutralBackground) text-(--sapTextColor)">{actions ? <Button onClick={fn()}>View product {index + 1}</Button> : `Product ${index + 1}`}</div>)}</Carousel><output>Page index: {args.pageIndex}</output></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Default: Story = { args: {} }
export const SecondPage: Story = { args: { pageIndex: 2 } }
export const LastPage: Story = { args: { pageIndex: 4 } }
export const SingleItem: Story = { args: { count: 1 } }
export const Numeric: Story = { args: { pageIndicatorType: "Numeric", pageIndex: 1 } }
export const ManyPages: Story = { args: { count: 12, pageIndex: 3 } }
export const NavigationArrows: Story = { args: { arrowsPlacement: "Navigation", pageIndex: 1 } }
export const NavigationFirstPage: Story = { args: { arrowsPlacement: "Navigation" } }
export const Cyclic: Story = { args: { arrowsPlacement: "Navigation", cyclic: true } }
export const NavigationNumeric: Story = { args: { arrowsPlacement: "Navigation", pageIndicatorType: "Numeric", pageIndex: 1 } }
export const NoIndicator: Story = { args: { hidePageIndicator: true } }
export const NoIndicatorWithNavigation: Story = { args: { hidePageIndicator: true, arrowsPlacement: "Navigation" } }
export const NoArrows: Story = { args: { hideNavigationArrows: true, arrowsPlacement: "Navigation" } }
export const Solid: Story = { args: { backgroundDesign: "Solid", pageIndicatorBackgroundDesign: "Translucent", pageIndicatorBorderDesign: "None" } }
export const Transparent: Story = { args: { backgroundDesign: "Transparent", pageIndicatorBackgroundDesign: "Transparent" } }
export const TwoItems: Story = { args: { itemsPerPage: "S2 M3 L4 XL5", pageIndex: 1 } }
export const ResponsiveItems: Story = { args: { itemsPerPage: "S2 M3 L4 XL5", multipleWidth: true } }
export const WithActions: Story = { args: { actions: true } }
export const CustomTexts: Story = { args: { pageIndicatorType: "Numeric", ofText: "from", previousPageText: "Previous product", nextPageText: "Next product", roleDescription: "Product slideshow", listLabel: "Products in slideshow" } }
export const RTL: Story = { globals: { dir: "rtl" } }
