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

{{FLOORPLAN_PICKER}}

Read [Floorplans](references/floorplans.md) for region nesting, alternatives and valid adaptations.

## Component pickers

{{COMPONENT_PICKERS}}

## Reference index

{{REFERENCE_INDEX}}

Guidance is adapted from SAP's Apache-2.0 ai-skills-library at the pinned revision in [NOTICE](NOTICE).
