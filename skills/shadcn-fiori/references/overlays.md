# Overlays

## adapt-filters-dialog

OpenUI5 Adapt Filters personalization: transactional filter values, visibility and order, List/Group views, search, Reset and keyboard reordering.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `AdaptFiltersDialog`.

```bash
npx shadcn add @fiori/adapt-filters-dialog
```

## dialog

Fiori modal dialog with header/footer bars and Negative/Critical/Positive/Information states (ui5-dialog).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Dialog`, `DialogBody`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogTitle`, `DialogTrigger`.

```bash
npx shadcn add @fiori/dialog
```

## menu

Fiori menu with single/multiple checkable groups, icons, additional text, submenus, separators and disabled items (ui5-menu).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Menu`, `MenuContent`, `MenuGroup`, `MenuItem`, `MenuSeparator`, `MenuSub`, `MenuSubContent`, `MenuSubTrigger`, `MenuTrigger`.

```bash
npx shadcn add @fiori/menu
```

## popover

Fiori popover with arrow, optional header/footer bars and padded content (ui5-popover).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Popover`, `PopoverAnchor`, `PopoverBody`, `PopoverClose`, `PopoverContent`, `PopoverFooter`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger`, `usePopupMediaRange`.

```bash
npx shadcn add @fiori/popover
```

## responsive-popover

UI5 responsive popover: desktop popover, full-screen phone dialog with header and footer slots.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ResponsivePopover`, `ResponsivePopoverAnchor`, `ResponsivePopoverContent`, `ResponsivePopoverTrigger`.

```bash
npx shadcn add @fiori/responsive-popover
```

## toast

Fiori toast: auto-dismisses after its duration, pauses on hover/focus, nine placements (ui5-toast).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Toast`.

```bash
npx shadcn add @fiori/toast
```

## use-is-phone

Reactive UI5-style touch/phone detection with a data-fiori-device override.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `useIsPhone`.

```bash
npx shadcn add @fiori/use-is-phone
```

## user-menu

Fiori user menu popover with account header, manage account, menu items and sign out (ui5-user-menu).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `UserMenu`, `UserMenuItem`.

```bash
npx shadcn add @fiori/user-menu
```

## value-help-dialog

Find business values through a searchable result table or define filter conditions in a dialog.

### Use when

- Search business keys and descriptions across columns; identify returned keys with keyField and optional descriptionField.
- Select several values with selectionMode="multiple", or confirm one row immediately with selectionMode="single".
- Define operators and ranges with supportConditions in multiple mode; disable it for selection-only tasks.
- Supply filters for multiattribute search, or handle onSearch and pass updated items for server-side results.

### Don't use when

- Pick one value from a short predefined list without inspecting additional attributes. → [select](forms.md#select)
- Choose one value from suggestions or accept free text without a separate search task. → [combobox](forms.md#combobox)
- Select several values from a manageable predefined list without conditions. → [multi-combobox](forms.md#multi-combobox)
- Enter several tokens without needing a search dialog. → [multi-input](forms.md#multi-input)

Main exports: `ValueHelpDialog`, `formatCondition`.

```bash
npx shadcn add @fiori/value-help-dialog
```

## view-settings-dialog

Fiori view settings dialog: sort/filter/group pages, two-level filter navigation with counters, Reset, OK/Cancel (ui5-view-settings-dialog).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ViewSettingsDialog`.

```bash
npx shadcn add @fiori/view-settings-dialog
```
