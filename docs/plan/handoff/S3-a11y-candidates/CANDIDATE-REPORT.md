# S3 accessibility candidates (unapplied)

These patches are proposals for E4. S3 changes no component behavior. Evidence was reproduced with installed UI5 Web Components 2.28.1 (the repository’s 2.28 line) in Morning Horizon and High Contrast Black. Raw source, DOM, accessibility-tree and axe records are retained in `.integration/S3-evidence/`.

## Menu desktop popup semantics

The portalled, non-modal Menu stories raise axe `region` at the sole `div[data-radix-popper-content-wrapper]`: the `role=menu` surface is directly under body, with no surrounding dialog/landmark. The existing `/index.html#/menu` demo confirms the same component DOM structure; its default modal mode hides the underlying page, while the Storybook non-modal state leaves the document landmarks present. The component exposes the modal prop, so this is a supported component state.

UI5’s real `menu-direction-explicit-ltr` fixture opens a named `role=dialog` surface around `role=menu`, with the English name “Select an option from the menu”. UI5 does not have this popup-semantics omission. Owning sources: `@ui5/webcomponents/dist/MenuTemplate.js` (`ResponsivePopover` and `accessibleNameText`), `Menu.js` (`accessibleNameText` / `MENU_POPOVER_ACCESSIBLE_NAME`), and `PopupTemplate.js` (outer `section` role/name).

`menu-popup-dialog-semantics.patch` proposes a named desktop wrapper while retaining the menu roles, checks and keyboard code. Its new popup label is overridable. It is deliberately unapplied; E4 must validate accessible tree, focus bounds, layout and submenus before using it. The S3 `region` markers only cover the exact story IDs and single owned root popper, not nested or extra surfaces. Proof: a full-page axe check on `overlays-menu--open`, then Enter → ArrowDown → Enter must preserve action activation and focus restoration.

## ViewSettingsDialog mode selector has no accessible name

Every required open state with multiple configured modes contains `.fiori-vsd__sub-header > [data-slot=segmented-button][role=listbox]` with no `aria-label` / `aria-labelledby`. Its options are named, but the listbox is not. This raises axe `aria-input-field-name` and the independent `expectNamedControls` assertion. It reproduces on `/index.html#/view-settings-dialog` after opening the existing demo.

UI5 has the same defect: `ViewSettingsDialogTemplateHeader` passes no accessible name to its internal SegmentedButton, and `SegmentedButtonTemplate` emits an unnamed listbox. The UI5 `view-settings-dialog-sort` fixture also raises `aria-input-field-name`. Other UI5 fixture warnings are recorded but are unrelated to this candidate.

`view-settings-dialog-mode-name.patch` proposes `aria-label={t.title}` on the internal SegmentedButton. It uses the existing overridable `texts.title`; no new string or public API is needed. E4 must run an axe/name assertion plus the current mode-switch, cancellation and focus tests.

The S3 axe marker matches only this single unnamed component-owned listbox in enumerated multi-mode stories, with exact role/orientation/options checks. The existing `tests-storybook/accessibility.ts` name assertion has no known-issue hook. S3 is forbidden from editing that helper or altering internal ARIA in a story, so the independent named-control check remains a reported acceptance blocker. No required story is omitted and no named-control assertion is weakened.
