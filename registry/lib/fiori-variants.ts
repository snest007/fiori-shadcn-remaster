import * as React from "react"

import type { FilterBarState } from "@/components/ui/filter-bar"
import type { VariantItem, VariantManageEvent, VariantSaveEvent } from "@/components/ui/variant-management"

const STANDARD_VARIANT_KEY = "standard"
type Variant = VariantItem & { state: FilterBarState; default?: boolean }
type VariantStorage = { load: () => Promise<Variant[]>; save: (variants: Variant[]) => Promise<void> }
type VariantStateOptions = {
  /** Initial data is read once. Include key "standard" to supply its state and translated title. */
  initialVariants: Variant[]
  /** Commands are available after ready becomes true; prevent edits while an adapter is loading. */
  storage?: VariantStorage
  /** Manual-mode selection callback: runs after state renders, including the initial default.
   * A live-mode FilterBar already searches changed conditions; coordinate that path before also using this callback. */
  onExecute?: (state: FilterBarState) => void
}

const clone = <T,>(value: T): T => structuredClone(value)
const emptyState = (): FilterBarState => ({ values: {}, visibleKeys: [], search: "" })
function validVariant(value: unknown): value is Variant {
  if (!value || typeof value !== "object") return false
  const item = value as Variant
  return typeof item.key === "string" && !!item.key && typeof item.title === "string" && !!item.title.trim()
    && !!item.state && typeof item.state.search === "string" && Array.isArray(item.state.visibleKeys)
    && item.state.visibleKeys.every((key) => typeof key === "string")
    && !!item.state.values && typeof item.state.values === "object" && !Array.isArray(item.state.values)
    && Object.values(item.state.values).every((conditions) => Array.isArray(conditions) && conditions.every((condition) =>
      !!condition && typeof condition.operator === "string" && Array.isArray(condition.values)))
}
function normalizeVariants(items: Variant[], standard: Variant): Variant[] {
  const unique = items.filter((item, index) => validVariant(item) && items.findIndex((entry) => entry.key === item.key) === index)
  const storedStandard = unique.find((item) => item.key === STANDARD_VARIANT_KEY)
  // VariantModel.js#ensureStandardVariantExists: Standard always exists and is authored by SAP.
  // Its application baseline/title are immutable; only default/execute options can be personalized.
  const variants = [
    // VariantModel.js maps layer → sharing (USER = Private, otherwise Public); Standard is BASE layer → Public.
    { ...clone(standard), key: STANDARD_VARIANT_KEY, author: "SAP", sharing: "Public" as const, rename: false, remove: false, changeable: false,
      favorite: true, visible: true, default: storedStandard?.default ?? standard.default,
      executeOnSelect: storedStandard?.executeOnSelect ?? standard.executeOnSelect },
    ...clone(unique.filter((item) => item.key !== STANDARD_VARIANT_KEY)),
  ]
  const defaultKey = unique.find((item) => item.default && item.visible !== false)?.key ?? STANDARD_VARIANT_KEY
  return variants.map((item) => ({ ...item, default: item.key === defaultKey,
    favorite: item.key === defaultKey ? true : item.favorite }))
}
function stateSignature(state: FilterBarState): string {
  // FilterBarBase.getCurrentState externalizes conditions and ordered items. Empty conditions
  // are equivalent to absent properties; object insertion order is not a personalization change.
  const values = Object.fromEntries(Object.entries(state.values).filter(([, conditions]) => conditions.length))
  return JSON.stringify({ ...state, values }, (_, value) => value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))) : value)
}
function localStorageAdapter(key: string): VariantStorage {
  return {
    async load() {
      const raw = globalThis.localStorage.getItem(key)
      if (!raw) return []
      const value: unknown = JSON.parse(raw)
      if (!Array.isArray(value) || !value.every(validVariant)) throw new Error("Invalid stored views.")
      return value
    },
    async save(variants) { globalThis.localStorage.setItem(key, JSON.stringify(variants)) },
  }
}

function useVariantState({ initialVariants, storage, onExecute }: VariantStateOptions) {
  const [initial] = React.useState(() => {
    const standard = clone(initialVariants.find((item) => item.key === STANDARD_VARIANT_KEY) ?? {
      key: STANDARD_VARIANT_KEY, title: "Standard", state: emptyState(),
    })
    return { standard, variants: normalizeVariants(initialVariants, standard), storage }
  })
  const [model, setModel] = React.useState(() => {
    const selected = initial.variants.find((item) => item.default)!
    return { variants: initial.variants, selectedKey: selected.key, state: clone(selected.state), selection: 0, persistence: 0 }
  })
  const [ready, setReady] = React.useState(!initial.storage)
  const readyRef = React.useRef(ready)
  readyRef.current = ready
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<unknown>()
  const onExecuteRef = React.useRef(onExecute)
  onExecuteRef.current = onExecute
  const executed = React.useRef(-1)
  const writes = React.useRef(Promise.resolve())
  const persisted = React.useRef(0)
  React.useEffect(() => {
    if (!initial.storage) return
    let active = true
    Promise.resolve().then(() => initial.storage!.load()).then((loaded) => {
      if (!active) return
      const variants = normalizeVariants(loaded.length ? loaded : initial.variants, initial.standard)
      const selected = variants.find((item) => item.default)!
      setModel({ variants, selectedKey: selected.key, state: clone(selected.state), selection: 0, persistence: 0 })
      setReady(true)
    }).catch((reason: unknown) => { if (active) { setError(reason); setReady(true) } })
    return () => { active = false }
  }, [initial])
  const selectedVariant = model.variants.find((item) => item.key === model.selectedKey)!
  React.useEffect(() => {
    if (!ready || executed.current === model.selection) return
    executed.current = model.selection
    // FilterBarBase._handleVariantSwitch/_reportModelChange: await state application, then search once.
    if (selectedVariant.executeOnSelect) onExecuteRef.current?.(clone(model.state))
  }, [ready, model.selection, model.state, selectedVariant.executeOnSelect])
  React.useEffect(() => {
    if (!initial.storage || model.persistence === persisted.current) return
    persisted.current = model.persistence
    const snapshot = clone(model.variants)
    setSaving(true)
    const write = writes.current.then(() => initial.storage!.save(snapshot))
    writes.current = write.catch(() => {})
    write.then(() => { if (writes.current === pending) { setError(undefined); setSaving(false) } })
      .catch((reason: unknown) => { if (writes.current === pending) { setError(reason); setSaving(false) } })
    const pending = writes.current
  }, [initial, model.persistence, model.variants])

  const setState = React.useCallback((state: FilterBarState) => {
    if (!readyRef.current) return
    setModel((current) => ({ ...current, state: clone(state) }))
  }, [])
  const selectVariant = React.useCallback((key: string) => {
    if (!readyRef.current) return
    setModel((current) => {
      const selected = current.variants.find((item) => item.key === key && item.visible !== false)
      return selected ? { ...current, selectedKey: key, state: clone(selected.state), selection: current.selection + 1 } : current
    })
  }, [])
  const saveVariant = React.useCallback((event: VariantSaveEvent) => {
    if (!readyRef.current) return
    // Generate the key outside a React updater, which may be replayed in StrictMode.
    const key = event.overwrite ? event.key : globalThis.crypto.randomUUID()
    setModel((current) => {
      const selected = current.variants.find((item) => item.key === current.selectedKey)!
      if (event.overwrite) {
        if (key !== selected.key || !selected.changeable || selected.key === STANDARD_VARIANT_KEY) return current
        // VariantManager.handleSaveEvent: overwrite saves state and retains view options.
        return { ...current, variants: current.variants.map((item) => item.key === key ? { ...item, state: clone(current.state) } : item), persistence: current.persistence + 1 }
      }
      if (!key || !event.name.trim() || current.variants.some((item) => item.title === event.name.trim())) return current
      const created: Variant = { key, title: event.name.trim(), state: clone(current.state), rename: true, remove: true,
        changeable: true, favorite: true, sharing: event.public ? "Public" : "Private", contexts: clone(event.contexts ?? {}),
        executeOnSelect: event.execute ?? false, default: event.def }
      const variants = [...current.variants.map((item) => ({ ...item, default: event.def ? false : item.default })), created]
      return { ...current, variants, selectedKey: key, selection: current.selection + 1, persistence: current.persistence + 1 }
    })
  }, [])
  const manageVariants = React.useCallback((event: VariantManageEvent) => {
    if (!readyRef.current) return
    setModel((current) => {
      const edited = current.variants.filter((item) => item.key === STANDARD_VARIANT_KEY || !item.remove || !event.deleted?.includes(item.key)).map((item) => ({
        ...item,
        title: item.key !== STANDARD_VARIANT_KEY && item.rename !== false ? event.renamed?.find((change) => change.key === item.key)?.name ?? item.title : item.title,
        favorite: item.key === STANDARD_VARIANT_KEY ? true : event.fav?.find((change) => change.key === item.key)?.visible ?? item.favorite,
        executeOnSelect: event.exe?.find((change) => change.key === item.key)?.exe ?? item.executeOnSelect,
        contexts: item.key === STANDARD_VARIANT_KEY ? item.contexts : event.contexts?.find((change) => change.key === item.key)?.contexts ?? item.contexts,
        default: event.def !== undefined ? item.key === event.def : item.default,
      }))
      const variants = normalizeVariants(edited, initial.standard)
      const selected = variants.find((item) => item.key === current.selectedKey)
      if (selected) return { ...current, variants, persistence: current.persistence + 1 }
      // VariantManager.js#switchToDefaultIfCurrentVariantIsDeleted uses the new default from Manage.
      const fallback = variants.find((item) => item.default)!
      return { ...current, variants, selectedKey: fallback.key, state: clone(fallback.state), selection: current.selection + 1, persistence: current.persistence + 1 }
    })
  }, [initial])
  return {
    variants: model.variants, standardVariant: model.variants[0], selectedVariant,
    defaultKey: model.variants.find((item) => item.default)!.key, selectedKey: model.selectedKey,
    state: model.state, savedState: selectedVariant.state,
    modified: stateSignature(model.state) !== stateSignature(selectedVariant.state),
    setState, selectVariant, saveVariant, manageVariants, ready, saving, error,
  }
}

export { useVariantState, localStorageAdapter, STANDARD_VARIANT_KEY, type Variant, type VariantStorage, type VariantStateOptions }
