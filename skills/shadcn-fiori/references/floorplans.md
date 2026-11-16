# Floorplans

## app-shell

SAP Fiori launchpad-style shell: a ShellBar wired to notifications, user menu and product switch popovers, with a side navigation slot and a content area.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `AppShell` (default export).

```bash
npx shadcn add @fiori/app-shell
```

## empty-states

Gallery of the standard Fiori empty and error states (no data, no search results, no filter results, unable to load, page not found, success) as IllustratedMessage with actions, at different sizes.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `EmptyStates` (default export).

```bash
npx shadcn add @fiori/empty-states
```

## launchpad

The App Shell block with a SideNavigation wired to its menu button and a page per navigation item.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Launchpad` (default export).

```bash
npx shadcn add @fiori/launchpad
```

## list-report

Find and act on business records with saved views, applied filters and a responsive results table.

### Use when

- Search and filter a record collection before reviewing relevant rows and taking item or mass actions.
- Reuse saved FilterBar states through VariantManagement; replace the sample storage and data flow for the application.
- Keep page filters in a collapsing header and reveal the action footer only after rows are selected.

### Don't use when

- View or edit one record with all of its details. → [object-page-floorplan](floorplans.md#object-page-floorplan)
- Keep a record list and its selected detail visible in adjacent columns. → [master-detail](floorplans.md#master-detail)
- Guide users through sequential data entry steps. → [wizard-page](floorplans.md#wizard-page)

### Layout

```text
DynamicPage
  title: DynamicPageTitle with VariantManagement and snapped filter summary
  header: DynamicPageHeader with FilterBar
  content: Toolbar with Title and row actions, then DataTable
    cells: ObjectIdentifier, ObjectStatus, ObjectNumber
  footer: Bar with Button mass actions (shown on selection)
```

### Variations

- Replace the inline products and applyState handler with application records and a search service; keep filters separate from applied results.
- Adapt columns, row actions and mass actions to the business object; retain stable row keys and selection-driven footer visibility.
- Replace localStorageAdapter with a VariantStorage implementation when saved views must persist outside this browser.

Main exports: `ListReport` (default export).

```bash
npx shadcn add @fiori/list-report
```

## master-detail

Fiori Flexible Column Layout app: searchable product list, product object view and sales order line item, navigated with useFlexibleColumnLayout.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `MasterDetail` (default export).

```bash
npx shadcn add @fiori/master-detail
```

## object-page-floorplan

SAP Fiori Object Page floorplan: object header with avatar and facets, anchor navigation, sections General Information (form), Items (table) and Notes, edit mode with a Save / Cancel floating footer. Sample data inline.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ObjectPageBlock` (default export).

```bash
npx shadcn add @fiori/object-page-floorplan
```

## wizard-page

Fiori Wizard floorplan: a Page with a Wizard of form steps (Select, Input, DatePicker, Checkbox), step-by-step validation, a review page with Edit links and a footer with Review / Submit / Cancel.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `WizardPage` (default export).

```bash
npx shadcn add @fiori/wizard-page
```
