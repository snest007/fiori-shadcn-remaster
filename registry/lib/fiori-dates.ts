// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

// Date and time helpers for the Fiori date/time components (Calendar, DatePicker, DateRangePicker,
// TimePicker, DateTimePicker). No dependencies: everything locale-specific comes from Intl.
//
// Gregorian calendar only. Dates are plain local `Date` objects; a "day" is compared by its
// local year/month/date, never by timestamp, so DST changes can't shift a selection.
//
// Patterns are LDML (the same syntax UI5's `formatPattern` uses): y, yy, M, MM, MMM, MMMM, d, dd,
// E, EEEE, H, HH, h, hh, m, mm, s, ss, a, and 'quoted literals'.

export type DateStyle = "short" | "medium" | "long"

/* ------------------------------------------------------------------ days */

/** Comparable number for a day: 20240312 for 12 Mar 2024. */
export const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()

export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && dayKey(a) === dayKey(b)

/** Local midnight of the same day. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

export function addDays(d: Date, amount: number) {
  const r = startOfDay(d)
  r.setDate(r.getDate() + amount)
  return r
}

/** Clamp a day to [min, max] (either may be missing). */
export function clampDay(d: Date, min?: Date | null, max?: Date | null) {
  if (min && dayKey(d) < dayKey(min)) return startOfDay(min)
  if (max && dayKey(d) > dayKey(max)) return startOfDay(max)
  return d
}

/**
 * UI5's modifyDateBy: add days, months or years. Months keep the day of the month when it exists in the
 * target month and otherwise take its last day (31 Mar - 1 month = 29 Feb). With `preserveDate` false,
 * +1 month goes to the 1st of the next month and -1 month to the last day of the previous one
 * (that's how the day picker's header arrows page). The result is clamped to [min, max].
 */
export function modifyDateBy(
  d: Date,
  amount: number,
  unit: "day" | "month" | "year",
  preserveDate = true,
  min?: Date | null,
  max?: Date | null
) {
  let r = startOfDay(d)
  if (unit === "day") r.setDate(r.getDate() + amount)
  else if (unit === "month") {
    if (preserveDate || Math.abs(amount) !== 1) {
      const target = new Date(r.getFullYear(), r.getMonth() + amount, 1)
      r = new Date(target.getFullYear(), target.getMonth(), Math.min(r.getDate(), daysInMonth(target.getFullYear(), target.getMonth())))
    } else if (amount === 1) r = new Date(r.getFullYear(), r.getMonth() + 1, 1)
    else r = new Date(r.getFullYear(), r.getMonth(), 0)
  } else {
    const y = r.getFullYear() + amount
    r = new Date(y, r.getMonth(), Math.min(r.getDate(), daysInMonth(y, r.getMonth())))
  }
  return clampDay(r, min, max)
}

/* ------------------------------------------------------------- locale data */

export type WeekInfo = {
  /** 0 = Sunday ... 6 = Saturday */
  firstDay: number
  minimalDays: number
  /** Weekend days, 0 = Sunday ... 6 = Saturday */
  weekend: number[]
}

const SUNDAY_FIRST = new Set(["US", "CA", "MX", "BR", "JP", "KR", "TW", "HK", "IL", "PH", "IN", "ZA", "AU", "SA", "PE", "CO", "VE", "GT", "PR", "DO"])
const weekInfoCache = new Map<string, WeekInfo>()

/** First day of the week, minimal days in week 1 and the weekend, from Intl.Locale's week info. */
export function getWeekInfo(locale: string): WeekInfo {
  const cached = weekInfoCache.get(locale)
  if (cached) return cached
  let info: WeekInfo | undefined
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number; minimalDays: number; weekend: number[] }
      weekInfo?: { firstDay: number; minimalDays: number; weekend: number[] }
    }
    const wi = loc.getWeekInfo?.() ?? loc.weekInfo
    // Some engines omit minimalDays: ISO (4) for Monday-first locales, 1 otherwise (the CLDR defaults).
    if (wi) info = { firstDay: wi.firstDay % 7, minimalDays: wi.minimalDays ?? (wi.firstDay === 1 ? 4 : 1), weekend: wi.weekend.map((d) => d % 7) }
  } catch {
    // fall through to the default below
  }
  if (!info) {
    // Older engines without weekInfo: Sunday-first regions vs ISO weeks.
    let region = ""
    try {
      region = new Intl.Locale(locale).maximize().region ?? ""
    } catch {
      region = ""
    }
    info = SUNDAY_FIRST.has(region) ? { firstDay: 0, minimalDays: 1, weekend: [6, 0] } : { firstDay: 1, minimalDays: 4, weekend: [6, 0] }
  }
  weekInfoCache.set(locale, info)
  return info
}

/** Week number of `d` for a week starting on `firstDay` whose first week has at least `minimalDays` days of the year. */
export function weekNumber(d: Date, firstDay: number, minimalDays: number) {
  const weekStart = addDays(d, -((d.getDay() - firstDay + 7) % 7))
  const week1Start = (year: number) => {
    const jan1 = new Date(year, 0, 1)
    const offset = (jan1.getDay() - firstDay + 7) % 7
    return addDays(jan1, 7 - offset >= minimalDays ? -offset : 7 - offset)
  }
  let year = addDays(weekStart, 6).getFullYear()
  let start = week1Start(year)
  if (dayKey(weekStart) < dayKey(start)) start = week1Start(--year)
  return Math.round((weekStart.getTime() - start.getTime()) / 86400000 / 7) + 1
}

const memo = new Map<string, unknown>()
function cached<T>(key: string, make: () => T): T {
  if (!memo.has(key)) memo.set(key, make())
  return memo.get(key) as T
}

/** Month names, January first. `width`: "long" (March), "short" (Mar), "narrow" (M). */
export function getMonthNames(locale: string, width: "long" | "short" | "narrow" = "long", standAlone = true): string[] {
  return cached(`months|${locale}|${width}|${standAlone}`, () => {
    const fmt = new Intl.DateTimeFormat(locale, standAlone ? { month: width } : { month: width, day: "numeric" })
    return Array.from({ length: 12 }, (_, m) => {
      const parts = fmt.formatToParts(new Date(2024, m, 1))
      return parts.find((p) => p.type === "month")?.value ?? String(m + 1)
    })
  })
}

/** Day names, Sunday first. */
export function getDayNames(locale: string, width: "long" | "short" | "narrow" = "long"): string[] {
  return cached(`days|${locale}|${width}`, () => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: width })
    // 7 Jan 2024 is a Sunday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)))
  })
}

/** AM / PM names. */
export function getDayPeriods(locale: string): [string, string] {
  return cached(`periods|${locale}`, () => {
    const fmt = new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true })
    const period = (h: number) => fmt.formatToParts(new Date(2024, 0, 1, h)).find((p) => p.type === "dayPeriod")?.value ?? (h < 12 ? "AM" : "PM")
    return [period(9), period(21)] as [string, string]
  })
}

/** Long date for accessible names, e.g. "March 12, 2024". */
export function formatLongDate(d: Date, locale: string) {
  return cached(`long|${locale}`, () => new Intl.DateTimeFormat(locale, { dateStyle: "long" })).format(d)
}

/** Year as the locale writes it in the calendar header. */
export function formatYear(year: number, locale: string) {
  return cached(`year|${locale}`, () => new Intl.DateTimeFormat(locale, { year: "numeric" })).format(new Date(year, 0, 1))
}

/* ---------------------------------------------------------------- patterns */

const quote = (s: string) => (/[a-zA-Z']/.test(s) ? `'${s.replace(/'/g, "''")}'` : s)

/** Turns Intl parts of a sample date (5 Jan 2024, 03:07:09) into an LDML pattern. */
function partsToPattern(locale: string, parts: Intl.DateTimeFormatPart[]) {
  const hasPeriod = parts.some((p) => p.type === "dayPeriod")
  return parts
    .map(({ type, value }, i) => {
      // CLDR (and so UI5) separates the day period with a narrow no-break space; engines differ
      // (some give a plain space), so normalize to CLDR's.
      if (type === "literal" && /^\s$/.test(value) && (parts[i + 1]?.type === "dayPeriod" || parts[i - 1]?.type === "dayPeriod")) return "\u202f"
      switch (type) {
        case "year":
          return value.length === 2 ? "yy" : "y"
        case "month":
          if (/^\d+$/.test(value)) return value.length === 2 ? "MM" : "M"
          if (value === getMonthNames(locale, "long", false)[0]) return "MMMM"
          return "MMM"
        case "day":
          return value.length === 2 ? "dd" : "d"
        case "weekday":
          return value === getDayNames(locale, "long")[5] ? "EEEE" : "EEE"
        case "hour":
          return (hasPeriod ? "h" : "H").repeat(value.length === 2 ? 2 : 1)
        case "minute":
          return value.length === 2 ? "mm" : "m"
        case "second":
          return value.length === 2 ? "ss" : "s"
        case "dayPeriod":
          return "a"
        case "era":
          return "G"
        default:
          return quote(value)
      }
    })
    .join("")
}

// 5 Jan 2024 03:07:09 tells one- from two-digit fields apart.
const SAMPLE = new Date(2024, 0, 5, 3, 7, 9)

/** The locale's date pattern for a style ("MMM d, y" for en-US medium, like UI5's CLDR data). */
export function getDatePattern(locale: string, style: DateStyle = "medium") {
  return cached(`dp|${locale}|${style}`, () => partsToPattern(locale, new Intl.DateTimeFormat(locale, { dateStyle: style }).formatToParts(SAMPLE)))
}

/** The locale's time pattern for a style ("h:mm:ss a" for en-US medium). */
export function getTimePattern(locale: string, style: DateStyle = "medium") {
  return cached(`tp|${locale}|${style}`, () => partsToPattern(locale, new Intl.DateTimeFormat(locale, { timeStyle: style }).formatToParts(SAMPLE)))
}

/** The locale's combined date + time pattern ("MMM d, y, h:mm:ss a" for en-US medium). */
export function getDateTimePattern(locale: string, style: DateStyle = "medium") {
  return cached(`dtp|${locale}|${style}`, () =>
    partsToPattern(locale, new Intl.DateTimeFormat(locale, { dateStyle: style, timeStyle: style }).formatToParts(SAMPLE))
  )
}

/** Resolves "short" | "medium" | "long" to a pattern; anything else is taken as a pattern already. */
export function resolvePattern(pattern: string | undefined, locale: string, kind: "date" | "time" | "datetime") {
  const style = pattern === "short" || pattern === "medium" || pattern === "long" ? pattern : !pattern ? "medium" : null
  if (!style) return pattern!
  return kind === "date" ? getDatePattern(locale, style) : kind === "time" ? getTimePattern(locale, style) : getDateTimePattern(locale, style)
}

type Token = { field: string; len: number } | { literal: string }

function tokenize(pattern: string): Token[] {
  return cached(`tok|${pattern}`, () => {
    const tokens: Token[] = []
    let i = 0
    const pushLiteral = (s: string) => {
      const last = tokens[tokens.length - 1]
      if (last && "literal" in last) last.literal += s
      else tokens.push({ literal: s })
    }
    while (i < pattern.length) {
      const c = pattern[i]
      if (c === "'") {
        if (pattern[i + 1] === "'") {
          pushLiteral("'")
          i += 2
          continue
        }
        let j = i + 1
        let text = ""
        while (j < pattern.length) {
          if (pattern[j] === "'" && pattern[j + 1] === "'") {
            text += "'"
            j += 2
          } else if (pattern[j] === "'") break
          else text += pattern[j++]
        }
        pushLiteral(text)
        i = j + 1
      } else if (/[a-zA-Z]/.test(c)) {
        let j = i
        while (pattern[j] === c) j++
        tokens.push({ field: c, len: j - i })
        i = j
      } else {
        pushLiteral(c)
        i++
      }
    }
    return tokens
  })
}

/** Which components a pattern contains. */
export function patternFields(pattern: string) {
  const f = new Set(tokenize(pattern).flatMap((t) => ("field" in t ? [t.field] : [])))
  return {
    date: f.has("y") || f.has("M") || f.has("L") || f.has("d"),
    day: f.has("d"),
    month: f.has("M") || f.has("L"),
    hours: f.has("H") || f.has("h") || f.has("K") || f.has("k"),
    minutes: f.has("m"),
    seconds: f.has("s"),
    period: f.has("a"),
    twelveHour: f.has("h") || f.has("K"),
    /** Hours shown without a leading zero ("h" vs "hh"). */
    hoursOneDigit: tokenize(pattern).some((t) => "field" in t && /[hHkK]/.test(t.field) && t.len === 1),
  }
}

const pad = (n: number, len: number) => String(n).padStart(len, "0")

/** Formats a date with an LDML pattern. */
export function formatDate(d: Date, pattern: string, locale = "en-US") {
  return tokenize(pattern)
    .map((t) => {
      if ("literal" in t) return t.literal
      const { field, len } = t
      switch (field) {
        case "G":
          return new Intl.DateTimeFormat(locale, { era: "short" }).formatToParts(d).find((p) => p.type === "era")?.value ?? ""
        case "y":
        case "Y":
          return len === 2 ? pad(d.getFullYear() % 100, 2) : pad(d.getFullYear(), len)
        case "M":
        case "L":
          if (len <= 2) return pad(d.getMonth() + 1, len)
          return getMonthNames(locale, len === 3 ? "short" : len === 4 ? "long" : "narrow", field === "L")[d.getMonth()]
        case "d":
          return pad(d.getDate(), len)
        case "E":
        case "c":
          return getDayNames(locale, len <= 3 ? "short" : len === 4 ? "long" : "narrow")[d.getDay()]
        case "H":
          return pad(d.getHours(), len)
        case "k":
          return pad(d.getHours() || 24, len)
        case "h":
          return pad(d.getHours() % 12 || 12, len)
        case "K":
          return pad(d.getHours() % 12, len)
        case "m":
          return pad(d.getMinutes(), len)
        case "s":
          return pad(d.getSeconds(), len)
        case "a":
          return getDayPeriods(locale)[d.getHours() < 12 ? 0 : 1]
        default:
          return ""
      }
    })
    .join("")
}

const NUMERIC = new Set(["y", "Y", "d", "H", "h", "k", "K", "m", "s"])
const SEPARATORS = /^[\s.,\-/:\u00a0\u202f]*$/

/**
 * Parses `text` with an LDML pattern, leniently like UI5: case-insensitive names (full or abbreviated),
 * one- or two-digit numbers, flexible separators and whitespace, and two-digit years resolved to the
 * window 80 years back / 20 years ahead. Returns null for text that isn't a real date
 * (31 Feb, 25:00 ...). Fields the pattern doesn't contain default to `base` (today, midnight).
 */
export function parseWithPattern(text: string, pattern: string, locale = "en-US", base?: Date): Date | null {
  const tokens = tokenize(pattern)
  const s = text.trim()
  let pos = 0
  const v: { y?: number; y2?: boolean; M?: number; d?: number; H?: number; h?: number; m?: number; s?: number; pm?: boolean } = {}
  const skipSeparators = () => {
    while (pos < s.length && /[\s.,\-/:\u00a0\u202f]/.test(s[pos])) pos++
  }
  const matchName = (names: string[]) => {
    const rest = s.slice(pos).toLowerCase()
    let best = -1
    let bestLen = 0
    names.forEach((n, i) => {
      for (const cand of [n, n.replace(/\.$/, "")]) {
        const c = cand.toLowerCase()
        if (c && rest.startsWith(c) && c.length > bestLen) {
          best = i
          bestLen = c.length
        }
      }
    })
    if (best >= 0) pos += bestLen
    return best
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if ("literal" in t) {
      const lit = t.literal.trim()
      if (SEPARATORS.test(t.literal)) {
        skipSeparators()
        continue
      }
      skipSeparators()
      if (s.slice(pos, pos + lit.length).toLowerCase() === lit.toLowerCase()) pos += lit.length
      else return null
      skipSeparators()
      continue
    }
    const { field, len } = t
    if (NUMERIC.has(field) || ((field === "M" || field === "L") && len <= 2)) {
      // Adjacent numeric fields ("yyyyMMdd") take exactly their length; otherwise read greedily.
      const next = tokens[i + 1]
      const adjacent = next && "field" in next
      const max = adjacent ? len : field === "y" || field === "Y" ? 4 : 2
      const m = s.slice(pos).match(new RegExp(`^\\d{1,${max}}`))
      if (!m) return null
      pos += m[0].length
      const n = Number(m[0])
      if (field === "y" || field === "Y") {
        v.y = n
        v.y2 = m[0].length <= 2
      } else if (field === "M" || field === "L") v.M = n
      else if (field === "d") v.d = n
      else if (field === "H") v.H = n
      else if (field === "k") v.H = n === 24 ? 0 : n
      else if (field === "h") v.h = n
      else if (field === "K") v.h = n
      else if (field === "m") v.m = n
      else if (field === "s") v.s = n
      continue
    }
    if (field === "M" || field === "L") {
      let idx = matchName(getMonthNames(locale, "long", false))
      if (idx < 0) idx = matchName(getMonthNames(locale, "short", false))
      if (idx < 0) idx = matchName(getMonthNames(locale, "long", true))
      if (idx < 0) idx = matchName(getMonthNames(locale, "short", true))
      if (idx < 0) return null
      v.M = idx + 1
      continue
    }
    if (field === "E" || field === "c") {
      if (matchName(getDayNames(locale, "long")) < 0 && matchName(getDayNames(locale, "short")) < 0) return null
      continue
    }
    if (field === "a") {
      skipSeparators()
      const [am, pm] = getDayPeriods(locale)
      const idx = matchName([am, pm, am[0], pm[0]])
      if (idx < 0) return null
      v.pm = idx % 2 === 1
      continue
    }
    if (field === "G") {
      const m = s.slice(pos).match(/^[A-Za-z.]+/)
      if (m) pos += m[0].length
      continue
    }
    return null
  }
  skipSeparators()
  if (pos !== s.length) return null

  const ref = base ?? startOfDay(new Date())
  let year = v.y ?? ref.getFullYear()
  if (v.y !== undefined && v.y2) {
    // Two-digit year: within 80 years before and 20 after the current year (CLDR / UI5).
    const now = new Date().getFullYear()
    year = Math.floor(now / 100) * 100 + v.y
    if (year > now + 20) year -= 100
    else if (year <= now - 80) year += 100
  }
  const month = (v.M ?? ref.getMonth() + 1) - 1
  const day = v.d ?? ref.getDate()
  let hours = v.H ?? ref.getHours()
  if (v.h !== undefined) {
    if (v.h > 12 || (v.h === 0 && tokens.some((t) => "field" in t && t.field === "h"))) return null
    hours = (v.h % 12) + (v.pm ? 12 : 0)
  } else if (v.H !== undefined && v.H > 23) return null
  const minutes = v.m ?? (v.H !== undefined || v.h !== undefined ? 0 : ref.getMinutes())
  const seconds = v.s ?? (v.H !== undefined || v.h !== undefined ? 0 : ref.getSeconds())
  if (month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month) || minutes > 59 || seconds > 59) return null
  const d = new Date(year, month, day, hours, minutes, seconds)
  d.setFullYear(year) // years < 100
  return d
}

/**
 * Parses with the given pattern, then falls back to the locale's short / medium / long styles and ISO
 * (yyyy-MM-dd), as UI5's DateFormat does for typed input.
 */
export function parseDate(text: string, pattern: string, locale = "en-US", kind: "date" | "time" | "datetime" = "date"): Date | null {
  if (!text.trim()) return null
  const today = startOfDay(new Date())
  const candidates =
    kind === "date"
      ? [pattern, getDatePattern(locale, "short"), getDatePattern(locale, "medium"), getDatePattern(locale, "long"), "yyyy-MM-dd"]
      : kind === "time"
        ? [pattern, getTimePattern(locale, "medium"), getTimePattern(locale, "short"), "H:mm:ss", "H:mm"]
        : [
            pattern,
            getDateTimePattern(locale, "short"),
            getDateTimePattern(locale, "medium"),
            getDateTimePattern(locale, "long"),
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss",
          ]
  for (const p of new Set(candidates)) {
    const d = parseWithPattern(text, p, locale, kind === "time" ? today : today)
    if (d) return d
  }
  return null
}
