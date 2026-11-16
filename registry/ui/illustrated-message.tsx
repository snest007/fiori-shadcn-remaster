import * as React from "react"

import type { IllustrationData, IllustrationSize } from "@/lib/fiori-illustrations/types"
import { cn } from "@/lib/utils"
import { Title, type TitleLevel } from "@/components/ui/title"

// Mirrors ui5-illustrated-message (Horizon, @ui5/webcomponents-fiori 2.28): an illustration, a title,
// a subtitle and actions, stacked and centered. Five designs: Scene (320×240), Dialog (160×160),
// Spot (128×128), Dot (45×45, illustration beside the text) and Base (text only, no actions).
// design="Auto" picks the design from the component's own width like UI5 (≤160 Base, ≤260 Dot,
// ≤360 Spot, ≤681 Dialog, else Scene) and steps down further when a height-constrained container
// can't fit the content.
// Illustrations are data modules (`@/lib/fiori-illustrations/<Name>`), so only the ones you import
// are bundled. Default title/subtitle are the illustration's English texts; pass your own to override.

type IllustratedMessageDesign = "Auto" | "Base" | "Dot" | "Spot" | "Dialog" | "Scene"
type Media = "base" | "dot" | "spot" | "dialog" | "scene"

const MEDIA: Media[] = ["base", "dot", "spot", "dialog", "scene"]
// IllustratedMessage.BREAKPOINTS in UI5 (component width in px, inclusive upper bounds).
const BREAKPOINTS: [number, Media][] = [
  [160, "base"],
  [260, "dot"],
  [360, "spot"],
  [681, "dialog"],
]
const TITLE_SIZE: Record<Media, TitleLevel> = { base: "H5", dot: "H5", spot: "H4", dialog: "H3", scene: "H2" }

const mediaForWidth = (w: number): Media => BREAKPOINTS.find(([max]) => w <= max)?.[1] ?? "scene"

/** @accessibility accessibleName names the illustration image; decorative hides only the illustration. titleLevel sets the semantic heading; titleText/subtitleText override the illustration defaults, and action children need accessible names. Base design hides actions. */
type IllustratedMessageProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The illustration, e.g. `import NoData from "@/lib/fiori-illustrations/NoData"`. */
  illustration: IllustrationData
  /** Fixed design, or "Auto" (default) to follow the component's width/height. */
  design?: IllustratedMessageDesign
  /** Title; defaults to the illustration's text. Pass `null` for none. */
  titleText?: React.ReactNode
  /** Subtitle; defaults to the illustration's text. Pass `null` for none. */
  subtitleText?: React.ReactNode
  /** Semantic level of the title heading (default H2, as ui5-title). */
  titleLevel?: TitleLevel
  /** "None" keeps the title on one line. */
  titleWrappingType?: "Normal" | "None"
  /** Accessible name of the illustration (default: the illustration's name, as UI5). */
  accessibleName?: string
  /** Hide the illustration from assistive technology. */
  decorative?: boolean
  /** Actions (buttons), shown under the subtitle except in the Base design. */
  children?: React.ReactNode
}

const sizeOf = (m: Media): IllustrationSize | undefined => (m === "base" ? undefined : m)

function svgMarkup(svg: string, uid: string) {
  return svg.replaceAll("__uid__", uid)
}

// UI5 draws these two hatch patterns once per component (they are referenced by class from a few
// illustrations); we render them per instance under the instance's id prefix.
function Patterns({ uid }: { uid: string }) {
  const dots = (cls: string, x0: number) => [
    [3 + x0, 5.5001], [x0, 5.5001], [1.5 + x0, 2.7501], [3 + x0, 0.0001], [x0, 0.0001],
  ].map(([cx, cy], i) => <circle key={i} fill={cls} cx={cx} cy={cy} r="0.5" />)
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0 overflow-hidden">
      <defs>
        <pattern id={`${uid}sapIllus_PatternShadow`} width="3" height="5.5" patternUnits="userSpaceOnUse" viewBox="0 0 3 5.5">
          <rect fill="none" width="3" height="5.5" />
          {dots("var(--sapContent_Illustrative_Color1)", 0)}
        </pattern>
        <pattern id={`${uid}sapIllus_PatternHighlight`} width="3" height="5.5" patternTransform="translate(35.9059 309.6208)" patternUnits="userSpaceOnUse" viewBox="0 0 3 5.5">
          <rect fill="none" width="3" height="5.5" />
          {dots("var(--sapContent_Illustrative_Color8)", 0.0001)}
        </pattern>
      </defs>
    </svg>
  )
}

function IllustratedMessage({
  illustration,
  design = "Auto",
  titleText,
  subtitleText,
  titleLevel = "H2",
  titleWrappingType,
  accessibleName,
  decorative,
  className,
  style,
  children,
  ...props
}: IllustratedMessageProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const uid = "im" + React.useId().replace(/[^a-zA-Z0-9]/g, "") + "-"
  const [autoMedia, setAutoMedia] = React.useState<Media | undefined>(undefined)
  // Content height needed per media, recorded only when it overflowed a height-constrained container.
  const needed = React.useRef<Partial<Record<Media, number>>>({})
  const measuredWidth = React.useRef<number | undefined>(undefined)

  const fixed: Media | undefined = design === "Auto" ? undefined : (design.toLowerCase() as Media)
  const media = fixed ?? autoMedia

  const apply = React.useCallback(() => {
    const el = ref.current
    if (!el || fixed) return
    const width = el.offsetWidth
    // IllustratedMessage.js:_checkHeightConstraints records real overflow, but
    // wrapped content heights belong to the width at which they were measured.
    // Remeasure after a resize instead of retaining a narrower layout's downgrade.
    if (measuredWidth.current !== width) {
      needed.current = {}
      measuredWidth.current = width
    }
    const current = el.dataset.media as Media | undefined
    if (current && el.scrollHeight > el.clientHeight) {
      const inner = el.querySelector<HTMLElement>(".fiori-illustrated-message__inner")
      if (inner?.scrollHeight) needed.current[current] = inner.scrollHeight
    }
    let i = MEDIA.indexOf(mediaForWidth(width))
    while (i > 0 && (needed.current[MEDIA[i]] ?? 0) > el.clientHeight) i--
    setAutoMedia(MEDIA[i])
  }, [fixed])

  React.useLayoutEffect(() => {
    if (fixed || !ref.current) return
    const ro = new ResizeObserver(apply)
    ro.observe(ref.current)
    let active = true
    // UI5's _handleThemeLoaded invalidates cached text heights when font metrics
    // change. A late web font can rewrap our content without resizing the host.
    const fontsChanged = () => {
      if (!active) return
      needed.current = {}
      apply()
    }
    document.fonts.addEventListener("loadingdone", fontsChanged)
    document.fonts.ready.then(fontsChanged)
    return () => {
      active = false
      ro.disconnect()
      document.fonts.removeEventListener("loadingdone", fontsChanged)
    }
  }, [fixed, apply])

  // New content: recorded heights are stale.
  React.useLayoutEffect(() => {
    needed.current = {}
    apply()
  }, [apply, illustration, titleText, subtitleText])

  // A design was just applied: it may still overflow a height-constrained container, then step down again.
  React.useLayoutEffect(apply, [apply, autoMedia])

  const title = titleText === undefined ? illustration.title : titleText
  const subtitle = subtitleText === undefined ? illustration.subtitle : subtitleText
  const size = media && sizeOf(media)
  const svg = size ? illustration[size] : undefined
  const hcSvg = size ? illustration.hc?.[size] : undefined
  const hasPatterns = !!svg?.includes("sapIllus_Pattern")
  const hasActions = React.Children.toArray(children).length > 0 && media !== "base"

  return (
    <div
      ref={ref}
      data-slot="illustrated-message"
      data-media={media}
      className={cn("fiori-illustrated-message", className)}
      style={style}
      {...props}
    >
      <div className="fiori-illustrated-message__root">
        <div className="fiori-illustrated-message__inner">
          <div
            className="fiori-illustrated-message__illustration"
            role={decorative ? "presentation" : "img"}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : (accessibleName ?? illustration.name)}
          >
            {svg && (
              <div
                className={hcSvg ? "fiori-illustrated-message__svg fiori-illustrated-message__svg-default" : "fiori-illustrated-message__svg"}
                dangerouslySetInnerHTML={{ __html: svgMarkup(svg, uid) }}
              />
            )}
            {hcSvg && (
              <div className="fiori-illustrated-message__svg fiori-illustrated-message__svg-hc" dangerouslySetInnerHTML={{ __html: svgMarkup(hcSvg, uid + "hc-") }} />
            )}
          </div>
          <div className="fiori-illustrated-message__text">
            {title != null && title !== "" && (
              <div className="fiori-illustrated-message__title" data-slot="illustrated-message-title">
                {typeof title === "string" ? (
                  <Title level={titleLevel} size={TITLE_SIZE[media ?? "scene"]} wrappingType={titleWrappingType}>{title}</Title>
                ) : (
                  title
                )}
              </div>
            )}
            {subtitle != null && subtitle !== "" && (
              <div className="fiori-illustrated-message__subtitle" data-slot="illustrated-message-subtitle">{subtitle}</div>
            )}
            {hasActions && <div className="fiori-illustrated-message__actions">{children}</div>}
          </div>
        </div>
        {hasPatterns && <Patterns uid={uid} />}
      </div>
    </div>
  )
}

export { IllustratedMessage, type IllustratedMessageProps, type IllustratedMessageDesign }
