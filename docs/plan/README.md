# Backlog (Phase 4: completeness and hardening)

Phases 0–3 are done (73 components, 7 blocks, 600 pixel-compared fixtures, 391 tests). This backlog closes the gaps
listed in README "Not done yet". Each task is a self-contained card in `tasks/`. Read `/AGENTS.md` first.

## How to run a card (for Codex)

```bash
git switch main && git switch -c codex/<card-id>
pnpm install --frozen-lockfile && pnpm generate
# … implement the card …
pnpm typecheck && pnpm registry:build
PORT=4310 pnpm exec playwright test   # twice; 0 failed, 0 flaky
git add -A && git commit -m "<card-id>: <summary>"
```

Suggested prompt: `Read AGENTS.md, then implement docs/plan/tasks/<card-id>.md. Follow its acceptance checks exactly.`

One card per branch. Cards in the same wave touch disjoint files and can run in parallel (separate worktrees/branches);
later waves depend on earlier ones.

**Easiest: one Codex session runs everything** with sub-agents (a worker per card, a fresh reviewer per card, then
integration) — [RUN.md](RUN.md): `Read AGENTS.md and docs/plan/RUN.md, then run cards F3.`

Or by hand: merging in a separate session with [INTEGRATION.md](INTEGRATION.md):
`Read AGENTS.md and docs/plan/INTEGRATION.md, then integrate the pending codex/* branches.`
It reviews scope and fidelity, merges, runs `node scripts/integrate.mjs verify` (3 full runs + smoke install),
cleans up and prints `.integration/REPORT.md` — paste that report to the owner/Claude for sign-off.

Sizes: S ≈ <300 changed lines, M ≈ 300–900, L ≈ 900+.

## Wave A — overflow ("More") behaviour (independent)

- [x] [A1 Tabs overflow](tasks/A1-tabs-overflow.md) — M
- [x] [A2 Toolbar overflow](tasks/A2-toolbar-overflow.md) — M
- [x] [A3 Breadcrumbs overflow](tasks/A3-breadcrumbs-overflow.md) — S
- [x] [A4 AvatarGroup overflow "+N"](tasks/A4-avatar-group-overflow.md) — S
- [x] [A5 SideNavigation overflow item](tasks/A5-side-navigation-overflow.md) — M

## Wave B — feature gaps in existing components (independent)

- [x] [B1 Dialog draggable / resizable](tasks/B1-dialog-drag-resize.md) — M
- [x] [B2 Menu checkable items and groups](tasks/B2-menu-check-mode.md) — S
- [x] [B3 ComboBox / MultiComboBox item groups](tasks/B3-combobox-groups.md) — M
- [x] [B4 Table and List drag & drop reordering](tasks/B4-drag-and-drop.md) — L
- [x] [B5 NotificationList growing](tasks/B5-notification-growing.md) — S

## Wave C — new components

- [x] [C1 ColorPalette + ColorPalettePopover](tasks/C1-color-palette.md) — M
- [x] [C2 ColorPicker](tasks/C2-color-picker.md) — M (after C1: shares the color utilities)
- [x] [C3 MediaGallery](tasks/C3-media-gallery.md) — M

## Wave D — platform behaviour (after waves A–C are merged; touches many components)

- [x] [D1 Phone layouts for popups](tasks/D1-phone-popups.md) — L
  - [x] D1a ResponsivePopover, phone detection, Select, ComboBox, MultiComboBox and MultiInput
  - [x] D1b Pickers, ValueHelpDialog, Menu and Search
- [x] [D2 F6 fast navigation](tasks/D2-f6-navigation.md) — M
- [x] [D3 RTL verification](tasks/D3-rtl.md) — M

## Wave F — FilterBar personalization from SAPUI5 (decided by the owner: full SAPUI5 feature set)

These controls don't exist in UI5 Web Components; the reference is **OpenUI5 1.154** (`sap.m.VariantManagement`,
`sap.ui.mdc` FilterBar / Adapt Filters). F0 builds a second pixel-diff harness against real OpenUI5. Run in order;
F1 and F2 can run in parallel after F0.

- [x] [F0 SAPUI5 reference harness](tasks/F0-sapui5-reference-harness.md) — M
- [x] [F1 VariantManagement](tasks/F1-variant-management.md) — L
- [x] [F2 Adapt Filters dialog](tasks/F2-adapt-filters.md) — L
- [x] [F3 Variants wired to FilterBar + List Report](tasks/F3-variants-integration.md) — M

## Wave E — quality infrastructure (any time; E1 first)

- [x] [E1 Interaction-state visual fixtures](tasks/E1-interaction-fixtures.md) — M
- [x] [E2 Docs site navigation](tasks/E2-docs-navigation.md) — M
- [x] [E3 Publish: GitHub + CI + registry on GitHub Pages](tasks/E3-publish.md) — S (owner decided: snest007/petalo, Pages; push only, no gh; run in the main checkout, not via RUN.md)
- [ ] [E4 Accessibility parity: tree vs UI5 + audit — infrastructure, ratchet, named defects](tasks/E4-a11y-parity.md) — L (rescoped 2026-11-17 after two returns: continue on `codex/E4`; see the card's addendum and `returns/E4.md`. After S0; before waves P and H)
- [ ] [E5 Localization parity — provider, numbers, packs, ratchet, named defects](tasks/E5-l10n-parity.md) — L (third attempt returned; retained on `codex/E5` — see the card's 2026-11-17 addendum and `returns/E5.md`. Parallel to E4; before waves P and H)

## Wave G — usage guidance for coding agents ("use X when / don't use X when / use Y instead")

Source: SAP's design guidance as packaged in `SAP/ai-skills-library` (`sap-fiori-guidelines`, Apache-2.0), rewritten
for this registry's components. One `usage` object per item JSON feeds the registry output, the docs pages and a
generated agent skill `skills/petalo/`. G0 first (pipeline + pilot); G1–G4 are content-only and run in parallel
(each touches different item JSONs; regenerate `skills/` after merge); G5 last.

- [x] [G0 Schema, pipeline, docs, skill generator + pilot](tasks/G0-usage-guidance-pipeline.md) — M
- [x] [G1 Forms and dates](tasks/G1-usage-forms-dates.md) — M (after G0)
- [x] [G2 Data and display](tasks/G2-usage-data-display.md) — M (after G0)
- [x] [G3 Overlays and navigation](tasks/G3-usage-overlays-navigation.md) — M (after G0)
- [x] [G4 Layouts and floorplans](tasks/G4-usage-layout-floorplans.md) — M (after G0)
- [x] [G5 Coverage gate, pilot rewrite, exports filter, slim SKILL.md, agent eval + build loop](tasks/G5-usage-coverage-eval.md) — L (after G1–G4)

## Wave S — Storybook (browse components: variants, live Controls, code, theme toolbar)

Asked for in the follow-up to issue #1: the docs page is hard to browse. Storybook 10.6.7 is added as the main place
to browse components; the existing docs site stays (fixtures, UI5 reference and tests depend on it). S0 first (setup,
theme/density/direction toolbar, docs page with install + usage, deploy, tests, pilot stories); S1–S4 are stories only
and run in parallel (each owns different `docs/stories/**` files); S5 last. Independent of wave G (S0 renders
`usage` when present).

- [x] [S0 Setup, theme toolbar, docs page, deploy + pilot](tasks/S0-storybook-setup.md) — M (adds devDependencies)
- [x] [S1 Actions and forms](tasks/S1-stories-actions-forms.md) — M (after S0)
- [ ] [S2 Dates and data](tasks/S2-stories-dates-data.md) — M (third attempt returned; retained on `codex/S2` — see `returns/S2.md`)
- [ ] [S3 Overlays and display](tasks/S3-stories-overlays-display.md) — M (third attempt returned; retained on `codex/S3` — see `returns/S3.md`)
- [ ] [S4 Navigation, layout and floorplans](tasks/S4-stories-navigation-layout-floorplans.md) — M (third attempt returned; retained on `codex/S4` — see `returns/S4.md`)
- [x] [SX Storybook shared setup: no landmark wrapper around full-page stories](tasks/SX-storybook-landmarks.md) — S (unblocks S4)
- [ ] [S5 Coverage gate + docs-site handover](tasks/S5-storybook-coverage.md) — S (after S1–S4)

## Wave P — accessibility and localization parity backlog (ratchet)

Created 2026-11-17 after E4/E5 were returned twice: whole-library parity (794 of 957 tree comparisons differ; 1,365
i18n gap rows; hundreds of a11y audit rows) can't be one card. E4/E5 create **ratchet baselines** — known differences
are recorded with an owning P card; tests fail on anything new and on stale entries, so the baselines only shrink
(AGENTS.md rules 9 and 10). Each P card drives its component group to zero. After E4 and E5; P cards touch disjoint
components and may run in parallel (at most two at a time — each runs the full tree matrix). Absent UI5 features found
on the way are listed for the owner, not built.

| Card | Components (owner value in the baselines) |
|---|---|
| P1 | button, segmented-button, toggle-button, label, input, textarea, checkbox, radio-group, switch, slider, rating-indicator, step-input, select, form |
| P2 | combobox, multi-combobox, multi-input, token, tokenizer, file-uploader, color-palette, color-palette-popover, color-picker, time-picker, picker-field |
| P2a | calendar, date-picker, date-range-picker, date-time-picker (split from P2 on 2026-11-17 so the Calendar pilot runs first) |
| P3 | table, data-table, list, tree, timeline, upload-collection, object-status, object-number, object-identifier |
| P4 | dialog, popover, responsive-popover, menu, toast, user-menu, value-help-dialog, view-settings-dialog, adapt-filters-dialog |
| P5 | avatar, busy-indicator, card, carousel, expandable-text, hero-banner, illustrated-message, link, media-gallery, message-strip, panel, progress-indicator, tag, text, title |
| P6 | bar, breadcrumbs, filter-bar, notification-list, product-switch, search, shell-bar, side-navigation, tabs, toolbar, variant-management, wizard, dynamic-page, dynamic-side-content, flexible-column-layout, navigation-layout, object-page, page, f6-navigation, variants |

Components added later (wave H) join the group of their demo category; their cards must not add baseline entries.

- [ ] [P1 Actions and text/choice fields](tasks/P1-parity-actions-fields.md) — L (after E4, E5)
- [ ] [P2a Calendar and date pickers](tasks/P2a-parity-calendar-date-pickers.md) — M (after E4, E5; **first**, unblocks H6)
- [ ] [P2 Value pickers, tokens and time](tasks/P2-parity-value-pickers.md) — L (after E4, E5)
- [ ] [P3 Data (incl. custom-content announcements)](tasks/P3-parity-data.md) — L (after E4, E5)
- [ ] [P4 Overlays (incl. ViewSettingsDialog mode control)](tasks/P4-parity-overlays.md) — L (after E4, E5)
- [ ] [P5 Display](tasks/P5-parity-display.md) — L (after E4, E5)
- [ ] [P6 Navigation and layout](tasks/P6-parity-navigation-layout.md) — L (after E4, E5)

## Wave X — extension architecture (owner's decision, 2026-11-17)

The library is public and is a **template**: it ships UI5 parity as the default plus extension points deep enough
that consumers build their own features (a fiscal-period picker, a booking calendar…) without forking our files.
We don't build those features. X0 defines one contract for every component (style/state, content, structure tiers),
proves it on Calendar with a prototype, and proposes rollout cards. Calendar work in wave H (H6, H6b) waits for it;
H1's AnalyticalTable contract must conform to it.

- [x] [X0 Extension architecture: library-wide contract + Calendar pilot design](tasks/X0-extension-architecture.md) — M (design only; no `registry/` edits; any time)

**X0 approved by the owner on 2026-11-17**, with amendments (top of [the contract](../extension-contract.md)); AGENTS.md
rule 11 is active. Rollout list below; full cards are written per group when it comes up. Every card is S or M and
implements only its stated components. **"Apply the inventory tiers" means: T1 in full; a T2/T3 point only with a
realistic consumer example that would otherwise fork the file, plus its invariant tests.** Inventory tiers and candidate
keys are ceilings, not targets; unneeded keys are listed as "not needed yet" in the final message. A group's P card
merges **before** its extension cards; no concurrent edits of the same files. First prove the pattern with
**P2a → H6 → H6b → H6c** (right after E4/E5); then P3 → X12 → X13. Other groups follow their P card and may run
independently. H0 → H1–H5 remains serial.

- [ ] **X1 Action buttons** — M, after P1; apply the inventory tiers to `button`, `toggle-button`, `segmented-button`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X2 Text fields and label** — M, after P1; apply the inventory tiers to `input`, `textarea`, `label`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X3 Choice controls** — M, after P1; apply the inventory tiers to `checkbox`, `radio-group`, `switch`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X4 Numeric controls** — M, after P1; apply the inventory tiers to `slider`, `step-input`, `rating-indicator`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X5 Select** — M, after P1; apply the inventory tiers to `select`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X6 Form** — S, after P1; apply the inventory tiers to `form`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X7 Comboboxes** — M, after P2; apply the inventory tiers to `combobox`, `multi-combobox`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X8 Token input** — M, after P2; apply the inventory tiers to `multi-input`, `token`, `tokenizer`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X9 File uploader** — S, after P2; apply the inventory tiers to `file-uploader`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X10 Colour pickers** — M, after P2; apply the inventory tiers to `color-palette`, `color-palette-popover`, `color-picker`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X11 Time and picker field** — M, after P2; apply the inventory tiers to `time-picker`, `picker-field`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X12 List** — M, after P3; apply the inventory tiers to `list`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X13 Tree** — M, after P3; apply the inventory tiers to `tree`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X14 Table** — M, after P3; apply the inventory tiers to `table`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X15 Data table** — M, after P3; apply the inventory tiers to `data-table`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X16 Timeline and uploads** — M, after P3; apply the inventory tiers to `timeline`, `upload-collection`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X17 Object display** — S, after P3; apply the inventory tiers to `object-status`, `object-number`, `object-identifier`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X18 Dialog** — M, after P4; apply the inventory tiers to `dialog`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X19 Popover surfaces** — M, after P4; apply the inventory tiers to `popover`, `responsive-popover`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X20 Menus** — M, after P4; apply the inventory tiers to `menu`, `user-menu`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X21 Toast** — S, after P4; apply the inventory tiers to `toast`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X22 Value help** — M, after P4; apply the inventory tiers to `value-help-dialog`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X23 Settings/filter dialogs** — M, after P4; apply the inventory tiers to `view-settings-dialog`, `adapt-filters-dialog`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X24 Identity and progress** — S, after P5; apply the inventory tiers to `avatar`, `busy-indicator`, `progress-indicator`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X25 Cards and panels** — M, after P5; apply the inventory tiers to `card`, `panel`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X26 Media** — M, after P5; apply the inventory tiers to `carousel`, `media-gallery`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X27 Hero and illustration** — S, after P5; apply the inventory tiers to `hero-banner`, `illustrated-message`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X28 Text display** — S, after P5; apply the inventory tiers to `expandable-text`, `link`, `text`, `title`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X29 Status and icons** — S, after P5; apply the inventory tiers to `message-strip`, `tag`, `icon`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X30 Bars and breadcrumbs** — M, after P6; apply the inventory tiers to `bar`, `toolbar`, `breadcrumbs`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X31 Tabs and wizard** — M, after P6; apply the inventory tiers to `tabs`, `wizard`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X32 Filtering and variants** — M, after P6; apply the inventory tiers to `filter-bar`, `variant-management`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X33 Notifications and products** — M, after P6; apply the inventory tiers to `notification-list`, `product-switch`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X34 Search and shell** — M, after P6; apply the inventory tiers to `search`, `shell-bar`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X35 Side navigation** — M, after P6; apply the inventory tiers to `side-navigation`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X36 Dynamic page** — M, after P6; apply the inventory tiers to `dynamic-page`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X37 Object page** — M, after P6; apply the inventory tiers to `object-page`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X38 Column layouts** — M, after P6; apply the inventory tiers to `dynamic-side-content`, `flexible-column-layout`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X39 Page/navigation layout** — M, after P6; apply the inventory tiers to `navigation-layout`, `page`, preserving defaults and validating owned parts, locale and installed consumers.

- [ ] **X40 Extension usage metadata** — S, after H6/H6b and X12; add a validated optional extension block to the G-wave schema, docs and generated skill, with public API/ownership links.

## Wave H — issue #1: AnalyticalTable, Calendar extension points, missing components

From [issue #1](https://github.com/snest007/petalo/issues/1) (reporter azhu716). Principle agreed with
them: **parity with the reference, plus extension points** — consumers customise through render slots, state, styling
hooks and the table instance; we don't build bespoke features. Accessibility (rule 9) and localization (rule 10) in
full. Components UI5 Web Components lacks are ported from **UI5 Web Components for React 2.28.2** (WCR), which H0 turns
into a pixel / accessibility-tree / locale reference.

Order: E4 and E5 first (wave P may run alongside H). Then H0. H1–H5 (AnalyticalTable) edit the same files and run strictly in order; H6–H10 run in
parallel with them and with each other, except cards that touch the same existing file (noted in each card).

- [ ] [H0 WCR reference harness + WCR texts in the i18n pipeline](tasks/H0-wcr-reference-harness.md) — M (after E4, E5; adds devDependencies)
- [ ] [H1 AnalyticalTable: extension contract, ARIA ownership, columns, keyboard](tasks/H1-analytical-table-foundation.md) — L (after H0, P3; conforms to the approved `docs/extension-contract.md`)
- [ ] [H2 AnalyticalTable: sorting and filtering](tasks/H2-analytical-table-sort-filter.md) — L (after H1)
- [ ] [H3 AnalyticalTable: grouping and aggregation](tasks/H3-analytical-table-group-aggregate.md) — L (after H2)
- [ ] [H4 AnalyticalTable: tree, selection, sub-components, row states](tasks/H4-analytical-table-tree-select-subcomponents.md) — L (after H3)
- [ ] [H5 AnalyticalTable: virtualisation, infinite scroll, F2 editing, pop-in](tasks/H5-analytical-table-virtual-infinite-edit.md) — L (after H4)
- [ ] [H6 Calendar extension points (+ date pickers)](tasks/H6-calendar-extension-points.md) — M (after E4, E5, P2a; X0-approved design)
- [ ] [H6b Calendar: activated day in selection events, custom week numbers](tasks/H6b-calendar-selection-detail-week-numbers.md) — S (after H6; same file, never in parallel with it)
- [ ] [H6c Calendar week numbers: match UI5 2.28 + `calendarWeekNumbering`](tasks/H6c-calendar-week-numbering.md) — M (after E5, P2a, H6, H6b; same files, never in parallel with them)
- [ ] [H7 Input suggestions + MessageBox](tasks/H7-input-suggestions-messagebox.md) — L (after H0)
- [ ] [H8 SplitButton, ButtonBadge, NumericInput](tasks/H8-split-button-badge-numeric.md) — M (after E4, E5)
- [ ] [H9 SelectDialog, SplitterLayout, DynamicDateRange, CalendarLegend check](tasks/H9-select-dialog-splitter-dynamic-date-range.md) — L (after H0)
- [ ] [H10 NavigationMenu, AnalyticalCardHeader, ActionSheet, UserSettingsDialog, TableHeaderCellActionAI](tasks/H10-remaining-low-priority.md) — L (after H0; may split)

Not planned from issue #1 (proposed; owner to confirm): **FlexBox** and **Grid** (layout utilities WCR adds for apps
without a CSS framework — Tailwind's `flex`/`grid` already cover them), **imperative Modals API** (H7's
`useMessageBox()` covers the common case), **BarcodeScannerDialog** (camera + ZXing dependency, niche),
**ThemeProvider** (themes switch with `data-theme`/`data-density`; revisit if users ask for a React hook).
Already covered: ResponsiveGridLayout (`Form` `layout`/`labelSpan`), ObjectPage, ObjectStatus, FilterBar,
VariantManagement.

## Out of scope (owner's decision)

- Non-Gregorian calendars: won't be built. Calendar/DatePicker stay Gregorian-only (documented in README).
