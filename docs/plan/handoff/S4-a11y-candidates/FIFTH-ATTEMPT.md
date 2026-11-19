# S4 fifth-attempt accessibility handoff — 2026-11-19

All six patches in this directory are **unapplied candidates** for the component owner. S4 changes no
component, block, CSS, fixture or dependency source. 0001 (FCL) is unchanged. All six pass git apply --check;
that proves context applicability, not runtime, accessibility or pixel acceptance.

The evidence was collected headlessly outside Storybook as well as in the actual stories. Ordinary React
fixtures import the source components through the docs Vite server; real floorplans run on block.html with
unaltered default data. UI5 instances use the installed Web Components 2.28 reference. VariantManagement
uses the project's pinned OpenUI5 1.154.0, since Web Components has no equivalent VariantManagement.
No reproduction changes library/reference roles or removes announced text.

Local evidence directory: .integration/S4-evidence/fifth-20261119/. classification-oracles.json contains
21 story observations, five neutral React fixtures, five UI5 cases and the three real standalone blocks.
classification-extra.json adds visible UI5 delete actions, overflow navigation and DynamicPage-in-main.
classification-form-group.json corrects the Form composition to include a FormGroup, matching the real block.

| Defect | Outside-Storybook reproduction / UI5 comparison | Candidate |
| --- | --- | --- |
| NotificationList growing loading: nested-interactive | React load-more role=button contains focusable progressbar; UI5 ListTemplate.js moreRow also nests BusyIndicator and fails the same rule. | 0002 separates progressbar/action; retains the progressbar's role, name, delay and tabindex and the action's callbacks/keys. Layout and click propagation still need owner validation. |
| Search group: aria-allowed-role | React LI role=group fails. UI5 SearchItemGroup.js delegates to main-package ListBoxItemGroupTemplate.js, whose group semantic host is a UL; UI5 passes. | 0003 moves group semantics to the existing inner UL and retains public LI props/events/ref. Audit every supported accessible-description/name prop on the new semantic host. |
| Search delete: nested-interactive | React option contains native delete Button. UI5 SearchItemTemplate.js has the same structure; its default hidden delete action passes, but focusing its native option reveals the action and reproduces the failure. | 0003 moves action output beside the unchanged native option in a neutral row. This is a structural starting point: row padding/background, complete keyboard routing and valid accessible list ownership need verification. |
| SideNavigation tag: label-content-name-mismatch | React and UI5 tagged Products items name only Products while visibly displaying New. UI5 SideNavigationItem.js _textId/_ariaLabel/_describedBy and SideNavigationItemTemplate.js put the tag in description, not name. | 0004 includes the tag ID in default labels, preserving explicit accessibleName priority and other descriptions. Explicit consumer names must still include visible text under the existing contract. |
| SideNavigation overflow: aria-required-children | React menu contains two focusable role=none boundary DIVs. UI5 also fails this rule, but because its item LI hosts have role=none inside role=menu. UI5 ListTemplate.js puts its boundary dummies outside the menu UL; it does **not** share React's boundary placement defect. | 0004 portals the two forwarding dummies beside each owned root/submenu, keeping first-row focus forwarding and guarding transient focus-out. The candidate includes the react-dom item dependency only; no package dependency is installed. |
| VariantManagement empty list: empty-heading | React empty H2 and a fresh empty OpenUI5 VariantManagement both fail. React Title owns an inner empty span, so the initial S4 marker's childless-heading assumption is wrong. | 0005 retains a neutral empty layout host and emits the configured Title heading only when title text exists; arrow name, trigger, callbacks, titleStyle and level remain for nonempty views. Empty geometry needs checking. |
| ListReport/ObjectPage nested banner | Standalone blocks assign root=main and leave DynamicPage's default header=banner. UI5 DynamicPageTemplate.js with the same accessibilityAttributes also reproduces landmark-banner-is-top-level. AppShell's standalone default block is clean; its story heading jump is separate. | 0006 gives the application block header role=region, preserving DynamicPage's dynamic Header Expanded/Collapsed name and keyboard behavior. |
| ObjectPage duplicate General Information regions | Standalone native section and grouped Form have the same name. UI5 Form.js effectiveAccessibleRole is region with a FormGroup; the corrected paired grouped-Form/section probe also fails landmark-unique. There is no UI5 Web Component ObjectPage; compare constituent Form and DynamicPage, not a fabricated full-block equivalent. | 0006 gives the application-provided Form a distinct name. Form/section roles, section navigation and existing translated caller-supplied labels stay owned by their components. |

Source packages: Search, SearchItem, SearchItemGroup, NotificationListGroupItem, SideNavigationItem,
NavigationMenu/NavigationMenuItem and DynamicPage are in @ui5/webcomponents-fiori/dist/. List,
ListBoxItemGroupTemplate and Form are in @ui5/webcomponents/dist/. Read their JS, templates and generated
CSS together before implementation. SearchItem.js _onkeydown/_handleTabNavigation/_onDeleteButtonKeyDown
specify F2/action-loop/return-focus behavior; a sibling action must preserve that model. NavigationMenuTemplate.js
uses List accessibleRole=Menu; NavigationMenuItemTemplate.js delegates to MenuItemTemplate.

Each owner fix must prove strict axe outside Storybook and on the exact affected stories in Morning/HCB;
keep foreign same-rule nodes failing. Run the corresponding component specs (notification-list, search,
side-navigation, variant-management, dynamic-page, object-page and block consumer checks), including keyboard
activation, Tab/Shift+Tab, focus return, controlled callbacks, deletion, loading delay, native links and submenu
dismissal. Compare four-theme/two-density pixels, dimensions, hover/focus/loading and RTL without weakening
thresholds. Preserve all roles, ARIA relationships, live text, localization overrides, custom action props/ref
and data-slot contracts; verify installed item dependency closure. Accessibility ratchets may only shrink
under their owning card. Remove each S4 marker only alongside the proven component fix.

The narrow marker attempt passes Search, NotificationList and both floorplan defect checks, but SideNavigation
Flat/Parent Selected/Open and VariantManagement Empty List still fail. The new adversarial tests reject foreign
nodes and altered descendants for six of eight defect cases; tag and empty-heading preconditions fail before
mutation. No marker is widened after the second SideNavigation hypothesis: AGENTS.md rule 2 requires stopping.
See docs/plan/returns/S4.md for every original failure and the exact final affected-check summary.

## Retained S4 story inventory

- bar: Playground, Header, Subheader, Footer, FloatingFooter, RTL
- breadcrumbs: Playground, Slash, DoubleSlash, BackSlash, DoubleBackSlash, GreaterThan, DoubleGreaterThan, NoCurrentPage, CurrentPageLink, Overflow, OverflowNoCurrentPage, OverflowCurrentPageLink, Open, HiddenMiddle, HiddenMiddleOpen, CustomTexts, RTL
- filter-bar: Playground, Expanded, Collapsed, LiveMode, WithoutSearch, CustomFields, CustomTexts, RTL
- notification-list: Playground, Items, Actions, Groups, Collapsed, Read, Important, Negative, Critical, Positive, Information, Wrapping, ItemLoading, GrowingButton, GrowingButtonLoading, GrowingButtonChildLoading, GrowingScrollLoading, GrowingCollapsed, Empty, CustomTexts, RTL
- product-switch: Playground, TwoColumns, ThreeColumns, FourColumns, Empty, WithLinks, Trigger, CustomTexts, RTL
- search: Playground, Placeholder, WithValue, Scoped, ShellCollapsed, Open, FieldLoading, SuggestionsLoading, DeletableSuggestion, CustomTexts, RTL
- shell-bar: Playground, ExpandedSearch, Minimal, ApplicationMenu, TitleOnly, Large, OverflowDot, Small, CustomTexts, RTL
- side-navigation: Playground, Expanded, Collapsed, Flat, ParentSelected, CollapsedFlat, DisabledGroup, Overflow, OverflowSelected, OverflowSubSelected, OverflowGroups, Open, CustomTexts, RTL
- tabs: Playground, Text, Disabled, Counts, SemanticDesigns, WithSeparator, Icons, IconsOnly, SemanticIcons, Mixed, Transparent, Translucent, Overflow, OverflowSelectedLast, OverflowStartAndEnd, OverflowIcons, CustomOverflow, CustomStartAndEnd, CustomStartEmpty, Open, CustomTexts, RTL
- toolbar: Playground, Buttons, AlignStart, Transparent, WithSpacer, WithSeparators, FixedSpacer, Overflow, AlwaysOverflow, NeverOverflow, Open, ScrollableOverflow, CustomTexts, RTL
- variant-management: Playground, Modified, Error, Open, SearchableList, EmptyList, SaveOptions, Manage, SaveContexts, ManageContexts, ErrorOpen, NoSearchResults, SaveDuplicate, ManageRenameError, RolesOpen, Heading, NarrowTitle, CustomTexts, RTL
- wizard: Playground, IconsFirstStep, IconsSecondStep, Numbers, AllEnabled, SingleStep, Narrow, CustomTexts, RTL
- dynamic-page: Playground, Expanded, Snapped, Footer, SnappedFooter, Pinned, WithoutPin, CustomTexts, RTL
- dynamic-side-content: Playground, Large, SideAtStart, EqualSplit, Medium, Small, AlwaysShowSmall, ToggledSmall, MainHidden, SideHidden, CustomTexts, RTL
- flexible-column-layout: Playground, OneColumn, TwoColumnsStartExpanded, TwoColumnsMidExpanded, ThreeColumnsMidExpanded, ThreeColumnsEndExpanded, ThreeColumnsStartExpandedEndHidden, ThreeColumnsMidExpandedEndHidden, ThreeColumnsStartHiddenMidExpanded, ThreeColumnsStartHiddenEndExpanded, MidColumnFullScreen, EndColumnFullScreen, Tablet, Phone, DisableResizing, CustomTexts, RTL, HookNavigation
- navigation-layout: Playground, Automatic, Expanded, Collapsed, RTL
- object-page: Playground, Anchor, Snapped, Tabs, SelectedSection, Footer, Pinned, WithoutAnchorBar, CustomTexts, RTL
- page: Playground, FloatingFooter, FixedFooter, ListBackground, TransparentBackground, FooterHidden, NoScrolling, WithoutFooter, RTL
- app-shell: Playground, RTL
- empty-states: Playground, RTL
- launchpad: Playground, RTL
- list-report: Playground, RTL
- master-detail: Playground, RTL
- object-page-floorplan: Playground, RTL
- wizard-page: Playground, RTL

MDX pages: F6 Navigation, Variants and use-is-phone (unchanged).
