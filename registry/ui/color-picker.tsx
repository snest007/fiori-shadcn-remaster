import * as React from "react"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { colorToRgba, hslToRgb, parseCssColor, rgbToHex, rgbToHsl, type FioriColor, type FioriHslColor } from "@/lib/fiori-color"
import { expand } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))
type PickerModel = { color: FioriColor; hsl: FioriHslColor; hue: number }
const modelFrom = (value: string): PickerModel => {
  const color = parseCssColor(value) ?? { r: 255, g: 255, b: 255, a: 1 }
  const hsl = rgbToHsl(color)
  return { color, hsl, hue: hsl.h }
}

type ColorPickerTexts = {
  picker: string; sliders: string; hueSlider: string; alphaSlider: string; sliderHandle: string
  hex: string; hexLabel: string; red: string; green: string; blue: string; hue: string; saturation: string; light: string; alpha: string
  redLabel: string; greenLabel: string; blueLabel: string; hueLabel: string; saturationLabel: string; lightLabel: string; alphaLabel: string; percentage: string
  toggleMode: string; invalidEntry: string; modeChanged: (mode: string, values: string) => string
}
const defaultTexts: ColorPickerTexts = {
  picker: "Color Picker", sliders: "Color Sliders", hueSlider: "Hue Slider", alphaSlider: "Alpha Slider", sliderHandle: "Slider handle",
  hex: "Hexadecimal", hexLabel: "Hex", red: "Red", green: "Green", blue: "Blue", hue: "Hue", saturation: "Saturation", light: "Light", alpha: "Alpha",
  redLabel: "R", greenLabel: "G", blueLabel: "B", hueLabel: "H", saturationLabel: "S", lightLabel: "L", alphaLabel: "A", percentage: "%",
  toggleMode: "Change Color Mode", invalidEntry: "Invalid entry", modeChanged: (mode, values) => `Color mode changed to ${mode}. Current values: ${values}.`,
}
type ColorPickerProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void; simplified?: boolean
  accessibleName?: string; texts?: Partial<ColorPickerTexts>
}

function ChannelInput({ value, name, disabled, onCommit }: { value: number; name: string; disabled: boolean; onCommit: (value: string) => string }) {
  const [raw, setRaw] = React.useState(String(value))
  React.useEffect(() => { setRaw(String(value)) }, [value])
  const commit = () => { if (raw !== String(value)) setRaw(onCommit(raw)) }
  return <Input aria-label={name} disabled={disabled} wrapperClassName="fiori-color-picker__channel-input" value={raw} onChange={(event) => setRaw(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") commit() }} />
}

/** ColorPicker's SliderTemplate.js uses a shortened inner scale, so its markup is ported locally. */
function PickerSlider({ value, max, step, disabled, name, handleDescription, kind, onValueChange }: {
  value: number; max: number; step: number; disabled: boolean; name: string; handleDescription: string; kind: "hue" | "alpha"; onValueChange: (value: number) => void
}) {
  const innerRef = React.useRef<HTMLDivElement>(null), handleRef = React.useRef<HTMLDivElement>(null)
  const valueRef = React.useRef(value), atFocus = React.useRef<number | undefined>(undefined)
  valueRef.current = value
  const update = (n: number) => {
    const next = Number(clamp(n, max).toFixed(step === 1 ? 0 : 2))
    if (next !== valueRef.current) { valueRef.current = next; onValueChange(next) }
  }
  const fromPointer = (clientX: number) => {
    const element = innerRef.current!
    const rect = element.getBoundingClientRect()
    const ratio = getComputedStyle(element).direction === "rtl" ? (rect.right - clientX) / rect.width : (clientX - rect.left) / rect.width
    update(Math.round(ratio * max / step) * step)
  }
  return <div data-slot={`color-picker-${kind}-slider`} data-disabled={disabled ? "" : undefined} className={`fiori-color-picker__slider fiori-color-picker__slider--${kind}`}>
    <div className="fiori-color-picker__slider-root" onPointerDown={(event) => {
      if (disabled || event.button !== 0) return
      event.preventDefault()
      if (!handleRef.current?.contains(event.target as Node)) fromPointer(event.clientX)
      handleRef.current?.focus()
      const move = (e: PointerEvent) => fromPointer(e.clientX)
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up)
    }}>
      <div className="fiori-color-picker__scale"><div ref={innerRef} className="fiori-color-picker__scale-inner">
        <div ref={handleRef} className="fiori-color-picker__slider-handle" role="slider" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined}
          aria-label={`${name} ${handleDescription}`} aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
          style={{ insetInlineStart: `${clamp(value / max * 100, 100)}%` }} onFocus={() => { atFocus.current ??= valueRef.current }} onBlur={() => { atFocus.current = undefined }}
          onKeyDown={(event) => {
            // SliderBase.js _handleActionKeyPressBase / Keys.js: Shift/Alt combinations are not action keys.
            const symbol = event.key === "+" || event.key === "-"
            if (disabled || (!symbol && (event.shiftKey || event.altKey))) return
            const action = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "PageUp", "PageDown", "Home", "End", "Escape"].includes(event.key)
            if (!action || (!symbol && (event.ctrlKey || event.metaKey) && !event.key.startsWith("Arrow"))) return
            event.preventDefault()
            if (event.key === "Escape") { if (atFocus.current !== undefined) update(atFocus.current); return }
            if (event.key === "Home" || event.key === "End") { update(event.key === "Home" ? 0 : max); return }
            const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
            const increase = ["ArrowUp", "+", "PageUp", rtl ? "ArrowLeft" : "ArrowRight"].includes(event.key)
            const big = ((event.ctrlKey || event.metaKey) && event.key.startsWith("Arrow")) || event.key.startsWith("Page")
            update(valueRef.current + (increase ? 1 : -1) * (big && max / step > 10 ? max / 10 : step))
          }}>
          <span className="fiori-color-picker__slider-handle-inner" />
          <span className="fiori-color-picker__tooltip" aria-hidden>{value.toFixed(step === 1 ? 0 : 2)}</span>
        </div>
      </div></div>
    </div>
  </div>
}

function usePickerState(initialValue: string) {
  const [model, setModel] = React.useState(() => modelFrom(initialValue))
  const lastValue = React.useRef(initialValue)
  const committedHex = React.useRef(rgbToHex(model.color))
  const [hex, setHex] = React.useState(() => rgbToHex(model.color)), [wrongHex, setWrongHex] = React.useState(false)
  const [displayHsl, setDisplayHsl] = React.useState(false), [alphaTemp, setAlphaTemp] = React.useState<string | undefined>()
  const [announcement, setAnnouncement] = React.useState("")
  const modelRef = React.useRef(model); modelRef.current = model
  return { model, setModel, lastValue, committedHex, hex, setHex, wrongHex, setWrongHex, displayHsl, setDisplayHsl, alphaTemp, setAlphaTemp, announcement, setAnnouncement, modelRef }
}
const PickerStateContext = React.createContext<ReturnType<typeof usePickerState> | null>(null)
/** ColorPaletteMoreColorsTemplate.js retains its ColorPicker instance while the dialog is closed. */
function ColorPickerStateProvider({ children }: { children: React.ReactNode }) {
  const state = usePickerState("rgba(255,255,255,1)")
  return <PickerStateContext.Provider value={state}>{children}</PickerStateContext.Provider>
}

function ColorPicker({ value, defaultValue = "rgba(255,255,255,1)", onValueChange, simplified = false, accessibleName, texts: customTexts, className, style, ...props }: ColorPickerProps) {
  const texts = { ...defaultTexts, ...customTexts }
  const local = usePickerState(value ?? defaultValue)
  const shared = React.useContext(PickerStateContext)
  const { model, setModel, lastValue, committedHex, hex, setHex, wrongHex, setWrongHex, displayHsl, setDisplayHsl, alphaTemp, setAlphaTemp, announcement, setAnnouncement, modelRef } = shared ?? local
  React.useLayoutEffect(() => {
    if (value !== undefined && value !== lastValue.current) {
      const next = modelFrom(value); lastValue.current = value; committedHex.current = rgbToHex(next.color); setModel(next); setHex(rgbToHex(next.color)); setWrongHex(false); setAlphaTemp(undefined)
    }
  }, [value, lastValue, committedHex, setModel, setHex, setWrongHex, setAlphaTemp])
  const commit = (next: PickerModel, preserveHex = false) => {
    modelRef.current = next; setModel(next)
    const color = colorToRgba(next.color); lastValue.current = color
    if (!preserveHex) { committedHex.current = rgbToHex(next.color); setHex(committedHex.current); setWrongHex(false) }
    onValueChange?.(color)
  }
  const fromHsl = (hsl: FioriHslColor, hue = hsl.h) => commit({ hsl, hue, color: { ...hslToRgb(hsl), a: modelRef.current.color.a } })
  const changeHex = () => {
    // ColorPicker.js _handleHEXChange accepts a leading # and expands three-character shorthand before validation.
    let normalized = hex.toLowerCase().replace(/^#/, "")
    if (normalized.length === 3) normalized = [...normalized].map((digit) => digit + digit).join("")
    const valid = normalized.length === 6 && /^[<0-9 abcdef]+$/.test(normalized)
    committedHex.current = normalized
    setWrongHex(!valid)
    // _handleHEXChange stores normalized ColorValue.HEX even on error. The first Negative-state render
    // refreshes the input from HEX; repeated invalid edits retain their raw text until another picker render.
    if (!valid) { if (!wrongHex) setHex(normalized); return }
    const rgb = { r: parseInt(normalized.slice(0, 2), 16), g: parseInt(normalized.slice(2, 4), 16), b: parseInt(normalized.slice(4, 6), 16) }
    const hsl = rgbToHsl(rgb); setHex(normalized)
    commit({ color: { ...rgb, a: modelRef.current.color.a }, hsl, hue: hsl.h }, true)
  }
  const changeChannel = (key: "r" | "g" | "b" | "h" | "s" | "l", raw: string) => {
    // ColorPicker.js _handleColorInputChange and ColorValue.js normalize* clamp parsed integers, not negative value states.
    const n = clamp(parseInt(raw) || 0, key === "h" ? 360 : key === "s" || key === "l" ? 100 : 255)
    if (key === "h" || key === "s" || key === "l") fromHsl({ ...modelRef.current.hsl, [key]: n })
    else {
      const color = { ...modelRef.current.color, [key]: n }, hsl = rgbToHsl(color)
      commit({ color, hsl, hue: hsl.h })
    }
    return String(n)
  }
  const channelInputs = displayHsl ? ([['h', texts.hueLabel, texts.hue], ['s', texts.saturationLabel, texts.saturation], ['l', texts.lightLabel, texts.light]] as const)
    : ([['r', texts.redLabel, texts.red], ['g', texts.greenLabel, texts.green], ['b', texts.blueLabel, texts.blue]] as const)
  // ColorPicker.js _setMainColor uses 4.251 to cover the final hue sector (rather than ordinary HSL conversion).
  const hueMod = model.hue * 4.251
  const main = hueMod <= 255 ? [255, hueMod, 0] : hueMod <= 510 ? [510 - hueMod, 255, 0] : hueMod <= 765 ? [0, 255, hueMod - 510]
    : hueMod <= 1020 ? [0, 1020 - hueMod, 255] : hueMod <= 1275 ? [hueMod - 1020, 0, 255] : [255, 0, 1530 - hueMod]
  return <div data-slot="color-picker" className={cn("fiori-color-picker", className)} style={{ "--fiori-color-picker-progress-color": colorToRgba(model.color), ...style } as React.CSSProperties} {...props}>
    <div className="fiori-color-picker__root" role="group" aria-label={`${texts.picker}${accessibleName ? ` ${accessibleName}` : ""}`}>
      <div className="fiori-color-picker__main" role="presentation" style={{ backgroundColor: `rgb(${main.join(", ")})` }} onPointerDown={(event) => {
        if (event.button !== 0) return
        const box = event.currentTarget
        const update = (clientX: number, clientY: number) => {
          const rect = box.getBoundingClientRect(), size = box.clientWidth
          // ColorPicker.js _calculateColorFromCoordinates: x is lightness, y is inverted saturation, rounded to percent.
          const hsl = { h: Math.round(modelRef.current.hue), s: Math.round(clamp(Number((1 - (clientY - rect.top - box.clientTop) / size).toFixed(2)), 1) * 100), l: Math.round(clamp(Number(((clientX - rect.left - box.clientLeft) / size).toFixed(2)), 1) * 100) }
          fromHsl(hsl, modelRef.current.hue)
        }
        update(event.clientX, event.clientY)
        const move = (e: PointerEvent) => {
          update(e.clientX, e.clientY)
          const rect = box.getBoundingClientRect()
          // UI5 _handleMouseOut applies the clamped edge once, then ends the area's drag.
          if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) up()
        }
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", up)
      }}><div className="fiori-color-picker__circle" style={{ left: `${model.hsl.l}%`, top: `${100 - model.hsl.s}%` }} /></div>
      <div className="fiori-color-picker__sliders" role="group" aria-label={texts.sliders}>
        <PickerSlider kind="hue" max={360} step={1} value={model.hue} disabled={wrongHex} name={texts.hueSlider} handleDescription={texts.sliderHandle} onValueChange={(hue) => fromHsl({ ...modelRef.current.hsl, h: hue }, hue)} />
        {!simplified && <PickerSlider kind="alpha" max={1} step={.01} value={model.color.a} disabled={wrongHex} name={texts.alphaSlider} handleDescription={texts.sliderHandle} onValueChange={(a) => { setAlphaTemp(undefined); commit({ ...modelRef.current, color: { ...modelRef.current.color, a } }) }} />}
      </div>
      <div className="fiori-color-picker__current">
        <div className="fiori-color-picker__colors"><span className="fiori-color-picker__white" /><span className="fiori-color-picker__color"><span className="fiori-color-picker__color-inner" style={{ backgroundColor: colorToRgba(model.color) }} /></span></div>
        <div className="fiori-color-picker__hex-wrapper"><Label>{texts.hexLabel}</Label><Input aria-label={texts.hex} wrapperClassName="fiori-color-picker__hex" value={hex} onInput={(e) => setHex(e.currentTarget.value)} onChange={() => {}} onBlur={() => { if (hex !== rgbToHex(model.color)) changeHex() }} onKeyDown={(e) => { if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) changeHex() }} valueState={wrongHex ? "negative" : "none"} valueStateMessage={texts.invalidEntry} /></div>
      </div>
      {!simplified && <div className="fiori-color-picker__channels">
        {channelInputs.map(([key, label, name]) => <React.Fragment key={key}><div className="fiori-color-picker__channel"><ChannelInput name={name} disabled={wrongHex} value={key in model.color ? model.color[key as 'r' | 'g' | 'b'] : model.hsl[key as 'h' | 's' | 'l']} onCommit={(raw) => changeChannel(key, raw)} /><Label>{label}</Label></div><div className="fiori-color-picker__percentage">{(key === "s" || key === "l") && <Label>{texts.percentage}</Label>}</div></React.Fragment>)}
        <div className="fiori-color-picker__channel"><Input aria-label={texts.alpha} disabled={wrongHex} wrapperClassName="fiori-color-picker__channel-input" value={alphaTemp ?? String(model.color.a)} onChange={(e) => {
          const raw = e.target.value; setAlphaTemp(raw)
          // _handleAlphaInput emits continuously and keeps the raw text until _handleAlphaChange on blur.
          const parsed = parseFloat(raw), a = Number.isNaN(parsed) ? 1 : parsed
          commit({ ...modelRef.current, color: { ...modelRef.current.color, a } })
        }} onBlur={() => {
          if (alphaTemp === undefined) return
          const parsed = parseFloat(alphaTemp), a = clamp(Number.isNaN(parsed) ? 1 : parsed, 1)
          setAlphaTemp(undefined)
          // _handleAlphaChange runs before the bubbled _handleColorInputChange, which emits the normalized RGBA.
          commit({ ...modelRef.current, color: { ...modelRef.current.color, a } })
        }} onKeyDown={(event) => {
          if (event.key !== "Enter" || alphaTemp === undefined) return
          const parsed = parseFloat(alphaTemp), a = clamp(Number.isNaN(parsed) ? 1 : parsed, 1)
          setAlphaTemp(undefined); commit({ ...modelRef.current, color: { ...modelRef.current.color, a } })
        }} /><Label>{texts.alphaLabel}</Label></div>
        <div><Button variant="transparent" className="fiori-color-picker__toggle" title={texts.toggleMode} aria-label={texts.toggleMode} onClick={() => {
          const next = !displayHsl; setDisplayHsl(next); setHex(committedHex.current)
          const v = modelRef.current
          const channels = next ? `${texts.hue} ${v.hsl.h}, ${texts.saturation} ${v.hsl.s} ${texts.percentage}, ${texts.light} ${v.hsl.l} ${texts.percentage}, ` : `${texts.red} ${v.color.r}, ${texts.green} ${v.color.g}, ${texts.blue} ${v.color.b}, `
          setAnnouncement(texts.modeChanged(next ? "HSL" : "RGB", `${channels}${texts.alpha} ${v.color.a}`))
        }}><Icon icon={expand} /></Button></div>
      </div>}
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  </div>
}

export { ColorPicker, ColorPickerStateProvider, type ColorPickerProps, type ColorPickerTexts }
