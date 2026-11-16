# Data

## data-table

Render data-driven responsive tables with TanStack columns, sorting and optional row virtualization.

### Use when

- Define repeated business rows with data and columns; provide getRowId when selection needs stable keys.
- Offer column sorting with sortTrigger="menu" or "click" and control it with sorting and onSortingChange when needed.
- Render a large flat row set with virtualize, a fixed rowHeight and virtualHeight; use overflowMode="popin" for narrower screens.

### Don't use when

- Compose a small table directly from custom JSX rows and cells without data-driven sorting. → [table](data.md#table)
- Show a simple sequence of items with only a few attributes. → [list](data.md#list)
- Expand and collapse a parent-child hierarchy; this wrapper renders flat rows. → [tree](data.md#tree)
- Collect fields for one object rather than compare repeated records. → [form](forms.md#form)

Main exports: `DataTable`, `createDataTableColumnHelper`, `defaultDataTableTexts`.

```bash
npx shadcn add @fiori/data-table
```

## list

Present a sequence of business items for browsing, navigation or selection without column comparison.

### Use when

- Show a few attributes per item with ListItemStandard, or compose custom item content with ListItemCustom.
- Group a flat collection with ListItemGroup instead of adding expandable hierarchy.
- Enable selectionMode="single" or "multiple" for item choice; use growing="button" or "scroll" with onLoadMore to request more items.

### Don't use when

- Compare several attributes across aligned columns. → [table](data.md#table), [data-table](data.md#data-table)
- Browse nested parent-child relationships that users must expand or collapse. → [tree](data.md#tree)
- Choose one value from a short list inside a field. → [select](forms.md#select)
- Type to narrow a single-value choice or enter a new value. → [combobox](forms.md#combobox)

Main exports: `AdditionalText`, `List`, `ListCoreContext`, `ListItem`, `ListItemCustom`, `ListItemGroup`, `ListItemGroupHeader`, `ListItemStandard`, `SelectionElement`, `handleNavigationKey`, `isSingle`, `navItems`, `useListCoreValue`, `useListItemBehaviour`.

```bash
npx shadcn add @fiori/list
```

## object-identifier

Identify a business object with a primary title and supporting identifier or attributes.

### Use when

- Help users distinguish a specific business object by its name and supporting identifier.
- Keep the primary identifier visible in the first table column; use ObjectAttribute for supporting title-and-value details.
- Use titleActive with titleHref or onTitlePress when the primary identity navigates to object details.

### Don't use when

- Provide a single navigation label without a supporting object identifier. → [link](display.md#link)
- Name a page or section with heading semantics rather than identify a business object. → [title](display.md#title)

Main exports: `ObjectAttribute`, `ObjectIdentifier`.

```bash
npx shadcn add @fiori/object-identifier
```

## object-number

Display a business amount or quantity together with its unit and optional semantic state.

### Use when

- Help users read and compare business amounts or quantities without separating their units.
- Keep the unit beside the amount unless every row shares it, each cell contains one amount, and the column header stays visible.
- Use emphasized for the most important number; set emphasized={false} when all numbers are equally important.

### Don't use when

- Describe an object state in words or with an icon rather than an amount. → [object-status](data.md#object-status)
- Show how much of a running process is complete on a 0–100% scale. → [progress-indicator](display.md#progress-indicator)

Main exports: `ObjectNumber`.

```bash
npx shadcn add @fiori/object-number
```

## object-status

Show the semantic state of a business object with status text and an optional icon.

### Use when

- Help users assess the state of an item, process or workflow at a glance.
- Keep status text next to the business object it describes, including in table cells and list items.
- Use state for semantic meaning, and active when pressing the status opens related details.

### Don't use when

- Highlight a category or condition as a compact enclosed marker rather than a labeled object state. → [tag](display.md#tag)
- Show a business amount or quantity with its unit rather than a textual state. → [object-number](data.md#object-number)
- Explain a warning or status change that applies to a page or section. → [message-strip](display.md#message-strip)

Main exports: `ObjectStatus`.

```bash
npx shadcn add @fiori/object-status
```

## table

Compose responsive rows and cells when users compare and act on business items.

### Use when

- Show several attributes per item and keep related values aligned under column headers.
- Compose custom cell controls with TableRow and TableCell; use overflowMode="popin" to move secondary columns below each row on narrow screens.
- Enable selectionMode="single" or "multi" for item actions, and use growing="button" or "scroll" with onLoadMore for incremental loading.

### Don't use when

- Generate columns from data, offer built-in sorting, or render a large row set with virtualization. → [data-table](data.md#data-table)
- Show a few attributes per item without comparing columns. → [list](data.md#list)
- Expose expandable parent-child relationships. → [tree](data.md#tree)
- Choose one value from a short predefined list without showing row details. → [select](forms.md#select)
- Collect fields for editing one object rather than comparing independent items. → [form](forms.md#form)

Main exports: `Table`, `TableCell`, `TableGroupRow`, `TableHeaderCell`, `TableHeaderRow`, `TableRow`, `TableRowAction`, `TableRowActionNavigation`, `defaultTableTexts`.

```bash
npx shadcn add @fiori/table
```

## timeline

Present object events and changes in chronological order.

### Use when

- Help users review when an object changed or an event occurred.
- Show read-only system events or recorded posts with names, timestamps and optional collapsible groups.
- Use growing="Button" or "Scroll" with onLoadMore when users need to retrieve further entries.

### Don't use when

- Browse independent items whose order is not a chronology. → [list](data.md#list)
- Compare event attributes in columns or sort a data-driven history. → [data-table](data.md#data-table)

Main exports: `Timeline`, `TimelineGroupItem`, `TimelineItem`.

```bash
npx shadcn add @fiori/timeline
```

## tree

Browse or select hierarchical items through expandable parent-child nodes.

### Use when

- Expose a meaningful nested hierarchy that users need to expand and collapse.
- Allow one or several node selections with selectionMode="single" or "multiple".
- Handle expansion with onItemToggle; control a TreeItem with expanded and onExpandedChange when the application owns its state.

### Don't use when

- Present flat items or a collection with only group headers and one item level. → [list](data.md#list)
- Choose one value from a short nonhierarchical list. → [select](forms.md#select), [combobox](forms.md#combobox)
- Compare attributes of flat records in columns. → [table](data.md#table), [data-table](data.md#data-table)

Main exports: `Tree`, `TreeItem`, `TreeItemCustom`.

```bash
npx shadcn add @fiori/tree
```

## upload-collection

Manage prepared or uploaded files with per-file status and lifecycle actions.

### Use when

- Let users review a collection of attachments and remove, retry or terminate individual uploads.
- Use UploadCollectionItem uploadState and progress for per-file feedback; handle onDropFiles and upload transport in the application.
- Keep filenames, thumbnails and descriptive metadata together for files before or after upload.

### Don't use when

- Select local files for a form without showing or managing an attachment collection. → [file-uploader](forms.md#file-uploader)
- Inspect images or videos through thumbnails without upload lifecycle actions. → [media-gallery](display.md#media-gallery)

Main exports: `UploadCollection`, `UploadCollectionItem`.

```bash
npx shadcn add @fiori/upload-collection
```
