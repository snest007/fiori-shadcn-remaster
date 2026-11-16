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
| [avatar](references/display.md#avatar) | Fiori avatar (XS–XL, circle/square, initials/icon/image, accent colours, interactive) and AvatarGroup. |
| [busy-indicator](references/display.md#busy-indicator) | Fiori busy indicator (three pulsing dots) with delay, text and content overlay. |
| [card](references/display.md#card) | Fiori card with CardHeader (title, subtitle, status text, avatar, action, interactive) and CardContent. |
| [carousel](references/display.md#carousel) | Fiori carousel: items per page by container width, arrows over the content or beside the page indicator, dots or numeric indicator, cyclic navigation, swipe, the SAP keyboard model (ui5-carousel). |
| [expandable-text](references/display.md#expandable-text) | Fiori expandable text: text cut at a character limit with Show More / Show Less, in place or in a popover (ui5-expandable-text). |
| [hero-banner](references/display.md#hero-banner) | Fiori hero banner: overline, heading, actions and one or two content columns on the Horizon hero background (ui5-hero-banner). |
| [illustrated-message](references/display.md#illustrated-message) | Fiori illustrated message: illustration + title + subtitle + actions in the Scene / Dialog / Spot / Dot / Base designs, auto-sized by the container (ui5-illustrated-message). Ships with @fiori/illustrations-core (NoData, NoSearchResults, UnableToLoad, Tent, …); add more with @fiori/illustration-<name> or @fiori/illustration-tnt-<name>. |
| [link](references/display.md#link) | Fiori link: Default, Subtle and Emphasized designs, wrapping, Enter/Space activation. |
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
