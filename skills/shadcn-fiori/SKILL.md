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
| [button](references/actions.md#button) | Fiori button designs: default, emphasized, transparent, positive, negative, attention. |
| [segmented-button](references/actions.md#segmented-button) | Fiori segmented button (single or multiple selection) with arrow-key navigation and one tab stop. |
| [toggle-button](references/actions.md#toggle-button) | Fiori toggle button: a Button that keeps a pressed state, in every Fiori button design. |

### Forms

| Item | Summary |
| --- | --- |
| [checkbox](references/forms.md#checkbox) | Fiori check box with indeterminate, read-only and value states; Space/Enter toggle. |
| [color-palette](references/forms.md#color-palette) | Fiori predefined color palette with the UI5 five-column keyboard model, default color and local recent colors. |
| [color-palette-popover](references/forms.md#color-palette-popover) | Fiori color palette popover with external opener, selection dismissal and persistent local palette history. |
| [color-picker](references/forms.md#color-picker) | Fiori color picker with hue, alpha, hexadecimal and RGB/HSL channel inputs. |
| [combobox](references/forms.md#combobox) | Choose one suggested value by typing, with filtering and optional free-text entry. |
| [file-uploader](references/forms.md#file-uploader) | Fiori file uploader: input-styled field with browse/clear icons, multiple files, accept, max size, drag & drop (ui5-file-uploader). Upload transport is up to the caller. |
| [form](references/forms.md#form) | Fiori form (ui5-form): responsive label/field layout with columns per size range, labelSpan / emptySpan, groups, display (definition list) and edit modes. |
| [input](references/forms.md#input) | Fiori input with value states and value state message. |
| [label](references/forms.md#label) | Form label with required marker and colon. |
| [multi-combobox](references/forms.md#multi-combobox) | Select several predefined options from a filterable list and display selections as tokens. |
| [multi-input](references/forms.md#multi-input) | Collect several values as caller-managed tokens, with suggestions and optional value help. |
| [radio-group](references/forms.md#radio-group) | Fiori radio buttons in a group with roving tabindex; arrow keys move selection, value and read-only states. |
| [rating-indicator](references/forms.md#rating-indicator) | Fiori rating indicator: stars with half values, sizes S/M/L, read-only/display-only, UI5 keyboard model (ui5-rating-indicator). |
| [select](references/forms.md#select) | Choose one value from a short predefined list without entering free text. |
| [slider](references/forms.md#slider) | Fiori Slider and RangeSlider: tickmarks with labels, tooltips, UI5 keyboard model (ui5-slider, ui5-range-slider). |
| [step-input](references/forms.md#step-input) | Fiori numeric field with decrement/increment buttons, min/max clamping, precision and the SAP keyboard model. |
| [switch](references/forms.md#switch) | Fiori switch: icon, textual (on/off text) and graphical (semantic) designs, read-only state. |
| [textarea](references/forms.md#textarea) | Fiori multi-line text field with rows, growing, character counter and value states. |
| [token](references/forms.md#token) | Fiori token: a selectable, deletable value chip used by Tokenizer, MultiInput and MultiComboBox. |
| [tokenizer](references/forms.md#tokenizer) | Fiori tokenizer: a keyboard-navigable token list that collapses into an "n more" link with a popover of all tokens. |

### Dates

| Item | Summary |
| --- | --- |
| [calendar](references/dates.md#calendar) | Fiori calendar: day / month / year / year-range pickers, single, multiple or range selection, week numbers, special days and legend, the SAP keyboard model. Gregorian, Intl-based. |
| [date-picker](references/dates.md#date-picker) | Fiori date picker: a date field with lenient parsing, value states and a calendar value help. |
| [date-range-picker](references/dates.md#date-range-picker) | Fiori date range picker: a start - end field with a range-selecting calendar. |
| [date-time-picker](references/dates.md#date-time-picker) | Fiori date-time picker: calendar and clocks side by side with OK / Cancel. |
| [picker-field](references/dates.md#picker-field) | Shared field + value-help popover of the Fiori date and time pickers (value states, F4 / Alt+Arrow keys). |
| [time-picker](references/dates.md#time-picker) | Fiori time picker: a time field with the clock-dial time selection (hours, minutes, seconds, AM/PM). |

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
| [adapt-filters-dialog](references/overlays.md#adapt-filters-dialog) | OpenUI5 Adapt Filters personalization: transactional filter values, visibility and order, List/Group views, search, Reset and keyboard reordering. |
| [dialog](references/overlays.md#dialog) | Fiori modal dialog with header/footer bars and Negative/Critical/Positive/Information states (ui5-dialog). |
| [menu](references/overlays.md#menu) | Fiori menu with single/multiple checkable groups, icons, additional text, submenus, separators and disabled items (ui5-menu). |
| [popover](references/overlays.md#popover) | Fiori popover with arrow, optional header/footer bars and padded content (ui5-popover). |
| [responsive-popover](references/overlays.md#responsive-popover) | UI5 responsive popover: desktop popover, full-screen phone dialog with header and footer slots. |
| [toast](references/overlays.md#toast) | Fiori toast: auto-dismisses after its duration, pauses on hover/focus, nine placements (ui5-toast). |
| [use-is-phone](references/overlays.md#use-is-phone) | Reactive UI5-style touch/phone detection with a data-fiori-device override. |
| [user-menu](references/overlays.md#user-menu) | Fiori user menu popover with account header, manage account, menu items and sign out (ui5-user-menu). |
| [value-help-dialog](references/overlays.md#value-help-dialog) | Find business values through a searchable result table or define filter conditions in a dialog. |
| [view-settings-dialog](references/overlays.md#view-settings-dialog) | Fiori view settings dialog: sort/filter/group pages, two-level filter navigation with counters, Reset, OK/Cancel (ui5-view-settings-dialog). |

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
| [link](references/display.md#link) | Fiori link: Default, Subtle and Emphasized designs, wrapping, Enter/Space activation. |
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
| [bar](references/navigation.md#bar) | Fiori bar (header, subheader, footer, floating footer) with start, middle and end content. |
| [breadcrumbs](references/navigation.md#breadcrumbs) | Fiori breadcrumbs with responsive leading overflow, UI5 separator styles and arrow-key navigation. |
| [f6-navigation](references/navigation.md#f6-navigation) | Opt-in UI5 fast navigation between page groups, with scoped roots, Popup containers, shadows and slots. |
| [filter-bar](references/navigation.md#filter-bar) | Fiori filter bar with declarative condition editors, built-in Adapt Filters personalization, ordered visibility, live search, required-field validation and SAPUI5 active-filter summaries. |
| [notification-list](references/navigation.md#notification-list) | Fiori notifications with state icons, read/unread, importance, actions menu, close button, More/Less and collapsible groups with button or scroll growing (ui5-notification-list). |
| [product-switch](references/navigation.md#product-switch) | Fiori grid of product tiles with grid keyboard navigation, shown in a popover from the shell bar (ui5-product-switch). |
| [search](references/navigation.md#search) | Fiori search field with scope select, type-ahead and suggestions, plus the collapsible ShellBarSearch (ui5-search, ui5-shellbar-search). |
| [shell-bar](references/navigation.md#shell-bar) | Fiori application header with branding, content, collapsible search, notifications, custom items, overflow, profile and product switch (ui5-shellbar). |
| [side-navigation](references/navigation.md#side-navigation) | Fiori side navigation: groups, items and sub-items as a keyboard tree; collapsed icon mode with sub-item popovers and a height-aware overflow menu; fixed footer items (ui5-side-navigation). |
| [tabs](references/navigation.md#tabs) | Fiori IconTabBar / TabContainer: text and icon tabs, counts, semantic designs, responsive overflow, UI5 keyboard model. |
| [toolbar](references/navigation.md#toolbar) | Fiori toolbar with priority-based overflow, stable arbitrary items, spacers, separators and UI5 arrow-key navigation. |
| [variant-management](references/navigation.md#variant-management) | OpenUI5-compatible view selection, Save View and Manage Views with application-owned persistence. |
| [variants](references/navigation.md#variants) | Controlled FilterBar view state, Save/Save As and Manage operations, default views and an optional localStorage persistence adapter. |
| [wizard](references/navigation.md#wizard) | Fiori wizard: step tabs (number or icon, title, subtitle, separators) over scrolling step contents; keyboard tab navigation, scroll-to-step, disabled future steps, collapsed step stacks (ui5-wizard). |

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
