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
- [ ] [E3 Publish: GitHub + registry hosting](tasks/E3-publish.md) — S (needs the owner's accounts — do last, with the owner)

## Out of scope (owner's decision)

- Non-Gregorian calendars: won't be built. Calendar/DatePicker stay Gregorian-only (documented in README).
