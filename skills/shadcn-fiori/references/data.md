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

Fiori object identifier and object attribute (sap.m look): bold title (optionally a link) with secondary text; "Title: value" attributes.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ObjectAttribute`, `ObjectIdentifier`.

```bash
npx shadcn add @fiori/object-identifier
```

## object-number

Fiori object number (sap.m.ObjectNumber look): emphasized number with unit, semantic states, inverted badge, large and active variants.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ObjectNumber`.

```bash
npx shadcn add @fiori/object-number
```

## object-status

Fiori object status (sap.m.ObjectStatus look): label, icon and text in a semantic or indication color; inverted badge, large and active variants.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

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

Fiori timeline: TimelineItem and collapsible TimelineGroupItem, vertical and horizontal layouts, value-state icons, Load More / scroll growing, the SAP keyboard model (ui5-timeline).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

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

Fiori upload collection: file list with thumbnails, progress and Complete/Error/Ready/Uploading states, retry/terminate/delete, drag & drop overlay (ui5-upload-collection). Upload transport is up to the caller.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `UploadCollection`, `UploadCollectionItem`.

```bash
npx shadcn add @fiori/upload-collection
```
