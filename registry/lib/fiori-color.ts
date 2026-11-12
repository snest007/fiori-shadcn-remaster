export type FioriColor = { r: number; g: number; b: number; a: number }
export type FioriHslColor = { h: number; s: number; l: number }

/** UI5 base ColorConversion.js RGBToHSL rounds all three channels to integers. */
export function rgbToHsl({ r, g, b }: Pick<FioriColor, "r" | "g" | "b">): FioriHslColor {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B), delta = max - min
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    s = l > .5 ? delta / (2 - max - min) : delta / (max + min)
    h = max === R ? (G - B) / delta + (G < B ? 6 : 0) : max === G ? (B - R) / delta + 2 : (R - G) / delta + 4
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** UI5 base ColorConversion.js HSLToRGB, with the same sector calculation and rounding. */
export function hslToRgb({ h, s, l }: FioriHslColor): Pick<FioriColor, "r" | "g" | "b"> {
  const saturation = Math.min(100, Math.max(0, s)) / 100, lightness = Math.min(100, Math.max(0, l)) / 100
  const hue = ((h % 360) + 360) % 360
  const d = saturation * (1 - Math.abs(2 * lightness - 1)), m = 255 * (lightness - .5 * d)
  const x = d * (1 - Math.abs((hue / 60) % 2 - 1))
  const sectors = [[d, x, 0], [x, d, 0], [0, d, x], [0, x, d], [x, 0, d], [d, 0, x]]
  const [r, g, b] = sectors[Math.floor(hue / 60)]
  return { r: Math.round(m + 255 * r), g: Math.round(m + 255 * g), b: Math.round(m + 255 * b) }
}

export const rgbToHex = ({ r, g, b }: Pick<FioriColor, "r" | "g" | "b">) => [r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")
export const colorToRgba = ({ r, g, b, a }: FioriColor) => `rgba(${r}, ${g}, ${b}, ${a})`

/** ColorPalette.js _setColor/_addRecentColor compare the original CSS strings, not RGB values. */
export function updateRecentColors(recent: readonly string[], color: string, enabled = true): string[] {
  if (!color || (!enabled && !recent.includes(color))) return [...recent]
  return [color, ...recent.filter((item) => item !== color)].slice(0, 5)
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

/** Pure numeric CSS parsing; browser CSS resolves names and other supported CSS color forms. */
export function parseCssColor(value: string): FioriColor | null {
  const color = value.trim().toLowerCase()
  if (color === "transparent") return { r: 0, g: 0, b: 0, a: 0 }
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.exec(color)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex
    return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16), a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1 }
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(color)
  if (rgb) {
    const parts = rgb[1].split(/[\s,\/]+/).filter(Boolean)
    if (parts.length < 3 || parts.length > 4 || parts.some((p) => !/^[+-]?(?:\d*\.)?\d+%?$/.test(p))) return null
    const channel = (part: string) => Math.round(clamp(part.endsWith("%") ? parseFloat(part) / 100 * 255 : parseFloat(part), 255))
    const alpha = parts[3] ?? "1"
    return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a: clamp(parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1), 1) }
  }
  if (typeof document !== "undefined") {
    const context = document.createElement("canvas").getContext("2d")
    if (context && CSS.supports("color", color)) {
      context.fillStyle = color
      const resolved = context.fillStyle
      if (resolved !== color) return parseCssColor(resolved)
    }
  }
  return null
}

/** Normalization is an optional utility for ColorPicker; palettes preserve caller strings. */
export function normalizeCssColor(value: string): string | null {
  const color = parseCssColor(value)
  return color ? `rgba(${color.r},${color.g},${color.b},${color.a})` : null
}

/** Relative luminance contrast for a custom marker. Native palette markers use SAP theme borders. */
export function colorContrast(color: FioriColor, foreground: FioriColor): number {
  const luminance = (c: FioriColor) => [c.r, c.g, c.b].map((v) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
  const a = luminance(color), b = luminance(foreground)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
