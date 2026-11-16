import * as React from "react"

import { directionArrows } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Mirrors ui5-slider and ui5-range-slider (Horizon), incl. SliderScale / SliderHandle / SliderTooltip.
// Keyboard (as UI5, on a focused handle): ←/↓/- decrease and →/↑/+ increase by `step`; PageUp/PageDown and
// Ctrl+arrows jump by a tenth of the range when the range has more than 10 steps (otherwise by `step`);
// Home/End go to min/max; Escape restores the value the control had when it received focus.
// Arrows are mirrored in right-to-left layouts. Handles are role="slider" with aria-valuemin/max/now.
// RangeSlider: Tab stops are the selected range (moves both values, Home/End move the range to the
// bounds), then the start and end handles. A handle dragged or stepped past the other one swaps the values.
// Pointer: press on the track sets the value (nearest handle for ranges), dragging follows the pointer;
// dragging the selected range moves both values. `onValueChange` fires live, `onValueCommit` once the
// interaction (pointer up / key up) ends with a changed value.
// Not implemented: editable tooltips (F2), custom tickmark labels, vertical orientation.

type Tick = { value: number; position: number; label: string; inRange: boolean; showLabel: boolean }

const precisionOf = (n: number) => {
  if (Number.isInteger(n)) return 0
  const m = String(n).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/)
  return m ? Math.max(0, (m[1]?.length ?? 0) - (m[2] ? Number(m[2]) : 0)) : 0
}
const clip = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const round = (v: number, step: number) => Number(v.toFixed(precisionOf(step)))
const stepped = (v: number, step: number, min: number) => {
  const mod = Math.abs((v - min) % step)
  if (step === 0 || mod === 0) return v
  return mod * 2 >= step ? v + step - mod : v - mod
}

const KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "Home", "End", "PageUp", "PageDown", "Escape"]

/** Offset for an action key (SliderBase._handleActionKeyPressBase); `undefined` for other keys. */
function keyOffset(e: React.KeyboardEvent, current: number, min: number, max: number, step: number, rtl: boolean) {
  if (!KEYS.includes(e.key) || e.key === "Escape") return undefined
  if (e.key === "End") return max - current
  if (e.key === "Home") return -(current - min)
  const big = e.key === "PageUp" || e.key === "PageDown" || (e.ctrlKey && e.key.startsWith("Arrow"))
  const s = big && (max - min) / step > 10 ? (max - min) / 10 : step
  const up = ["ArrowUp", "+", "PageUp", rtl ? "ArrowLeft" : "ArrowRight"].includes(e.key)
  return up ? s : -s
}

function useWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** SliderScale's tickmark logic: hide inner ticks under 8px spacing, show only end labels when labels would overlap. */
function useTicks(width: number, min: number, max: number, step: number, show: boolean, labelInterval: number, start: number, end: number) {
  if (!show || step === 0) return []
  const count = (max - min) / step
  const hidden = count > 1 && width / count < 8
  const overlapping = labelInterval <= 0 || hidden || width < (Math.ceil((count - 1) / labelInterval) + 1) * 32
  const prec = precisionOf(step)
  const ticks: Tick[] = []
  const values: number[] = []
  for (let v = min; v <= max; v += step) values.push(v)
  values.forEach((value, i) => {
    const edge = i === 0 || i === values.length - 1
    if (hidden && !edge) return
    let showLabel = false
    if (!overlapping) showLabel = labelInterval > 0 ? i % labelInterval === 0 : true
    else if (labelInterval > 0) showLabel = edge
    ticks.push({ value, position: ((value - min) / (max - min)) * 100, label: value.toFixed(prec), inRange: value >= start && value <= end, showLabel })
  })
  return ticks
}

/**
 * @accessibility Slider aria-label is combined with handleDescription on its slider handle. RangeSlider names the range and both handles with rangeDescription, startHandleDescription and endHandleDescription; rangeValueText describes both values.
 * @accessibility Arrow keys and plus/minus step; PageUp/PageDown and Ctrl+arrows use a larger step; Home/End reach bounds and Escape restores the focus value. Horizontal arrows mirror in RTL. RangeSlider has separate range, start and end tab stops.
 */
type SliderBaseProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  min?: number
  max?: number
  step?: number
  /** Draw a tickmark per step. */
  showTickmarks?: boolean
  /** Label every n-th tickmark (needs showTickmarks). 0 = no labels. */
  labelInterval?: number
  /** Show the value above the handle while hovered or focused. */
  showTooltip?: boolean
  disabled?: boolean
}

function Scale({
  ticks,
  progress,
  children,
  scaleRef,
}: {
  ticks: Tick[]
  progress: React.ReactNode
  children: React.ReactNode
  scaleRef: React.Ref<HTMLDivElement>
}) {
  return (
    <div ref={scaleRef} className="fiori-slider__scale" data-slot="slider-scale">
      <div className="fiori-slider__track">
        {ticks.length > 0 && (
          <div className="fiori-slider__tickmarks" aria-hidden>
            {ticks.map((t) => (
              <div key={t.value} className="fiori-slider__tickmark" data-in-range={t.inRange ? "" : undefined} style={{ insetInlineStart: `${t.position}%` }}>
                {t.showLabel && <span className="fiori-slider__tickmark-label">{t.label}</span>}
              </div>
            ))}
          </div>
        )}
        {progress}
      </div>
      {children}
    </div>
  )
}

type HandleProps = React.ComponentProps<"div"> & { position: number; active?: boolean; tooltip?: string; showTooltip?: boolean }

function Handle({ position, active, tooltip, showTooltip, className, ...props }: HandleProps) {
  return (
    <div
      data-slot="slider-handle"
      data-active={active ? "" : undefined}
      role="slider"
      aria-orientation="horizontal"
      className={cn("fiori-slider__handle", className)}
      style={{ insetInlineStart: `clamp(0%, ${position}%, 100%)` }}
      {...props}
    >
      <Icon icon={directionArrows} className="fiori-slider__handle-icon" />
      {showTooltip && (
        <span className="fiori-slider__tooltip" aria-hidden>
          {tooltip}
        </span>
      )}
    </div>
  )
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const current = value ?? inner
  const ref = React.useRef(current)
  ref.current = current
  const set = React.useCallback(
    (v: T) => {
      ref.current = v
      if (value === undefined) setInner(v)
      onChange?.(v)
    },
    [value, onChange]
  )
  return [current, set, ref] as const
}

const isRtl = (el: Element) => getComputedStyle(el).direction === "rtl"

/** SliderBase.js getValueFromInteraction: value relative to the supplied interaction host (stepped and clipped). */
function sliderValueAt(e: { clientX: number }, scale: HTMLElement, min: number, max: number, step: number) {
  const r = scale.getBoundingClientRect()
  const x = isRtl(scale) ? r.right - e.clientX : e.clientX - r.left
  return round(clip(stepped(min + (x / r.width) * (max - min), step, min), min, max), step)
}

/** Slider.js _isHandlePressed uses the horizontal span, including presses above or below the handle. */
function isSliderHandlePressed(clientX: number, handle: HTMLElement | null) {
  const rect = handle?.getBoundingClientRect()
  return !!rect && clientX >= rect.left && clientX <= rect.right
}

type SliderProps = SliderBaseProps & {
  value?: number
  defaultValue?: number
  /** Fires on every change while the user interacts. */
  onValueChange?: (value: number) => void
  /** Fires when an interaction ends with a different value (UI5 `change`). */
  onValueCommit?: (value: number) => void
  /** Accessible name; " Slider handle" is appended as in UI5 (handle description text overridable). */
  "aria-label"?: string
  handleDescription?: string
}

function Slider({
  min = 0,
  max = 100,
  step = 1,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  onValueCommit,
  showTickmarks,
  labelInterval = 0,
  showTooltip,
  disabled,
  handleDescription = "Slider handle",
  "aria-label": ariaLabel,
  className,
  ...props
}: SliderProps) {
  const [value, setValue, valueRef] = useControllable(valueProp, defaultValue, onValueChange)
  const [scaleRef, width] = useWidth<HTMLDivElement>()
  const handleRef = React.useRef<HTMLDivElement>(null)
  const atFocus = React.useRef<number | undefined>(undefined)
  const atStart = React.useRef<number | undefined>(undefined)
  const [active, setActive] = React.useState(false)
  const v = clip(value, Math.min(min, max), Math.max(min, max))
  const pos = ((v - min) / (max - min)) * 100
  const ticks = useTicks(width, min, max, step, !!showTickmarks, labelInterval, min, v)
  const commit = () => {
    if (atStart.current !== undefined && atStart.current !== valueRef.current) onValueCommit?.(valueRef.current)
    atStart.current = undefined
  }
  const update = (n: number) => n !== valueRef.current && setValue(n)

  return (
    <div
      data-slot="slider"
      data-disabled={disabled ? "" : undefined}
      data-labels={labelInterval > 0 ? "" : undefined}
      className={cn("fiori-slider", className)}
      {...props}
    >
      <div
        className="fiori-slider__root"
        onPointerDown={(e) => {
          if (disabled || step === 0 || e.button !== 0 || !scaleRef.current) return
          e.preventDefault()
          atStart.current = valueRef.current
          if (atFocus.current === undefined) atFocus.current = valueRef.current
          // Slider.js _isHandlePressed: a press anywhere within the handle's horizontal span (above/below it too)
          // keeps the value; only the column decides, not which element was hit.
          const onHandle = isSliderHandlePressed(e.clientX, handleRef.current)
          if (!onHandle) update(sliderValueAt(e, scaleRef.current, min, max, step))
          handleRef.current?.focus()
          setActive(true)
          const scale = scaleRef.current
          const move = (ev: PointerEvent) => update(sliderValueAt(ev, scale, min, max, step))
          const up = () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            setActive(false)
            commit()
          }
          window.addEventListener("pointermove", move)
          window.addEventListener("pointerup", up)
        }}
      >
        <Scale
          scaleRef={scaleRef}
          ticks={ticks}
          progress={<div className="fiori-slider__progress" style={{ insetInlineStart: 0, width: `${pos}%` }} />}
        >
          <Handle
            ref={handleRef}
            position={pos}
            active={active}
            showTooltip={showTooltip}
            tooltip={v.toFixed(precisionOf(step))}
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-label={ariaLabel ? `${ariaLabel} ${handleDescription}` : handleDescription}
            aria-disabled={disabled || undefined}
            onFocus={() => {
              if (atFocus.current === undefined) atFocus.current = valueRef.current
            }}
            onBlur={() => (atFocus.current = undefined)}
            onKeyDown={(e) => {
              if (disabled || step === 0) return
              if (e.key === "Escape") {
                if (atFocus.current !== undefined && atFocus.current !== valueRef.current) {
                  e.preventDefault()
                  atStart.current ??= valueRef.current
                  update(atFocus.current)
                }
                return
              }
              const off = keyOffset(e, valueRef.current, min, max, step, isRtl(e.currentTarget))
              if (off === undefined) return
              e.preventDefault()
              atStart.current ??= valueRef.current
              update(round(clip(valueRef.current + off, min, max), step))
            }}
            onKeyUp={() => commit()}
          />
        </Scale>
      </div>
    </div>
  )
}

type RangeSliderProps = SliderBaseProps & {
  value?: [number, number]
  defaultValue?: [number, number]
  onValueChange?: (value: [number, number]) => void
  onValueCommit?: (value: [number, number]) => void
  "aria-label"?: string
  /** Handle descriptions appended to the accessible name (UI5 "Minimum" / "Maximum"). */
  startHandleDescription?: string
  endHandleDescription?: string
  /** Description of the range (UI5 "Range"). */
  rangeDescription?: string
  /** aria-valuetext of the selected range. Default `From ${start} to ${end}`. */
  rangeValueText?: (start: number, end: number) => string
}

function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value: valueProp,
  defaultValue = [0, 100],
  onValueChange,
  onValueCommit,
  showTickmarks,
  labelInterval = 0,
  showTooltip,
  disabled,
  startHandleDescription = "Minimum",
  endHandleDescription = "Maximum",
  rangeDescription = "Range",
  rangeValueText = (s, e) => `From ${s} to ${e}`,
  "aria-label": ariaLabel,
  className,
  ...props
}: RangeSliderProps) {
  const [value, setValue, valueRef] = useControllable<[number, number]>(valueProp, defaultValue, onValueChange)
  const [scaleRef, width] = useWidth<HTMLDivElement>()
  const startRef = React.useRef<HTMLDivElement>(null)
  const endRef = React.useRef<HTMLDivElement>(null)
  const progressRef = React.useRef<HTMLDivElement>(null)
  const atFocus = React.useRef<[number, number] | undefined>(undefined)
  const atStart = React.useRef<[number, number] | undefined>(undefined)
  const [pressed, setPressed] = React.useState(false)
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  const [s, e] = [clip(value[0], lo, hi), clip(value[1], lo, hi)]
  const pct = (n: number) => ((n - min) / (max - min)) * 100
  const ticks = useTicks(width, min, max, step, !!showTickmarks, labelInterval, s, e)
  const prec = precisionOf(step)
  const same = (a?: [number, number], b?: [number, number]) => !!a && !!b && a[0] === b[0] && a[1] === b[1]
  const commit = () => {
    if (atStart.current && !same(atStart.current, valueRef.current)) onValueCommit?.(valueRef.current)
    atStart.current = undefined
  }
  const update = (n: [number, number]) => !same(n, valueRef.current) && setValue(n)
  /** Sets one end; when it passes the other one the values swap and focus follows (as UI5). */
  const setEnd = (which: 0 | 1, n: number) => {
    const cur = valueRef.current
    const other = cur[which === 0 ? 1 : 0]
    const crossed = which === 0 ? n > other : n < other
    if (!crossed) {
      update(which === 0 ? [n, other] : [other, n])
      return which
    }
    update(which === 0 ? [other, n] : [n, other])
    const next = which === 0 ? 1 : 0
    ;(next === 0 ? startRef : endRef).current?.focus()
    return next as 0 | 1
  }
  const moveRange = (off: number) => {
    const [a, b] = valueRef.current
    if ((off < 0 && a > lo) || (off > 0 && b < hi)) update([round(clip(a + off, lo, hi), step), round(clip(b + off, lo, hi), step)])
  }
  const onFocus = () => {
    atFocus.current ??= valueRef.current
  }
  const onBlur = (ev: React.FocusEvent) => {
    if (!ev.currentTarget.closest("[data-slot=range-slider]")?.contains(ev.relatedTarget as Node)) atFocus.current = undefined
  }
  const keyDown = (target: "range" | 0 | 1) => (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || step === 0) return
    if (ev.key === "Escape") {
      if (atFocus.current && !same(atFocus.current, valueRef.current)) {
        ev.preventDefault()
        atStart.current ??= valueRef.current
        update(atFocus.current)
      }
      return
    }
    const rtl = isRtl(ev.currentTarget)
    const cur = valueRef.current
    if (target === "range" && (ev.key === "Home" || ev.key === "End")) {
      ev.preventDefault()
      atStart.current ??= cur
      const off = ev.key === "Home" ? lo - cur[0] : hi - cur[1]
      update([round(clip(cur[0] + off, lo, hi), step), round(clip(cur[1] + off, lo, hi), step)])
      return
    }
    const off = keyOffset(ev, target === "range" ? cur[0] : cur[target], lo, hi, step, rtl)
    if (off === undefined) return
    ev.preventDefault()
    if (!off) return
    atStart.current ??= cur
    if (target === "range") moveRange(off)
    else setEnd(target, round(clip(cur[target] + off, lo, hi), step))
  }
  const name = (d: string) => (ariaLabel ? `${ariaLabel} ${d}` : d)

  return (
    <div
      data-slot="range-slider"
      data-disabled={disabled ? "" : undefined}
      data-labels={labelInterval > 0 ? "" : undefined}
      className={cn("fiori-slider", className)}
      {...props}
    >
      <div
        className="fiori-slider__root"
        onPointerDown={(ev) => {
          if (disabled || step === 0 || ev.button !== 0 || !scaleRef.current) return
          ev.preventDefault()
          const scale = scaleRef.current
          const cur = valueRef.current
          atStart.current = cur
          atFocus.current ??= cur
          const v = sliderValueAt(ev, scale, min, max, step)
          const onStart = startRef.current?.contains(ev.target as Node)
          const onEnd = endRef.current?.contains(ev.target as Node)
          let mode: "range" | 0 | 1
          if (onStart) mode = 0
          else if (onEnd) mode = 1
          else if (v >= cur[0] && v <= cur[1]) mode = "range"
          else mode = v < cur[0] ? 0 : 1
          if (mode === "range") {
            setPressed(true)
            progressRef.current?.focus()
          } else {
            if (!onStart && !onEnd) mode = setEnd(mode, v)
            ;(mode === 0 ? startRef : endRef).current?.focus()
          }
          const grab = v
          const base = cur
          const move = (pe: PointerEvent) => {
            const n = sliderValueAt(pe, scale, min, max, step)
            if (mode === "range") {
              const off = clip(n - grab, lo - base[0], hi - base[1])
              update([round(base[0] + off, step), round(base[1] + off, step)])
            } else mode = setEnd(mode, n)
          }
          const up = () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            setPressed(false)
            commit()
          }
          window.addEventListener("pointermove", move)
          window.addEventListener("pointerup", up)
        }}
      >
        <Scale
          scaleRef={scaleRef}
          ticks={ticks}
          progress={
            <div
              ref={progressRef}
              className="fiori-slider__progress"
              data-pressed={pressed ? "" : undefined}
              style={{ insetInlineStart: `${pct(s)}%`, width: `${pct(e) - pct(s)}%` }}
              tabIndex={disabled ? -1 : 0}
              role="slider"
              aria-orientation="horizontal"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={Math.abs(e - s)}
              aria-valuetext={rangeValueText(s, e)}
              aria-label={name(rangeDescription)}
              aria-disabled={disabled || undefined}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={keyDown("range")}
              onKeyUp={commit}
            />
          }
        >
          {([0, 1] as const).map((i) => (
            <Handle
              key={i}
              ref={i === 0 ? startRef : endRef}
              data-handle={i === 0 ? "start" : "end"}
              position={pct(i === 0 ? s : e)}
              active={pressed}
              showTooltip={showTooltip}
              tooltip={(i === 0 ? s : e).toFixed(prec)}
              tabIndex={disabled ? -1 : 0}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={i === 0 ? s : e}
              aria-label={name(i === 0 ? startHandleDescription : endHandleDescription)}
              aria-disabled={disabled || undefined}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={keyDown(i)}
              onKeyUp={commit}
            />
          ))}
        </Scale>
      </div>
    </div>
  )
}

export { Slider, RangeSlider, sliderValueAt, isSliderHandlePressed, type SliderProps, type RangeSliderProps }
