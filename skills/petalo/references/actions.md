# Actions

| Item | Summary |
| --- | --- |
| [button](#button) | Trigger an explicit action with priority and semantic intent. |
| [segmented-button](#segmented-button) | Switch related view or setting options in a connected group. |
| [toggle-button](#toggle-button) | Keep a secondary toolbar action visibly on or off. |

## button

Trigger an explicit action with priority and semantic intent.

### Use when

- Let users create, edit, save, approve or cancel an explicit action.
- Reserve variant="emphasized" for one primary action per page or dialog; use positive and negative only for positive and negative semantic actions.
- Use imperative verb labels such as Save or Reject; allow up to 300% text expansion in translations.
- Keep primary, secondary, semantic and negative-path actions as text buttons.
- Give recognizable icon-only actions both a tooltip and an accessible label.

### Don't use when

- Navigate to a page, object or external URL. → [link](display.md#link)
- Keep an action visibly active until the user turns it off. → [toggle-button](actions.md#toggle-button)
- Choose related view options, one form option or independent form options. → [segmented-button](actions.md#segmented-button), [radio-group](forms.md#radio-group), [checkbox](forms.md#checkbox)
- Select local files for upload. → [file-uploader](forms.md#file-uploader)
- Navigate through a guided sequence of task steps. → [wizard](navigation.md#wizard)

Main exports: `Button`.

```bash
npx shadcn add @petalo/button
```

## segmented-button

Switch related view or setting options in a connected group.

### Use when

- Let users switch related options such as Year, Month and Day within the same view.
- Keep every segment visible and use labels that fit the available horizontal space.
- Use selectionMode="multiple" when users may activate any combination of segments; use single for one selection.
- Give each icon-only segment a tooltip and an accessible label.

### Don't use when

- Present mutually exclusive form answers rather than change a view or setting. → [radio-group](forms.md#radio-group)
- Collapse 2–12 predefined options whose labels do not fit a horizontal group; sort alphabetically above 8. → [select](forms.md#select)
- Navigate distinct content sections rather than change the current view or setting. → [tabs](navigation.md#tabs)
- Activate or deactivate one independent toolbar action. → [toggle-button](actions.md#toggle-button)
- Run an explicit action such as Save rather than select an option. → [button](actions.md#button)

Main exports: `SegmentedButton`, `SegmentedButtonItem`.

```bash
npx shadcn add @petalo/segmented-button
```

## toggle-button

Keep a secondary toolbar action visibly on or off.

### Use when

- Let users activate or deactivate a toolbar feature such as bold formatting.
- Keep the same label and icon in both states; the pressed state communicates activation.
- Give icon-only toggles a tooltip and an accessible label.

### Don't use when

- Trigger an activity or process such as Create, Edit or Save. → [button](actions.md#button)
- Apply an on/off form setting immediately. → [switch](forms.md#switch)
- Review an independent option before submitting it. → [checkbox](forms.md#checkbox)
- Choose related options within the same view or setting. → [segmented-button](actions.md#segmented-button)

Main exports: `ToggleButton`.

```bash
npx shadcn add @petalo/toggle-button
```
