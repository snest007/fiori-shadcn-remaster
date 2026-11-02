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
later waves depend on earlier ones. The reviewer (human or Claude) merges branches into `main` in card order.

Sizes: S ≈ <300 changed lines, M ≈ 300–900, L ≈ 900+.

## Wave A — overflow ("More") behaviour (independent)

- [ ] [A1 Tabs overflow](tasks/A1-tabs-overflow.md) — M
- [ ] [A2 Toolbar overflow](tasks/A2-toolbar-overflow.md) — M
- [ ] [A3 Breadcrumbs overflow](tasks/A3-breadcrumbs-overflow.md) — S
- [ ] [A4 AvatarGroup overflow "+N"](tasks/A4-avatar-group-overflow.md) — S
- [ ] [A5 SideNavigation overflow item](tasks/A5-side-navigation-overflow.md) — M

## Wave B — feature gaps in existing components (independent)

- [ ] [B1 Dialog draggable / resizable](tasks/B1-dialog-drag-resize.md) — M
- [ ] [B2 Menu checkable items and groups](tasks/B2-menu-check-mode.md) — S
- [ ] [B3 ComboBox / MultiComboBox item groups](tasks/B3-combobox-groups.md) — M
- [ ] [B4 Table and List drag & drop reordering](tasks/B4-drag-and-drop.md) — L
- [ ] [B5 NotificationList growing](tasks/B5-notification-growing.md) — S

## Wave C — new components

- [ ] [C1 ColorPalette + ColorPalettePopover](tasks/C1-color-palette.md) — M
- [ ] [C2 ColorPicker](tasks/C2-color-picker.md) — M (after C1: shares the color utilities)
- [ ] [C3 MediaGallery](tasks/C3-media-gallery.md) — M

## Wave D — platform behaviour (after waves A–C are merged; touches many components)

- [ ] [D1 Phone layouts for popups](tasks/D1-phone-popups.md) — L
- [ ] [D2 F6 fast navigation](tasks/D2-f6-navigation.md) — M
- [ ] [D3 RTL verification](tasks/D3-rtl.md) — M

## Wave E — quality infrastructure (any time; E1 first)

- [ ] [E1 Interaction-state visual fixtures](tasks/E1-interaction-fixtures.md) — M
- [ ] [E2 Docs site navigation](tasks/E2-docs-navigation.md) — M
- [ ] [E3 Publish: GitHub + registry hosting](tasks/E3-publish.md) — S (needs the owner's accounts — do last, with the owner)

## Out of scope for agents

- FilterBar "Adapt Filters" dialog and variant management: SAPUI5-only (sap.ui.comp / sap.ui.fl), no UI5 Web Components
  reference. Needs a product decision on scope first.
- Non-Gregorian calendars: needs CLDR calendar data beyond Intl; decide whether it's wanted.
