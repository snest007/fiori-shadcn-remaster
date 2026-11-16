export type NumberOptions = { minFractionDigits?: number; maxFractionDigits?: number; style?: Intl.NumberFormatOptions["style"]; unit?: string; useGrouping?: boolean }

export function formatNumber(value: number, locale: string, { minFractionDigits, maxFractionDigits, ...options }: NumberOptions = {}) {
  return new Intl.NumberFormat(locale, { ...options, minimumFractionDigits: minFractionDigits, maximumFractionDigits: maxFractionDigits }).format(value)
}
export function formatPercent(value: number, locale: string, options: Omit<NumberOptions, "style" | "unit"> = {}) {
  return formatNumber(value, locale, { ...options, style: "percent" })
}
export function formatUnit(value: number, locale: string, unit: string, options: Omit<NumberOptions, "style" | "unit"> = {}) {
  return formatNumber(value, locale, { ...options, style: "unit", unit })
}
export function numberSymbols(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6)
  return { decimal: parts.find(p => p.type === "decimal")?.value ?? ".", group: parts.find(p => p.type === "group")?.value ?? ",", minus: parts.find(p => p.type === "minusSign")?.value ?? "-" }
}

/** OpenUI5 NumberFormat.parse/_checkGrouping: accept locale grouping, decimal and exponent, reject foreign/malformed separators. */
export function parseNumber(text: string, locale: string): number {
  const { decimal, group, minus } = numberSymbols(locale)
  let normalized = text.trim().replace(/[\u061c\u200e\u200f]/g, "").replaceAll(minus, "-").replace(/\u2212/g, "-")
  const digits = new Intl.NumberFormat(locale, { useGrouping: false })
  for (let i = 0; i < 10; i++) normalized = normalized.replaceAll(digits.format(i), String(i))
  // FormatUtils.normalize maps Unicode spacing variants before NumberFormat's separator check.
  if (/\s/u.test(group)) normalized = normalized.replace(/[\u00a0\u202f ]/g, group)
  const pieces = normalized.split(decimal)
  if (pieces.length > 2 || pieces[1]?.includes(group)) return NaN
  if (pieces[0].includes(group)) {
    const integer = pieces[0].replace(/^[+-]/, "").replace(/^0+(\d)/, "$1").replace(/[eE].*/, "")
    const actual = integer.split(group)
    const sample = new Intl.NumberFormat(locale).formatToParts(1234567890123).filter(p => p.type === "integer").map(p => Array.from(p.value).length)
    const primary = sample.at(-1) ?? 3
    // NumberFormat._checkGrouping always rejects leading zero/grouping and a single ambiguous
    // separator without a decimal; full grouping-position validation is opt-in in SAP's parser.
    if (integer.startsWith("0") || !actual[0] || (actual.length === 2 && pieces.length === 1 && actual[1].length !== primary)) return NaN
  }
  normalized = normalized.replaceAll(group, "").replace(decimal, ".")
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return NaN
  const result = Number(normalized)
  return Number.isFinite(result) ? result : NaN
}
