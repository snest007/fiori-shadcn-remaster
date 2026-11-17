// Consumer-side adapter: date ↔ fiscal period, using only the variant's period table.
// Nothing here knows about Calendar; Calendar knows nothing about fiscal periods.
import type { FiscalVariant, PeriodRow } from "./fiscal-variants"

export type FiscalPeriod = {
  variant: string
  fiscalYear: number
  /** 1…regularPeriods, or regularPeriods+1… for special periods. */
  period: number
  special: boolean
  start: Date
  end: Date
}

/** "2025-02-24" → local midnight (Calendar works on local dates). */
export function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function toIsoDay(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const key = (d: Date) => toIsoDay(d)

function fromRow(variant: FiscalVariant, row: PeriodRow, period = row[1]): FiscalPeriod {
  return {
    variant: variant.id,
    fiscalYear: row[0],
    period,
    special: period > variant.regularPeriods,
    start: parseDay(row[2]),
    end: parseDay(row[3]),
  }
}

/** First and last day the variant's table covers. */
export function coverage(variant: FiscalVariant) {
  return { min: parseDay(variant.rows[0][2]), max: parseDay(variant.rows[variant.rows.length - 1][3]) }
}

/** The regular period a posting date falls into (special periods are never derived from a date). */
export function periodOf(variant: FiscalVariant, date: Date): FiscalPeriod | null {
  const k = key(date)
  const row = variant.rows.find((r) => r[2] <= k && k <= r[3])
  return row ? fromRow(variant, row) : null
}

/**
 * A period by number. Special periods (13…16) carry the date range of the last regular period of the
 * same fiscal year: in FI-GL they subdivide it, they don't add days.
 */
export function periodByNumber(variant: FiscalVariant, fiscalYear: number, period: number): FiscalPeriod | null {
  const max = variant.regularPeriods + variant.specialPeriods
  if (period < 1 || period > max) return null
  const regular = Math.min(period, variant.regularPeriods)
  const row = variant.rows.find((r) => r[0] === fiscalYear && r[1] === regular)
  return row ? fromRow(variant, row, period) : null
}

/** Next / previous regular period; a special period steps from the last regular period. */
export function shiftPeriod(variant: FiscalVariant, from: FiscalPeriod, delta: number): FiscalPeriod | null {
  const regular = Math.min(from.period, variant.regularPeriods)
  const i = variant.rows.findIndex((r) => r[0] === from.fiscalYear && r[1] === regular)
  const row = variant.rows[i + delta]
  return i >= 0 && row ? fromRow(variant, row) : null
}

/** Is this day the first day of a regular period? */
export function isPeriodStart(variant: FiscalVariant, date: Date) {
  const k = key(date)
  return variant.rows.some((r) => r[2] === k)
}

/** 1-based fiscal week of a week-based variant (counted from the fiscal year's first day), else null. */
export function fiscalWeek(variant: FiscalVariant, date: Date): number | null {
  if (!variant.weekBased) return null
  const p = periodOf(variant, date)
  if (!p) return null
  const first = variant.rows.find((r) => r[0] === p.fiscalYear && r[1] === 1)!
  const days = Math.round((date.getTime() - parseDay(first[2]).getTime()) / 86_400_000)
  return Math.floor(days / 7) + 1
}

/** Days of every period start in [from, to] — used to mark period boundaries. */
export function periodStartsBetween(variant: FiscalVariant, from: Date, to: Date) {
  const [a, b] = [key(from), key(to)]
  return variant.rows.filter((r) => r[2] >= a && r[2] <= b).map((r) => fromRow(variant, r))
}
