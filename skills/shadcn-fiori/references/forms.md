# Forms

## checkbox

Select independent options, including choices reviewed before submission.

### Use when

- Let users select or deselect independent options or accept an unambiguous statement.
- Keep all options visible when users need to compare them before choosing.
- Collect changes that users review and confirm before submission.
- Use checked="indeterminate" for a parent option when only some child options are selected.

### Don't use when

- Apply an on/off setting immediately. → [switch](forms.md#switch)
- Choose exactly one answer from a visible set. → [radio-group](forms.md#radio-group)
- Activate or deactivate a secondary toolbar feature. → [toggle-button](actions.md#toggle-button)
- Run an explicit action rather than select an option. → [button](actions.md#button)
- Adjust a numeric value along a visual scale rather than choose categorical options. → [slider](forms.md#slider)

Main exports: `Checkbox`.

```bash
npx shadcn add @fiori/checkbox
```

## color-palette

Choose a predefined color from swatches kept visible in the page.

### Use when

- Let users choose from predefined colors while keeping the swatches visible.
- Keep each swatch tied to its fixed color rather than changing it with the theme.
- Enable showDefaultColor, showRecentColors or showMoreColors only when those choices are allowed.

### Don't use when

- Show predefined colors only after opening a contextual chooser. → [color-palette-popover](forms.md#color-palette-popover)
- Choose an arbitrary color or enter its channel values directly. → [color-picker](forms.md#color-picker)

Main exports: `ColorPalette`, `ColorPaletteItem`, `ColorPaletteStateContext`, `ColorPaletteStateProvider`.

```bash
npx shadcn add @fiori/color-palette
```

## color-palette-popover

Choose a predefined color in an on-demand anchored surface.

### Use when

- Let users open a contextual chooser to select a predefined color.
- Keep the swatches near the opener while preserving space in the page.
- Enable showMoreColors when users may choose a color outside the supplied palette.

### Don't use when

- Keep predefined color swatches visible without opening a surface. → [color-palette](forms.md#color-palette)
- Work directly with arbitrary colors or channel values rather than start from swatches. → [color-picker](forms.md#color-picker)

Main exports: `ColorPalettePopover`.

```bash
npx shadcn add @fiori/color-palette-popover
```

## color-picker

Choose an arbitrary color visually or enter its channel values.

### Use when

- Let users choose a color beyond a predefined set of swatches.
- Support visual selection and direct hexadecimal, RGB or HSL channel entry.
- Use simplified when users need only visual selection and hexadecimal entry.

### Don't use when

- Choose only predefined colors that stay visible in the page. → [color-palette](forms.md#color-palette)
- Choose predefined colors in an on-demand anchored chooser. → [color-palette-popover](forms.md#color-palette-popover)

Main exports: `ColorPicker`, `ColorPickerStateProvider`.

```bash
npx shadcn add @fiori/color-picker
```

## combobox

Choose one suggested value by typing, with filtering and optional free-text entry.

### Use when

- Narrow a single-value choice by typing; choose the filter strategy for the supplied ComboBoxItem entries.
- Accept a custom value as well as suggestions; handle committed text with onCommit.
- Use onSelectionChange to distinguish a matched item from free text, which reports null.

### Don't use when

- Require one short predefined choice and disallow free-text entry. → [select](forms.md#select)
- Select multiple predefined options. → [multi-combobox](forms.md#multi-combobox)
- Create several free-form or caller-validated tokens. → [multi-input](forms.md#multi-input)
- Find a business value through several searchable attributes or enter conditions. → [value-help-dialog](overlays.md#value-help-dialog)

Main exports: `ComboBox`, `ComboBoxItem`, `ComboBoxItemGroup`.

```bash
npx shadcn add @fiori/combobox
```

## file-uploader

Select local files for a caller-managed upload flow.

### Use when

- Let users choose a local file, or drop files into a field, for upload.
- Prefer it for single-file selection; let the application perform the upload and report its outcome.
- Use accept to filter the native chooser and maxFileSize to reject oversized selections; validate file types, including dropped files, in the caller.

### Don't use when

- Manage an existing collection with individual deletion, upload status and retry actions. → [upload-collection](data.md#upload-collection)
- Run an action unrelated to selecting files. → [button](actions.md#button)

Main exports: `FileUploader`.

```bash
npx shadcn add @fiori/file-uploader
```

## form

Arrange related labels and fields for one record in responsive groups.

### Use when

- Let users inspect or edit related fields of one record in a consistent layout.
- Group fields by meaning and keep their labels aligned as available width changes.
- Use accessibleMode="edit" for editable fields; the default display mode presents label-value pairs.

### Don't use when

- Compare repeated records in rows rather than fields of one record. → [table](data.md#table), [data-table](data.md#data-table)
- Guide users through 3–8 steps: use Wizard within an existing page or Wizard Page for a complete creation page. → [wizard](navigation.md#wizard), [wizard-page](floorplans.md#wizard-page)
- Submit or validate data automatically; provide caller-owned submission and validation.

Main exports: `Form`, `FormGroup`, `FormItem`.

```bash
npx shadcn add @fiori/form
```

## input

Enter one line of text, a number or a formatted string.

### Use when

- Let users enter a name, number, password, URL, phone number or email address in one line.
- Keep a visible field label; use a placeholder only for a hint or example.
- Use valueState and valueStateMessage to explain validation issues and how to resolve them.

### Don't use when

- Enter prose across multiple lines. → [textarea](forms.md#textarea)
- Enter a date, range or time, or provide a custom picker with caller-owned parsing. → [date-picker](dates.md#date-picker), [date-range-picker](dates.md#date-range-picker), [date-time-picker](dates.md#date-time-picker), [time-picker](dates.md#time-picker), [picker-field](dates.md#picker-field)
- Choose one predefined value: use Select for 2–12 options, ComboBox for type-ahead across 20–200 options, or ValueHelpDialog above 200 entries or for several searchable attributes. → [select](forms.md#select), [combobox](forms.md#combobox), [value-help-dialog](overlays.md#value-help-dialog)
- Adjust a numeric value with increment and decrement buttons or a visual scale. → [step-input](forms.md#step-input), [slider](forms.md#slider)
- Collect several values: use MultiComboBox for fewer than 200 predefined options, or MultiInput for caller-validated entries and datasets above 200. → [multi-combobox](forms.md#multi-combobox), [multi-input](forms.md#multi-input)

Main exports: `Input`, `InputIcon`, `valueStateDefaultText`, `valueStateIcons`.

```bash
npx shadcn add @fiori/input
```

## label

Give a form field a persistent, accessible name.

### Use when

- Let users identify a field before entering or selecting its value.
- Keep the label visible while the field contains data; a placeholder does not replace it.
- Connect htmlFor to the field id and use required to show a required-field marker.

### Don't use when

- Present prose that does not name a field. → [text](display.md#text)
- Introduce a page, section or group heading. → [title](display.md#title)

Main exports: `Label`.

```bash
npx shadcn add @fiori/label
```

## multi-combobox

Select several predefined options from a filterable list and display selections as tokens.

### Use when

- Choose multiple supplied MultiComboBoxItem values while typing narrows the list.
- Control selectedValues and onSelectionChange separately from the typed value.
- Offer showSelectAll when selecting the whole option set is useful; keep the default validation when entries must match supplied items.

### Don't use when

- Choose just one value. → [select](forms.md#select), [combobox](forms.md#combobox)
- Create arbitrary or application-validated tokens; noValidation permits unmatched text but does not turn it into a selected option. → [multi-input](forms.md#multi-input)
- Search a large business dataset by several attributes or define ranges and conditions. → [value-help-dialog](overlays.md#value-help-dialog)

Main exports: `MultiComboBox`, `MultiComboBoxItem`, `MultiComboBoxItemGroup`.

```bash
npx shadcn add @fiori/multi-combobox
```

## multi-input

Collect several values as caller-managed tokens, with suggestions and optional value help.

### Use when

- Accept multiple free-form or application-validated entries; create tokens in onCommit and supply them through tokens.
- Suggest values with SuggestionItem; set filter when the component should narrow the supplied suggestions.
- Remove caller-managed tokens in onTokenDelete, and connect showValueHelpIcon and onValueHelpTrigger to a separate selection surface.

### Don't use when

- Select only from a predefined option set and let the control manage selected option tokens. → [multi-combobox](forms.md#multi-combobox)
- Collect one value without tokens. → [input](forms.md#input), [combobox](forms.md#combobox)
- Provide the actual multiattribute search or condition editor; the value-help callback only opens a surface supplied by the caller. → [value-help-dialog](overlays.md#value-help-dialog)

Main exports: `MultiInput`, `SuggestionItem`.

```bash
npx shadcn add @fiori/multi-input
```

## radio-group

Choose one mutually exclusive answer while keeping every option visible.

### Use when

- Let users compare visible answers and select exactly one.
- Keep option labels clear enough to distinguish the mutually exclusive choices.
- Provide an accessible group name and a label for every RadioGroupItem.

### Don't use when

- Select independent options or multiple answers. → [checkbox](forms.md#checkbox)
- Collapse a predefined list of 2–12 options instead of showing every answer. → [select](forms.md#select)
- Switch compact related view or setting options rather than answer a form question. → [segmented-button](actions.md#segmented-button)
- Run an explicit action rather than select an answer. → [button](actions.md#button)
- Adjust a numeric value along a visual scale rather than choose categorical options. → [slider](forms.md#slider)

Main exports: `RadioGroup`, `RadioGroupItem`.

```bash
npx shadcn add @fiori/radio-group
```

## rating-indicator

Collect an icon-based rating or display an aggregate rating.

### Use when

- Let users evaluate an item with a row of rating icons.
- Show an average or overall rating without editing it using displayOnly.
- Name the rating subject clearly so users understand what they are evaluating.

### Don't use when

- Adjust a numeric setting along a continuous or stepped range. → [slider](forms.md#slider)

Main exports: `RatingIndicator`.

```bash
npx shadcn add @fiori/rating-indicator
```

## select

Choose one value from a short predefined list without entering free text.

### Use when

- Offer a short set of mutually exclusive choices whose option labels are sufficient.
- Keep choices collapsed until needed in a form, table or toolbar.
- Provide a useful initial choice with defaultValue, or control the selected value with value and onValueChange.

### Don't use when

- Type to narrow a longer list or accept a value outside the supplied options. → [combobox](forms.md#combobox)
- Select several predefined values. → [multi-combobox](forms.md#multi-combobox)
- Enter multiple caller-validated values or create tokens from suggestions. → [multi-input](forms.md#multi-input)
- Search across business keys and descriptions or define filter conditions. → [value-help-dialog](overlays.md#value-help-dialog)
- Keep every single-choice option visible at once. → [radio-group](forms.md#radio-group)

Main exports: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectSeparator`, `SelectTrigger`, `SelectValue`.

```bash
npx shadcn add @fiori/select
```

## slider

Adjust one value or a numeric interval along a visual scale.

### Use when

- Let users adjust settings such as volume or brightness without typing an exact number.
- Use Slider for one value and RangeSlider for lower and upper bounds.
- Show the current value, unit and scale bounds so the adjustment has a clear meaning.
- Set min, max and step to the valid range and required precision; use showTooltip for handle values.

### Don't use when

- Enter an exact quantity using explicit increment and decrement controls. → [step-input](forms.md#step-input)
- Enter a number without needing a visual scale. → [input](forms.md#input)
- Choose categorical answers rather than a numeric value. → [radio-group](forms.md#radio-group), [checkbox](forms.md#checkbox)
- Give an icon-based evaluation such as a star rating. → [rating-indicator](forms.md#rating-indicator)

Main exports: `RangeSlider`, `Slider`, `isSliderHandlePressed`, `sliderValueAt`.

```bash
npx shadcn add @fiori/slider
```

## step-input

Enter an exact number or adjust it by a predefined step.

### Use when

- Let users enter a quantity precisely or increase and decrease it in predictable increments.
- Support direct number entry as well as the step buttons and keyboard.
- Set min, max, step and valuePrecision to match valid business quantities.

### Don't use when

- Adjust a value approximately along a visual range, such as volume or brightness. → [slider](forms.md#slider)
- Enter a number without increment and decrement controls. → [input](forms.md#input)

Main exports: `StepInput`.

```bash
npx shadcn add @fiori/step-input
```

## switch

Turn a setting on or off with an immediate effect.

### Use when

- Let users turn a setting on or off and see the change take effect immediately.
- Place a descriptive label above or before the switch so both states have a clear meaning.
- Prefer the default icons over text inside the track to avoid localization problems.

### Don't use when

- Review settings before submission, select independent options or express an ambiguous on/off statement. → [checkbox](forms.md#checkbox)
- Activate or deactivate a secondary toolbar feature. → [toggle-button](actions.md#toggle-button)

Main exports: `Switch`.

```bash
npx shadcn add @fiori/switch
```

## textarea

Enter editable prose across multiple lines.

### Use when

- Let users write comments, descriptions or other text that needs multiple lines.
- Keep a visible label and enough visible rows to understand the text being edited.
- Use growing and growingMaxRows for expansion, or maxLength with counterMode when a character limit matters.

### Don't use when

- Enter a value that fits on one line. → [input](forms.md#input)
- Read prose that is already fully visible and cannot be edited. → [text](display.md#text)
- Read prose with an in-place option to reveal more text. → [expandable-text](display.md#expandable-text)

Main exports: `TextArea`.

```bash
npx shadcn add @fiori/textarea
```

## token

Represent one previously selected value as a selectable, removable item.

### Use when

- Let users recognize and remove a value they have already selected.
- Keep each token label concise and specific to the selected value.
- Use readOnly when the selected value must remain visible without a delete action.

### Don't use when

- Navigate, select or delete a group of selected values with overflow handling. → [tokenizer](forms.md#tokenizer)
- Show a category or status label that is not a removable selection. → [tag](display.md#tag)

Main exports: `Token`.

```bash
npx shadcn add @fiori/token
```

## tokenizer

Manage keyboard navigation, selection and overflow for existing tokens.

### Use when

- Let users inspect, select and remove a group of values already represented by tokens.
- Keep overflowed values reachable through the more-items indicator.
- Remove caller-owned tokens in onTokenDelete after users request deletion.

### Don't use when

- Enter new free-form or caller-validated values with optional suggestions. → [multi-input](forms.md#multi-input)
- Add values from a predefined filterable option list. → [multi-combobox](forms.md#multi-combobox)
- Show only one independently managed selected value. → [token](forms.md#token)

Main exports: `Tokenizer`.

```bash
npx shadcn add @fiori/tokenizer
```
