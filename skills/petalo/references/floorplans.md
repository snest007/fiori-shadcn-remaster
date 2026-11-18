# Floorplans

| Item | Summary |
| --- | --- |
| [app-shell](#app-shell) | Frame application pages with shared shell actions, optional side navigation and a scrolling content area. |
| [empty-states](#empty-states) | Start from a gallery of empty, no-results, failure and success messages with recovery-action examples. |
| [launchpad](#launchpad) | Start an application-entry page from a shared shell, selected side navigation and replaceable page content. |
| [list-report](#list-report) | Find and act on business records with saved views, applied filters and a responsive results table. |
| [master-detail](#master-detail) | Browse a searchable record list beside its selected detail and, when needed, a related sub-detail. |
| [object-page-floorplan](#object-page-floorplan) | Inspect and edit one object through a complete header, sectioned details and Save/Cancel flow. |
| [wizard-page](#wizard-page) | Guide linear creation through validated steps, a review screen and final submission actions. |

## app-shell

Frame application pages with shared shell actions, optional side navigation and a scrolling content area.

### Use when

- Let users work across application pages while retaining global search, notifications, profile and product access.
- Keep global shell actions available as users navigate between business tasks.
- Provide an application frame around page content, with optional persistent side navigation.

### Don't use when

- Compose your own header, vertical navigation and content without the sample shell integrations. → [navigation-layout](layout.md#navigation-layout)
- Build an entry point with selected business-area navigation and app-tile content. → [launchpad](floorplans.md#launchpad)
- Build the business page itself: filter records, inspect one object, or browse an adjacent list and detail. → [list-report](floorplans.md#list-report), [object-page-floorplan](floorplans.md#object-page-floorplan), [master-detail](floorplans.md#master-detail)
- Show an empty or recovery view within a frame that already exists. → [empty-states](floorplans.md#empty-states)

### Layout

```text
viewport frame
  header: ShellBar with ShellBarBranding, ShellBarSearch, SearchItem, Avatar and ShellBarItem
    menu trigger: Button with Icon when side navigation is a render function
  notification surface: Popover with PopoverAnchor and PopoverContent
    header: PopoverHeader with PopoverTitle
    body: PopoverBody with NotificationList
      groups: NotificationListGroupItem with NotificationListItem
  product surface: Popover with PopoverAnchor and PopoverContent
    body: PopoverBody with ProductSwitch and ProductSwitchItem
  profile surface: UserMenu with UserMenuItem
  body: optional caller-supplied side navigation beside scrolling main content
    default content: Card with Title and Text; replaced by children
```

### Variations

- Supply page content as children and sideNavigation as a node or render function; the render function connects collapsed state to the menu button.
- Replace the sample account, search results, product targets and notification data and handlers with application services; preserve shell openers and focus return.
- Omit sideNavigation for a page that needs no navigation rail; the menu trigger is then absent.

Main exports: `AppShell` (default export).

```bash
npx shadcn add @petalo/app-shell
```

## empty-states

Start from a gallery of empty, no-results, failure and success messages with recovery-action examples.

### Use when

- Explain why no content is available and offer the action that can help users continue.
- Choose a starting pattern for no data, no search or filter results, loading failure, a missing page or completed work.
- Compare full-page and embedded message sizes before adapting one state to the application.

### Don't use when

- Embed a single empty or unavailable state in content that already has its own container. → [illustrated-message](display.md#illustrated-message)
- Show available records with search, filters and row actions. → [list-report](floorplans.md#list-report)
- Build the shared application frame rather than an empty or recovery view. → [app-shell](floorplans.md#app-shell)
- Offer an application-entry page with favorite app tiles. → [launchpad](floorplans.md#launchpad)

### Layout

```text
main gallery
  header: Title, then Label and SegmentedButton with SegmentedButtonItem size choices
  full-page section: Title, Card and IllustratedMessage with a create Button
  search/filter section: Title and two Card surfaces
    each: IllustratedMessage with clear Button actions
  errors section: Title and two Card surfaces with IllustratedMessage and retry/home Button actions
  small-container section: Title and two Card surfaces with IllustratedMessage; success has a Button
  action feedback: native status text after filter clearing and retry attempts
```

### Variations

- Keep only the state relevant to the page and replace the gallery heading and size selector with the application’s own context.
- Wire create, clear-search, clear-filter, retry and home actions to real recovery behavior; the sample handlers do not fetch or navigate.
- Choose Scene, Dialog, Spot or Dot to fit the host region and provide task-specific titleText and subtitleText.

Main exports: `EmptyStates` (default export).

```bash
npx shadcn add @petalo/empty-states
```

## launchpad

Start an application-entry page from a shared shell, selected side navigation and replaceable page content.

### Use when

- Give users an app-entry starting point for choosing business areas and opening favorite apps.
- Keep the selected side-navigation entry synchronized with the page beneath shared shell actions.
- Replace the Home Title/Text placeholder with app tiles and route targets; the current block supplies no tile grid.

### Don't use when

- Need only the application frame or a custom header/navigation/content container. → [app-shell](floorplans.md#app-shell), [navigation-layout](layout.md#navigation-layout)
- Find and filter available business records, or explain an empty or unavailable result. → [list-report](floorplans.md#list-report), [empty-states](floorplans.md#empty-states)
- Inspect or edit the details of one business object. → [object-page-floorplan](floorplans.md#object-page-floorplan)
- Browse a record list and its selected detail in adjacent columns. → [master-detail](floorplans.md#master-detail)
- Guide creation through 3–8 validated steps and review. → [wizard-page](floorplans.md#wizard-page)

### Layout

```text
AppShell (shared shell actions and scrolling content)
  side navigation: SideNavigation with SideNavigationItem and SideNavigationGroup
    nested entries: SideNavigationSubItem
    fixed entries: SideNavigationItem for settings and help
  content: Title and Text for the selected placeholder page
```

### Variations

- Replace the Home placeholder with favorite-app tiles linked to application destinations; retain the shared shell and navigation.
- Replace the inline page-title map and selected-value state with application routes; retain navigation selection and the shell menu’s collapsed-state connection.
- Adapt navigation groups, nested entries and fixed settings/help items to the business roles using the application.

Main exports: `Launchpad` (default export).

```bash
npx shadcn add @petalo/launchpad
```

## list-report

Find and act on business records with saved views, applied filters and a responsive results table.

### Use when

- Let users search and filter a business-record collection before taking item or mass actions.
- Return to saved filter views when the same search tasks recur.
- Keep applied results distinct from draft filters and reveal finalizing actions after row selection.

### Don't use when

- Inspect or edit one record with categorized details, or keep a list beside its selected detail. → [object-page-floorplan](floorplans.md#object-page-floorplan), [master-detail](floorplans.md#master-detail)
- Create an unfamiliar object through 3–8 validated steps and review. → [wizard-page](floorplans.md#wizard-page)
- Compose a custom result-page container with DynamicPage, or categorized details for one object with ObjectPage, instead of adapting a complete results floorplan. → [dynamic-page](layout.md#dynamic-page), [object-page](layout.md#object-page)
- Build shared global application framing around the business results page. → [app-shell](floorplans.md#app-shell)
- Explain an empty or unavailable result and provide recovery actions rather than show available rows. → [empty-states](floorplans.md#empty-states)

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
npx shadcn add @petalo/list-report
```

## master-detail

Browse a searchable record list beside its selected detail and, when needed, a related sub-detail.

### Use when

- Select records from a list while keeping their detail visible in an adjacent column when space permits.
- Open a related sub-object in a third column, with full-screen and close actions for the selected detail.
- Start from a working list/detail navigation example and replace the inline products and sales-order items.

### Don't use when

- Search and filter records with saved views, a results table and mass actions. → [list-report](floorplans.md#list-report)
- Inspect or edit one object without keeping a record list beside it. → [object-page-floorplan](floorplans.md#object-page-floorplan)
- Show lightweight temporary details tied to an opener. → [popover](overlays.md#popover)
- Compose custom related pages and columns with FlexibleColumnLayout, or supply only global application framing around those pages with AppShell. → [flexible-column-layout](layout.md#flexible-column-layout), [app-shell](floorplans.md#app-shell)

### Layout

```text
viewport frame
  header: native application heading
  content: FlexibleColumnLayout
    start column: Bar, Input with InputIcon and Icon, then List with ListItemStandard
    mid column: Bar with Button and Icon column actions, scrolling attributes, Tag and related List
      related records: ListItemStandard opens the end column
    end column: Bar with Button and Icon column actions, then scrolling line-item attributes and Tag
```

### Variations

- Replace inline records and search filtering with application data; keep selected record keys and navigation levels synchronized.
- Use only list and detail columns when the object has no related sub-detail; retain close and full-screen behavior.
- Adapt the detail fields and related list to the business object; clear obsolete selections when their column or parent is closed.

Main exports: `MasterDetail` (default export).

```bash
npx shadcn add @petalo/master-detail
```

## object-page-floorplan

Inspect and edit one object through a complete header, sectioned details and Save/Cancel flow.

### Use when

- Inspect or edit one business object with its identity, status, totals and categorized details.
- Keep related forms, line items and notes on one page with anchor navigation.
- Start from the display/edit example, then replace sample data and Save/Cancel handlers with application persistence.

### Don't use when

- Find and filter a record collection or act on selected records together. → [list-report](floorplans.md#list-report)
- Keep a record list and its selected detail visible in adjacent columns. → [master-detail](floorplans.md#master-detail)
- Guide unfamiliar object creation through 3–8 validated steps and review. → [wizard-page](floorplans.md#wizard-page)
- Compose custom sections and edit handling with ObjectPage, or supply only shared global framing around the object page with AppShell. → [object-page](layout.md#object-page), [app-shell](floorplans.md#app-shell)

### Layout

```text
viewport frame
  ObjectPage
    title: DynamicPageTitle with Breadcrumbs and BreadcrumbsItem, Title, Label and Toolbar actions
    header: ObjectPageHeader with Avatar and ObjectPageHeaderFacet
      facets: ObjectAttribute, ObjectStatus and ObjectNumber
    navigation: anchor bar supplied by ObjectPage
    general section: ObjectPageSection and ObjectPageSubSection with Form, FormGroup and FormItem
      fields: Label with Text in display mode or Input in edit mode
    items section: ObjectPageSection with ObjectPageSubSection
      actions: Toolbar with Title, ToolbarSpacer and ToolbarButton
      content: Table with TableHeaderRow, TableHeaderCell, TableRow and TableCell
        cells: ObjectIdentifier, ObjectStatus and ObjectNumber
    notes section: ObjectPageSection and ObjectPageSubSection with Text or TextArea
    footer: Bar with save/cancel Button actions (shown in edit mode)
```

### Variations

- Replace the inline order, header facets, form groups, item columns and notes with the business object’s details.
- Connect Save and Cancel to application persistence and draft handling; preserve the distinction between saved display data and editable drafts.
- Choose ObjectPage mode="tabs" when users should work with one categorized section at a time instead of the continuous anchor view.

Main exports: `ObjectPageBlock` (default export).

```bash
npx shadcn add @petalo/object-page-floorplan
```

## wizard-page

Guide linear creation through validated steps, a review screen and final submission actions.

### Use when

- Create an unfamiliar object through 3–8 ordered steps before reviewing and submitting the result.
- Prevent progress until required entries are valid, then let users revisit completed sections from review.
- Start from a complete Page and Wizard flow with validation, review, footer actions and completion feedback.

### Don't use when

- Complete fewer than 3 steps or enter fields together on one existing page. → [form](forms.md#form), [page](layout.md#page)
- Inspect or edit one object directly through sectioned details instead of a guided sequence. → [object-page](layout.md#object-page), [object-page-floorplan](floorplans.md#object-page-floorplan)
- Need the step control inside an existing or custom page with your own validation and final actions. → [wizard](navigation.md#wizard)
- Find and filter a business-record collection. → [list-report](floorplans.md#list-report)

### Layout

```text
viewport frame
  Page
    header: Bar with Title
    edit content: Wizard with WizardStep sections
      fields: Label, Input, DatePicker and Checkbox
      selection fields: Select
        trigger: SelectTrigger with SelectValue
        popup: SelectContent with SelectItem
      step content: Title, Text and next-step Button actions
    review content: native sections
      headings: Title with edit Link
      values: Label and Text
    completion content: MessageStrip
      action: Link to create another object
      followed by the same reviewed sections
    footer: Bar with Button actions
      review/cancel or submit/cancel; absent after completion
```

### Variations

- Replace the four sample product steps and fields with 3–8 steps for the creation task; keep later steps unreachable while preceding required data is invalid.
- Replace the local Submit completion state with application submission and error handling; retain review, section editing and cancellation.
- Adapt review labels and values to match the entry steps so users can verify and correct the same data before submission.

Main exports: `WizardPage` (default export).

```bash
npx shadcn add @petalo/wizard-page
```
