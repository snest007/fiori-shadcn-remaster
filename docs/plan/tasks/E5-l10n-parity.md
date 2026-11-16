# E5 — Localization parity: locale provider, UI5 texts audit, number formats, language packs

**Goal:** make "localization is ported in full" (AGENTS.md rule 10) real and checkable: one place to set locale and
translations, every UI5 i18n text present and overridable, numbers formatted and parsed per locale like UI5, SAP's
own translations installable as optional language packs, and tests that compare localized fixtures with UI5. Requested
by the owner: localization must be preserved completely. Run before wave H; can run in parallel with wave S and E4
(different files, except the per-component gap fixes — coordinate by component, see "Files").

## 1. `FioriLocaleProvider` — `registry/lib/fiori-locale.tsx` (new, `registry:lib` item `locale`)

- `<FioriLocaleProvider locale="de-DE" texts={deTexts}>`: React context with the locale (BCP 47) and a text table
  keyed by **UI5 i18n key** (`{ STEPINPUT_DEC_ICON_TITLE: "Verringern", … }`).
- `useFioriLocale()` returns `{ locale, dir, t(key, fallback, ...args) }`. Resolution order for every text:
  component prop (`texts.x` / `labels.x`) → provider table (by UI5 key) → the component's English default. Locale:
  component `locale` prop → provider → `navigator.language` → `"en-US"`.
- `dir` derives from the locale (`ar`, `he`/`iw`, `fa`, `ur` → `rtl`) unless the provider gets `dir` explicitly; the
  provider does **not** set `dir` on the document (the app owns that) but exposes it for components that need it.
- Without a provider every component behaves exactly as today (no breaking change, rule 7).
- Wire every component that has texts or formats: replace its local defaults lookup with `t(KEY, default)`; existing
  props keep working and keep winning.

## 2. UI5 text audit — `scripts/i18n-audit.mjs` (new) → `docs/plan/i18n-audit.md` (new, committed)

For every component we ship, list the i18n keys its UI5 counterpart uses (scan `dist/<Name>.js` and
`dist/<Name>Template.js` for imported keys from `generated/i18n/i18n-defaults.js`; include keys of UI5 sub-components
it renders, e.g. a picker's Calendar / ResponsivePopover). For SAPUI5-referenced components (VariantManagement, MDC
FilterBar, Adapt Filters, ValueHelpDialog) use the OpenUI5 1.154 `messagebundle.properties` of the library instead.
One row each: UI5 key → English text → our `texts`/`labels` property → status (`ok` / `fixed in E5` / `gap`).

Then **close every gap**: add the text property with its English default from UI5's `messagebundle_en.json` and the
key comment (rule 10), use it where UI5 uses it (visible text, tooltip, `aria-label`, announcement), and a test that
overriding it changes the rendered/announced string.

## 3. Numbers — `registry/lib/fiori-numbers.ts` (new, part of the `locale` lib item)

- `formatNumber(value, locale, { minFractionDigits, maxFractionDigits, style?, unit? })`,
  `parseNumber(text, locale)` (accepts the locale's decimal and grouping separators, rejects ambiguous input the way
  UI5's `NumberFormat.parse` does), `formatPercent`, `formatUnit` — on `Intl.NumberFormat` only.
- Port and test against UI5's behaviour in the components that format numbers: StepInput (`valuePrecision`, display
  and typed input), Slider / RangeSlider (tooltip, tick labels, the input in the editable tooltip), ProgressIndicator
  (`displayValue`), RatingIndicator (accessible value text), ObjectNumber (optional `number` as `number` + `locale`
  → formatted; keep `ReactNode` support), DataTable/Table aggregates where present. Where UI5 itself uses `toFixed`
  (check `dist/StepInput.js`, `SliderBase.js`), match UI5 for the default and add the locale-aware behaviour behind
  the provider/`locale` prop, so pixel fixtures without a locale stay identical.
- Sorting and filtering text (DataTable sorting, ComboBox/MultiComboBox/Select type-ahead and filtering, ValueHelp
  search, Tree/List search where present): `Intl.Collator(locale, { sensitivity: "base" })` instead of
  `localeCompare()` without a locale or `toLowerCase()` comparisons. Plural texts via `Intl.PluralRules` where UI5 has
  separate keys (e.g. "1 item" / "{0} items").

## 4. Language packs — `scripts/build-i18n-packs.mjs` (new) → `registry/i18n/<lang>.json` (generated, committed)

- From `node_modules/@ui5/webcomponents*/dist/generated/assets/i18n/messagebundle_<lang>.json` (51 languages, Apache-2.0)
  build one text table per language containing **only the keys our components use** (from the audit). Map UI5 language
  codes to BCP 47 (`iw` → `he`, `zh_CN` → `zh-CN`, `sh` → `sr-Latn`, …); skip pseudo-locales (`en_US_sappsd`,
  `en_US_saprigi`, `en_US_saptrc`).
- Register each as a `registry:lib` item `i18n-<bcp47>` (e.g. `npx shadcn add @fiori/i18n-de`, `@fiori/i18n-zh-CN`)
  that installs `lib/fiori-i18n/<bcp47>.ts` exporting the table, with `registryDependencies: ["locale"]`. Add an
  `i18n` docs page listing the packs with the install line and a usage snippet.
- `NOTICE` / README: translations come from UI5 Web Components (© SAP SE, Apache-2.0) at the pinned version.
- Deterministic output (sorted keys, no timestamps); `registry:build` regenerates them.

## 5. Tests

- `tests/i18n.spec.ts` (new):
  - Provider: a fixture page wrapped in `FioriLocaleProvider locale="de-DE" texts={de}` shows German texts in
    StepInput tooltips, Calendar header buttons, Select/ComboBox "No data", Table "No data", Dialog close button,
    MessageStrip close, Tokenizer "n more"; a component `texts` prop still wins over the provider.
  - Numbers: StepInput in `de-DE` shows `1,5`, accepts typing `2,25`, and emits `2.25`; Slider tooltip `0,5`;
    ProgressIndicator `50 %` as `Intl` formats it; `fr-FR` grouping (narrow no-break space).
  - Collation: Select/ComboBox type-ahead and DataTable sorting in `de-DE` order `Ä` with `A`, and in `sv-SE` after `Z`.
  - Plurals: one key with singular/plural text renders correctly for 1 and 2 in `en`, `ru` (few/many) and `ar`.
  - Packs: `node scripts/build-i18n-packs.mjs` twice yields no diff; every key in each pack is a key the audit lists.
- **UI5 comparison** — add localized fixtures, rendered on both pages with the same locale (UI5 side:
  `setLanguage("<lang>")` from `@ui5/webcomponents-base/dist/config/Language.js` and
  `@ui5/webcomponents-localization/dist/Assets.js`): Calendar, DatePicker (open), DateTimePicker (open), TimePicker,
  StepInput, Slider in `de-DE`, `zh-CN` and `ar-EG` (RTL). Pixel diff (rule 4) and, once E4 lands, the accessibility
  tree compare them. Fixture ids `<component>-l10n-<locale>`.
- RTL: every component that lacks an RTL fixture today gets one; `tests/visual.spec.ts`'s RTL pass covers them.

## 6. Storybook (only if wave S's S0 is merged when you start; otherwise S5 does it)

Add a **Locale** toolbar menu to `.storybook/preview.tsx` (English plus `de`, `fr`, `ja`, `zh-CN`, `ar` — `ar` also
switches Direction to RTL) whose decorator wraps every story in `FioriLocaleProvider` with the matching generated
pack. Extend `tests-storybook/storybook.spec.ts`: the StepInput and Calendar stories show German texts and `1,5` under
`globals=locale:de`.

## Files

Shared (allowed): `registry/lib/fiori-locale.tsx`, `registry/lib/fiori-numbers.ts` (new), `registry/items/locale.json`
(new), `registry/i18n/**` (new, generated), `scripts/i18n-audit.mjs`, `scripts/build-i18n-packs.mjs` (new),
`scripts/build-registry-json.mjs` (register packs), `docs/plan/i18n-audit.md` (new), `tests/i18n.spec.ts` (new),
`docs/src/main.tsx` (the `i18n` docs page only), `docs/src/ui5-main.ts` (locale option only), `docs/src/fixture-types.ts`
(`locale` page option only), `package.json` (scripts only; add `@ui5/webcomponents-localization` as an exact
devDependency only if it isn't resolvable already — it is a dependency of `@ui5/webcomponents`), `README.md`, `NOTICE`,
`AGENTS.md` (only to adjust rule 10's wording to what was built), `.storybook/preview.tsx` and
`tests-storybook/storybook.spec.ts` (section 6 only), and for wiring and gap fixes each affected
component's own files (rule 3). Commit per component (`E5: <component> — <change>`). If E4 is in flight, don't edit the
same component in both branches at the same time: finish one component, commit, then the next, and list them.

## Acceptance

- AGENTS.md definition of done; existing fixtures unchanged (no pixel diff without a locale).
- `docs/plan/i18n-audit.md` has no `gap` rows; every component with texts reads from the provider.
- `npx shadcn add @fiori/i18n-de` works in `node scripts/smoke-install.mjs` (add one pack to the smoke app and render a
  German StepInput).
- Localized fixtures match UI5 in `de-DE`, `zh-CN`, `ar-EG`.
- Final message: number of keys audited / added, packs generated, the components wired to the provider, number-format
  changes per component, and screenshots of the German and Arabic Calendar + StepInput fixtures next to UI5's.
