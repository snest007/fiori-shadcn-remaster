"use client"

import * as React from "react"

export type FioriText = string | ((...args: any[]) => string) | Partial<Record<Intl.LDMLPluralRule, string>>
/** Tables use the original SAP UI5 i18n keys, so optional SAP packs and application overrides compose. */
export type FioriTexts = Readonly<Record<string, FioriText>>
export type FioriDirection = "ltr" | "rtl"
export type FioriLocaleProviderProps = { locale?: string; dir?: FioriDirection; texts?: FioriTexts; children?: React.ReactNode }

type LocaleContext = { locale?: string; dir?: FioriDirection; texts: FioriTexts }
const Context = React.createContext<LocaleContext | undefined>(undefined)
const EMPTY: FioriTexts = {}

export function localeDirection(locale: string): FioriDirection {
  return /^(ar|he|iw|fa|ur)(-|$)/i.test(locale) ? "rtl" : "ltr"
}

/** Does not mutate document.dir; set the application's direction on its own root. Nested tables inherit. */
export function FioriLocaleProvider({ locale, dir, texts = EMPTY, children }: FioriLocaleProviderProps) {
  const parent = React.useContext(Context)
  const value = React.useMemo(() => ({ locale: locale ?? parent?.locale, dir: dir ?? (locale ? localeDirection(locale) : parent?.dir), texts: { ...parent?.texts, ...texts } }), [parent, locale, dir, texts])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export type FioriTranslator = (key: string, fallback: string, ...args: any[]) => string
export function useFioriLocale(localeProp?: string) {
  const context = React.useContext(Context)
  const locale = localeProp ?? context?.locale ?? (typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US")
  const dir = localeProp ? localeDirection(localeProp) : context?.dir ?? localeDirection(locale)
  const t: FioriTranslator = React.useCallback((key, fallback, ...args) => {
    const entry = context?.texts[key]
    if (typeof entry === "function") return entry(...args)
    let text = typeof entry === "string" ? entry : entry?.[new Intl.PluralRules(locale).select(Number(args[0]))] ?? entry?.other ?? fallback
    // UI5 I18nBundle.getText substitutes {0}, {1}, ... in exactly their original order.
    return text.replace(/\{(\d+)\}/g, (match, index: string) => args[Number(index)] === undefined ? match : String(args[Number(index)]))
  }, [context, locale])
  return { locale, dir, t, localized: localeProp !== undefined || context?.locale !== undefined, hasProvider: context !== undefined }
}

export type FioriTextKeys<T> = { [P in keyof T]?: string | ((t: FioriTranslator, fallback: T[P]) => T[P]) | (T[P] extends object ? FioriTextKeys<T[P]> : never) }
/** Preserves existing props and function signatures. Components explicitly map every native key at its owner. */
export function useFioriTexts<T extends object>(defaults: T, keys: FioriTextKeys<T>, overrides?: Partial<T>): T {
  const { t } = useFioriLocale()
  return React.useMemo(() => {
    function resolve(values: any, mapping: any, explicit: any): any {
      return Object.fromEntries(Object.entries(values).map(([property, fallback]) => {
        const key = mapping[property]
        let value = fallback
        if (typeof key === "string") value = typeof fallback === "function" ? (...args: any[]) => t(key, fallback(...args), ...args) : t(key, String(fallback))
        else if (typeof key === "function") value = key(t, fallback)
        else if (key && fallback && typeof fallback === "object") return [property, resolve(fallback, key, explicit?.[property])]
        return [property, explicit?.[property] ?? value]
      }))
    }
    return resolve(defaults, keys, overrides)
  }, [defaults, keys, overrides, t])
}

/** Locale-aware matching shared by filtering and type-ahead. Comparing substrings retains Intl's accent rules. */
export function collatorIncludes(value: string, query: string, locale: string, startsWith = false): boolean {
  if (!query) return true
  const compare = new Intl.Collator(locale, { usage: "search", sensitivity: "base" }).compare
  const text = Array.from(value), needle = Array.from(query)
  for (let start = 0; start <= text.length - needle.length; start++) {
    if (compare(text.slice(start, start + needle.length).join(""), query) === 0) return true
    if (startsWith) break
  }
  return false
}
