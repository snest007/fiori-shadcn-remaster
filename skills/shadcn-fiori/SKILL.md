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
| [object-identifier](references/data.md#object-identifier) | Fiori object identifier and object attribute (sap.m look): bold title (optionally a link) with secondary text; "Title: value" attributes. |
| [object-number](references/data.md#object-number) | Fiori object number (sap.m.ObjectNumber look): emphasized number with unit, semantic states, inverted badge, large and active variants. |
| [object-status](references/data.md#object-status) | Fiori object status (sap.m.ObjectStatus look): label, icon and text in a semantic or indication color; inverted badge, large and active variants. |
| [table](references/data.md#table) | Compose responsive rows and cells when users compare and act on business items. |
| [timeline](references/data.md#timeline) | Fiori timeline: TimelineItem and collapsible TimelineGroupItem, vertical and horizontal layouts, value-state icons, Load More / scroll growing, the SAP keyboard model (ui5-timeline). |
| [tree](references/data.md#tree) | Browse or select hierarchical items through expandable parent-child nodes. |
| [upload-collection](references/data.md#upload-collection) | Fiori upload collection: file list with thumbnails, progress and Complete/Error/Ready/Uploading states, retry/terminate/delete, drag & drop overlay (ui5-upload-collection). Upload transport is up to the caller. |

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
| [avatar](references/display.md#avatar) | Fiori avatar (XS–XL, circle/square, initials/icon/image, accent colours, interactive) and AvatarGroup. |
| [busy-indicator](references/display.md#busy-indicator) | Fiori busy indicator (three pulsing dots) with delay, text and content overlay. |
| [card](references/display.md#card) | Fiori card with CardHeader (title, subtitle, status text, avatar, action, interactive) and CardContent. |
| [carousel](references/display.md#carousel) | Fiori carousel: items per page by container width, arrows over the content or beside the page indicator, dots or numeric indicator, cyclic navigation, swipe, the SAP keyboard model (ui5-carousel). |
| [expandable-text](references/display.md#expandable-text) | Fiori expandable text: text cut at a character limit with Show More / Show Less, in place or in a popover (ui5-expandable-text). |
| [hero-banner](references/display.md#hero-banner) | Fiori hero banner: overline, heading, actions and one or two content columns on the Horizon hero background (ui5-hero-banner). |
| [illustrated-message](references/display.md#illustrated-message) | Fiori illustrated message: illustration + title + subtitle + actions in the Scene / Dialog / Spot / Dot / Base designs, auto-sized by the container (ui5-illustrated-message). Ships with @fiori/illustrations-core (NoData, NoSearchResults, UnableToLoad, Tent, …); add more with @fiori/illustration-<name> or @fiori/illustration-tnt-<name>. |
| [link](references/display.md#link) | Navigate through meaningful text to a page, anchor or external URL. |
| [media-gallery](references/display.md#media-gallery) | Fiori image and video gallery with measured thumbnail overflow, selectable items, keyboard navigation, responsive layouts, and a phone carousel (ui5-media-gallery). |
| [message-strip](references/display.md#message-strip) | Fiori message strip: information/positive/negative/critical and color-set designs, closable. |
| [panel](references/display.md#panel) | Fiori panel: expandable (animated) or fixed, header text or custom header. |
| [progress-indicator](references/display.md#progress-indicator) | Fiori progress indicator: value bar with value text, value states with icons (ui5-progress-indicator). |
| [tag](references/display.md#tag) | Fiori tag: semantic designs with state icons, Set1/Set2 colour schemes 1–10, sizes S/L, interactive. |
| [text](references/display.md#text) | Fiori body text with maxLines truncation. |
| [title](references/display.md#title) | Fiori heading with semantic level (H1–H6) independent of visual size. |

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
