---
name: petalo
description: Build React enterprise pages with the petalo registry. Use for SAP Fiori, Horizon or UI5 styling with shadcn, and for choosing its components and floorplan blocks.
---

# Build with petalo

Choose a floorplan for the page's task, then read the relevant category reference to choose its controls.

## Install

Requires React 19 and Tailwind CSS v4. Configure the `@petalo` registry before adding items:

```bash
npx shadcn@latest init https://snest007.github.io/petalo/r/petalo.json
npx shadcn add @petalo/<name>
```

Components install into `@/components/ui/<name>`; floorplan blocks install into `@/components/<name>`.
Read the installed source for props; the references list composition exports, not the full API.
Replace floorplan sample data and action handlers with the application's own data flow.

## Fiori rules

- Use `--sap*` tokens and `--fiori-*` parameters for visual values. Set `data-theme` and `data-density` for theme and density.
- Use `none | negative | critical | positive | information` for value states. Supply a useful `valueStateMessage` where the control supports it.
- Keep at most one `Button variant="emphasized"` per page or dialog; label actions with verbs.
- Give fields visible labels and icon buttons accessible names. Keep keyboard rings on `:focus-visible`.
- Use the actual React prop names and enum values; SAPUI5 APIs are not interchangeable with this registry.

## Floorplan picker

| Block | Use when | Other blocks |
| --- | --- | --- |
| [app-shell](references/floorplans.md#app-shell) | Let users work across application pages while retaining global search, notifications, profile and product access. | launchpad, list-report, object-page-floorplan, master-detail, empty-states |
| [empty-states](references/floorplans.md#empty-states) | Explain why no content is available and offer the action that can help users continue. | list-report, app-shell, launchpad |
| [launchpad](references/floorplans.md#launchpad) | Give users an app-entry starting point for choosing business areas and opening favorite apps. | app-shell, list-report, empty-states, object-page-floorplan, master-detail, wizard-page |
| [list-report](references/floorplans.md#list-report) | Let users search and filter a business-record collection before taking item or mass actions. | object-page-floorplan, master-detail, wizard-page, app-shell, empty-states |
| [master-detail](references/floorplans.md#master-detail) | Select records from a list while keeping their detail visible in an adjacent column when space permits. | list-report, object-page-floorplan, app-shell |
| [object-page-floorplan](references/floorplans.md#object-page-floorplan) | Inspect or edit one business object with its identity, status, totals and categorized details. | list-report, master-detail, wizard-page, app-shell |
| [wizard-page](references/floorplans.md#wizard-page) | Create an unfamiliar object through 3–8 ordered steps before reviewing and submitting the result. | object-page-floorplan, list-report |

Read [Floorplans](references/floorplans.md) for region nesting, alternatives and valid adaptations.

## Category index

- [Actions](references/actions.md) — explicit actions; toggles; related view options.
- [Forms](references/forms.md) — select, combobox, multi-combobox, multi-input, radio-group and segmented-button decisions; text and numeric entry; files and colors; tokens.
- [Dates](references/dates.md) — date, range, date-time and time fields; visible calendars; custom pickers.
- [Data](references/data.md) — table, data-table, list and tree; object identity, amounts and status; histories and attachments.
- [Overlays](references/overlays.md) — dialog, popover and responsive-popover; commands; value help; view settings and filter personalization; transient feedback.
- [Display](references/display.md) — message-strip, toast and illustrated-message; tag and object-status; cards and panels; text, media and progress.
- [Navigation](references/navigation.md) — tabs and segmented-button; destinations, breadcrumbs and product switching; search, filter-bar and saved views; toolbars and guided steps.
- [Layout](references/layout.md) — page and dynamic-page; object sections; related columns, supplementary context and application navigation.
- [Floorplans](references/floorplans.md) — all seven page blocks; nesting and adaptations; launchpad is a navigation scaffold and supplies no app-tile grid.

## Verify

Before reporting done, run the app's typecheck and build, then open the page and check for browser console and page errors.
If a prop does not type-check, re-read that installed component's source, correct the API usage, and repeat verification.

Guidance is adapted from SAP's Apache-2.0 ai-skills-library at the pinned revision in [NOTICE](NOTICE).
