---
name: shadcn-fiori
description: Build React enterprise pages with the shadcn-fiori registry. Use for SAP Fiori, Horizon or UI5 styling with shadcn, and for choosing its components and floorplan blocks.
---

# Build with shadcn-fiori

Choose a floorplan for the page's task, then read the relevant category reference to choose its controls.
The tables below index every documented registry item. Detailed usage is authored incrementally; entries
without it provide an API/export index, not a recommendation for that use case.

## Install

Requires React 19 and Tailwind CSS v4. Configure the `@fiori` registry before adding items:

```bash
npx shadcn@latest init https://snest007.github.io/fiori-shadcn-remaster/r/fiori.json
npx shadcn add @fiori/<name>
```

Components install into `@/components/ui/<name>`; floorplan blocks install into `@/components/<name>`.
Read the installed source or the component docs for props; the reference lists runtime exports, not the full API.
Replace floorplan sample data and action handlers with the application's own data flow.

## Fiori rules

- Use `--sap*` tokens and `--fiori-*` parameters for visual values. Set `data-theme` and `data-density` for theme and density.
- Use `none | negative | critical | positive | information` for value states. Supply a useful `valueStateMessage` where the control supports it.
- Keep at most one `Button variant="emphasized"` per page or dialog; label actions with verbs.
- Give fields visible labels and icon buttons accessible names. Keep keyboard rings on `:focus-visible`.
- Use the actual React prop names and enum values; SAPUI5 APIs are not interchangeable with this registry.

## Floorplan picker

| Block | Use when | Don't use when | Instead |
| --- | --- | --- | --- |
| [app-shell](references/floorplans.md#app-shell) | Guidance not yet authored; inspect the block. | — | — |
| [empty-states](references/floorplans.md#empty-states) | Guidance not yet authored; inspect the block. | — | — |
| [launchpad](references/floorplans.md#launchpad) | Guidance not yet authored; inspect the block. | — | — |
| [list-report](references/floorplans.md#list-report) | Search and filter a record collection before reviewing relevant rows and taking item or mass actions.<br>Reuse saved FilterBar states through VariantManagement; replace the sample storage and data flow for the application.<br>Keep page filters in a collapsing header and reveal the action footer only after rows are selected. | View or edit one record with all of its details.<br>Keep a record list and its selected detail visible in adjacent columns.<br>Guide users through sequential data entry steps. | object-page-floorplan<br>master-detail<br>wizard-page |
| [master-detail](references/floorplans.md#master-detail) | Guidance not yet authored; inspect the block. | — | — |
| [object-page-floorplan](references/floorplans.md#object-page-floorplan) | Guidance not yet authored; inspect the block. | — | — |
| [wizard-page](references/floorplans.md#wizard-page) | Guidance not yet authored; inspect the block. | — | — |

Read [Floorplans](references/floorplans.md) for region nesting, alternatives and valid adaptations.

## Component pickers

### Actions

| Item | Summary |
| --- | --- |
| [button](references/actions.md#button) | Trigger an explicit action with priority and semantic intent. |
| [segmented-button](references/actions.md#segmented-button) | Switch related view or setting options in a connected group. |
| [toggle-button](references/actions.md#toggle-button) | Keep a secondary toolbar action visibly on or off. |

### Forms

| Item | Summary |
| --- | --- |
| [checkbox](references/forms.md#checkbox) | Select independent options, including choices reviewed before submission. |
| [color-palette](references/forms.md#color-palette) | Choose a predefined color from swatches kept visible in the page. |
| [color-palette-popover](references/forms.md#color-palette-popover) | Choose a predefined color in an on-demand anchored surface. |
| [color-picker](references/forms.md#color-picker) | Choose an arbitrary color visually or enter its channel values. |
| [combobox](references/forms.md#combobox) | Choose one suggested value by typing, with filtering and optional free-text entry. |
| [file-uploader](references/forms.md#file-uploader) | Select local files for a caller-managed upload flow. |
| [form](references/forms.md#form) | Arrange related labels and fields for one record in responsive groups. |
| [input](references/forms.md#input) | Enter one line of text, a number or a formatted string. |
| [label](references/forms.md#label) | Give a form field a persistent, accessible name. |
| [multi-combobox](references/forms.md#multi-combobox) | Select several predefined options from a filterable list and display selections as tokens. |
| [multi-input](references/forms.md#multi-input) | Collect several values as caller-managed tokens, with suggestions and optional value help. |
| [radio-group](references/forms.md#radio-group) | Choose one mutually exclusive answer while keeping every option visible. |
| [rating-indicator](references/forms.md#rating-indicator) | Collect an icon-based rating or display an aggregate rating. |
| [select](references/forms.md#select) | Choose one value from a short predefined list without entering free text. |
| [slider](references/forms.md#slider) | Adjust one value or a numeric interval along a visual scale. |
| [step-input](references/forms.md#step-input) | Enter an exact number or adjust it by a predefined step. |
| [switch](references/forms.md#switch) | Turn a setting on or off with an immediate effect. |
| [textarea](references/forms.md#textarea) | Enter editable prose across multiple lines. |
| [token](references/forms.md#token) | Represent one previously selected value as a selectable, removable item. |
| [tokenizer](references/forms.md#tokenizer) | Manage keyboard navigation, selection and overflow for existing tokens. |

### Dates

| Item | Summary |
| --- | --- |
| [calendar](references/dates.md#calendar) | Select Gregorian dates in a calendar that remains visible. |
| [date-picker](references/dates.md#date-picker) | Enter or select one localized Gregorian date. |
| [date-range-picker](references/dates.md#date-range-picker) | Enter a localized Gregorian start and end date as one interval. |
| [date-time-picker](references/dates.md#date-time-picker) | Enter one localized Gregorian date and time together. |
| [picker-field](references/dates.md#picker-field) | Compose a custom text field and picker with caller-owned value rules. |
| [time-picker](references/dates.md#time-picker) | Enter or select a localized time without a date. |

### Data

| Item | Summary |
| --- | --- |
| [data-table](references/data.md#data-table) | Render data-driven responsive tables with TanStack columns, sorting and optional row virtualization. |
| [list](references/data.md#list) | Present a sequence of business items for browsing, navigation or selection without column comparison. |
| [object-identifier](references/data.md#object-identifier) | Identify a business object with a primary title and supporting identifier or attributes. |
| [object-number](references/data.md#object-number) | Display a business amount or quantity together with its unit and optional semantic state. |
| [object-status](references/data.md#object-status) | Show the semantic state of a business object with status text and an optional icon. |
| [table](references/data.md#table) | Compose responsive rows and cells when users compare and act on business items. |
| [timeline](references/data.md#timeline) | Present object events and changes in chronological order. |
| [tree](references/data.md#tree) | Browse or select hierarchical items through expandable parent-child nodes. |
| [upload-collection](references/data.md#upload-collection) | Manage prepared or uploaded files with per-file status and lifecycle actions. |

### Overlays

| Item | Summary |
| --- | --- |
| [adapt-filters-dialog](references/overlays.md#adapt-filters-dialog) | Personalize filter fields, their order and values in a staged dialog before applying changes. |
| [dialog](references/overlays.md#dialog) | Pause the current task for a focused decision, confirmation or contained editing task. |
| [menu](references/overlays.md#menu) | Let users choose commands from an opened hierarchy of menu items. |
| [popover](references/overlays.md#popover) | Show information or actions tied to an opener without leaving the current page. |
| [responsive-popover](references/overlays.md#responsive-popover) | Keep contextual content anchored on desktop and tablet, then show it in a full-screen phone dialog. |
| [toast](references/overlays.md#toast) | Confirm a completed action or provide information in a non-disruptive message that disappears automatically. |
| [use-is-phone](references/overlays.md#use-is-phone) | Reactive UI5-style touch/phone detection with a data-fiori-device override. |
| [user-menu](references/overlays.md#user-menu) | Expose signed-in user information, user-specific actions and sign out from the profile entry point. |
| [value-help-dialog](references/overlays.md#value-help-dialog) | Find business values through a searchable result table or define filter conditions in a dialog. |
| [view-settings-dialog](references/overlays.md#view-settings-dialog) | Adjust a list or table view through sorting, grouping and predefined filter choices. |

### Display

| Item | Summary |
| --- | --- |
| [avatar](references/display.md#avatar) | Represent people or business entities with recognizable images, initials or placeholders. |
| [busy-indicator](references/display.md#busy-indicator) | Show that work is running when its completion percentage is unknown. |
| [card](references/display.md#card) | Preview focused business content and offer access to its underlying page or task. |
| [carousel](references/display.md#carousel) | Let users browse a sequence of images or other content pages. |
| [expandable-text](references/display.md#expandable-text) | Keep prose within a character limit while letting users reveal the full text. |
| [hero-banner](references/display.md#hero-banner) | Introduce a product home page with a greeting, context and task shortcuts. |
| [illustrated-message](references/display.md#illustrated-message) | Explain an empty, unavailable or completed state with an illustration and a useful next step. |
| [link](references/display.md#link) | Navigate through meaningful text to a page, anchor or external URL. |
| [media-gallery](references/display.md#media-gallery) | Browse images and videos by selecting thumbnails and inspecting the selected media. |
| [message-strip](references/display.md#message-strip) | Explain application messages in context within a page or section. |
| [panel](references/display.md#panel) | Group information within a page in a section that can collapse to save space. |
| [progress-indicator](references/display.md#progress-indicator) | Show a measured completion percentage for a running process. |
| [tag](references/display.md#tag) | Draw attention to a category, condition or quantity with a compact enclosed marker. |
| [text](references/display.md#text) | Display read-only body text in an application content area. |
| [title](references/display.md#title) | Name pages and sections with explicit heading semantics. |

### Navigation

| Item | Summary |
| --- | --- |
| [bar](references/navigation.md#bar) | Arrange page or dialog header and footer content in start, centered and end areas. |
| [breadcrumbs](references/navigation.md#breadcrumbs) | Show the current location and let users return to ancestors in the navigation path. |
| [f6-navigation](references/navigation.md#f6-navigation) | Opt-in UI5 fast navigation between page groups, with scoped roots, Popup containers, shadows and slots. |
| [filter-bar](references/navigation.md#filter-bar) | Let users limit a result collection by several criteria in the page header. |
| [notification-list](references/navigation.md#notification-list) | Collect business-event updates that users may read, act on or dismiss without interrupting their task. |
| [product-switch](references/navigation.md#product-switch) | Let users choose another product from a grid of labeled product entries. |
| [search](references/navigation.md#search) | Find content by submitting a query, optionally with scopes and suggestions. |
| [shell-bar](references/navigation.md#shell-bar) | Provide a consistent product header with branding and global entry points. |
| [side-navigation](references/navigation.md#side-navigation) | Provide the main navigation between modules or destinations within a product. |
| [tabs](references/navigation.md#tabs) | Switch between content facets or prominent filtered views within the current page. |
| [toolbar](references/navigation.md#toolbar) | Group related actions and controls in a horizontal row with keyboard navigation and responsive overflow. |
| [variant-management](references/navigation.md#variant-management) | Save, select and maintain named views of filter or table personalization settings. |
| [variants](references/navigation.md#variants) | Controlled FilterBar view state, Save/Save As and Manage operations, default views and an optional localStorage persistence adapter. |
| [wizard](references/navigation.md#wizard) | Guide users through a task in reachable steps inside an existing page or custom workflow. |

### Layout

| Item | Summary |
| --- | --- |
| [dynamic-page](references/layout.md#dynamic-page) | Fiori dynamic page: sticky title (heading, breadcrumbs, KPIs, actions), header that snaps on scroll, expand/collapse and pin buttons, floating footer. |
| [dynamic-side-content](references/layout.md#dynamic-side-content) | Fiori dynamic side content: main and side content laid out by the control's width (S/M/L/XL), side position, fall-down, equal split and toggle (ui5-dynamic-side-content). |
| [flexible-column-layout](references/layout.md#flexible-column-layout) | Fiori list-detail-detail layout with up to three columns, resizable separators, responsive column count and the useFlexibleColumnLayout navigation helper. |
| [navigation-layout](references/layout.md#navigation-layout) | Fiori navigation layout: header, collapsible side navigation and content; collapses the side navigation on small screens (ui5-navigation-layout). |
| [object-page](references/layout.md#object-page) | Fiori object page floorplan layout: DynamicPage with object header (avatar, facets), sticky navigation bar with anchor (scroll spy) or tabs mode, sections and subsections on cards. |
| [page](references/layout.md#page) | Fiori page container: header bar, scrolling content and a floating or fixed footer bar, with responsive padding and background designs (ui5-page). |

## Reference index

- [Actions](references/actions.md) — `button`, `segmented-button`, `toggle-button`.
- [Forms](references/forms.md) — `checkbox`, `color-palette`, `color-palette-popover`, `color-picker`, `combobox`, `file-uploader`, `form`, `input`, `label`, `multi-combobox`, `multi-input`, `radio-group`, `rating-indicator`, `select`, `slider`, `step-input`, `switch`, `textarea`, `token`, `tokenizer`.
- [Dates](references/dates.md) — `calendar`, `date-picker`, `date-range-picker`, `date-time-picker`, `picker-field`, `time-picker`.
- [Data](references/data.md) — `data-table`, `list`, `object-identifier`, `object-number`, `object-status`, `table`, `timeline`, `tree`, `upload-collection`.
- [Overlays](references/overlays.md) — `adapt-filters-dialog`, `dialog`, `menu`, `popover`, `responsive-popover`, `toast`, `use-is-phone`, `user-menu`, `value-help-dialog`, `view-settings-dialog`.
- [Display](references/display.md) — `avatar`, `busy-indicator`, `card`, `carousel`, `expandable-text`, `hero-banner`, `illustrated-message`, `link`, `media-gallery`, `message-strip`, `panel`, `progress-indicator`, `tag`, `text`, `title`.
- [Navigation](references/navigation.md) — `bar`, `breadcrumbs`, `f6-navigation`, `filter-bar`, `notification-list`, `product-switch`, `search`, `shell-bar`, `side-navigation`, `tabs`, `toolbar`, `variant-management`, `variants`, `wizard`.
- [Layout](references/layout.md) — `dynamic-page`, `dynamic-side-content`, `flexible-column-layout`, `navigation-layout`, `object-page`, `page`.
- [Floorplans](references/floorplans.md) — `app-shell`, `empty-states`, `launchpad`, `list-report`, `master-detail`, `object-page-floorplan`, `wizard-page`.

Guidance is adapted from SAP's Apache-2.0 ai-skills-library at the pinned revision in [NOTICE](NOTICE).
