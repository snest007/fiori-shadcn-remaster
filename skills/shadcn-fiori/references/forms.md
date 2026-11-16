# Forms

## checkbox

Fiori check box with indeterminate, read-only and value states; Space/Enter toggle.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Checkbox`.

```bash
npx shadcn add @fiori/checkbox
```

## color-palette

Fiori predefined color palette with the UI5 five-column keyboard model, default color and local recent colors.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ColorPalette`, `ColorPaletteItem`, `ColorPaletteStateContext`, `ColorPaletteStateProvider`.

```bash
npx shadcn add @fiori/color-palette
```

## color-palette-popover

Fiori color palette popover with external opener, selection dismissal and persistent local palette history.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `ColorPalettePopover`.

```bash
npx shadcn add @fiori/color-palette-popover
```

## color-picker

Fiori color picker with hue, alpha, hexadecimal and RGB/HSL channel inputs.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

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

Fiori file uploader: input-styled field with browse/clear icons, multiple files, accept, max size, drag & drop (ui5-file-uploader). Upload transport is up to the caller.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `FileUploader`.

```bash
npx shadcn add @fiori/file-uploader
```

## form

Fiori form (ui5-form): responsive label/field layout with columns per size range, labelSpan / emptySpan, groups, display (definition list) and edit modes.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Form`, `FormGroup`, `FormItem`.

```bash
npx shadcn add @fiori/form
```

## input

Fiori input with value states and value state message.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Input`, `InputIcon`, `valueStateDefaultText`, `valueStateIcons`.

```bash
npx shadcn add @fiori/input
```

## label

Form label with required marker and colon.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

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

Fiori radio buttons in a group with roving tabindex; arrow keys move selection, value and read-only states.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `RadioGroup`, `RadioGroupItem`.

```bash
npx shadcn add @fiori/radio-group
```

## rating-indicator

Fiori rating indicator: stars with half values, sizes S/M/L, read-only/display-only, UI5 keyboard model (ui5-rating-indicator).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

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

Fiori Slider and RangeSlider: tickmarks with labels, tooltips, UI5 keyboard model (ui5-slider, ui5-range-slider).

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `RangeSlider`, `Slider`, `isSliderHandlePressed`, `sliderValueAt`.

```bash
npx shadcn add @fiori/slider
```

## step-input

Fiori numeric field with decrement/increment buttons, min/max clamping, precision and the SAP keyboard model.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `StepInput`.

```bash
npx shadcn add @fiori/step-input
```

## switch

Fiori switch: icon, textual (on/off text) and graphical (semantic) designs, read-only state.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Switch`.

```bash
npx shadcn add @fiori/switch
```

## textarea

Fiori multi-line text field with rows, growing, character counter and value states.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `TextArea`.

```bash
npx shadcn add @fiori/textarea
```

## token

Fiori token: a selectable, deletable value chip used by Tokenizer, MultiInput and MultiComboBox.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Token`.

```bash
npx shadcn add @fiori/token
```

## tokenizer

Fiori tokenizer: a keyboard-navigable token list that collapses into an "n more" link with a popover of all tokens.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `Tokenizer`.

```bash
npx shadcn add @fiori/tokenizer
```
