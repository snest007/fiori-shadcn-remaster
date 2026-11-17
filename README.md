# shadcn-fiori

SAP Fiori (Horizon) look **and** interaction for React, distributed as a [shadcn/ui](https://ui.shadcn.com) registry.
The colors, sizes, shadows and icons are not hand-tuned. They are generated from SAP's open-source theme
packages, and each component is screenshot-compared against [UI5 Web Components](https://github.com/UI5/webcomponents),
SAP's official implementation.

[![CI](https://github.com/snest007/fiori-shadcn-remaster/actions/workflows/ci.yml/badge.svg)](https://github.com/snest007/fiori-shadcn-remaster/actions/workflows/ci.yml)

> Built on the SAP Horizon design language. This is not an SAP product. "SAP" and "Fiori" are trademarks of SAP SE.

Browse the [component docs and floorplans](https://snest007.github.io/fiori-shadcn-remaster/).

## Status: all four phases done (foundation, core, complex controls, layouts & floorplans)

| | |
|---|---|
| Themes | Morning Horizon, Evening Horizon, High Contrast Black, High Contrast White (`data-theme`) |
| Density | cozy (default), compact (`data-density="compact"`, works on any subtree) |
| Tokens | 1479 `--sap*` variables per theme + 1477 component parameters from UI5 (main + fiori packages) |
| Icons | 704 SAP Horizon icons, tree-shakeable |
| Components (73) | **Actions** Button, ToggleButton, SegmentedButton · **Forms** Label, Input, TextArea, Select, ComboBox, MultiComboBox, MultiInput (+Token, Tokenizer), StepInput, CheckBox, RadioGroup, Switch, Slider/RangeSlider, RatingIndicator, FileUploader, Form · **Dates** Calendar, DatePicker, DateRangePicker, TimePicker, DateTimePicker · **Data** Table, DataTable (TanStack, virtualized), List, Tree, Timeline, UploadCollection, ObjectStatus, ObjectNumber, ObjectIdentifier · **Overlays** Dialog, Popover, Menu, Toast, ViewSettingsDialog, ValueHelpDialog, UserMenu · **Display** MessageStrip, Tag, Avatar/AvatarGroup, Card, Panel, BusyIndicator, ProgressIndicator, Link, Title, Text, ExpandableText, Carousel, HeroBanner, IllustratedMessage · **Navigation** Tabs (IconTabBar), Breadcrumbs, Toolbar, Bar, FilterBar, ShellBar, Search, ProductSwitch, NotificationList, SideNavigation, Wizard · **Layout** Page, DynamicPage, ObjectPage, FlexibleColumnLayout (+`useFlexibleColumnLayout`), DynamicSideContent, NavigationLayout |
| Floorplans (blocks) | `app-shell`, `launchpad` (shell + side navigation), `list-report`, `object-page-floorplan`, `master-detail` (flexible column layout), `wizard-page`, `empty-states` — preview at `/block.html?name=<block>`, install with `npx shadcn add @fiori/<block>` |
| Illustrations | 118 SAP illustrations (72 Fiori + 46 TNT) in Scene/Dialog/Spot/Dot sizes; `illustrations-core` (14 common states) ships with IllustratedMessage, the rest as `@fiori/illustration-<name>` |
| Verified | 600 fixtures pixel-diffed vs UI5 2.28 in 4 themes × 2 densities (4800 cells, worst 1.6%); components without a UI5 Web Component (FilterBar, ValueHelpDialog, ObjectPage, Object*) checked against SAP's guideline images; axe; 391 Playwright tests incl. Fiori keyboard models |

## Browse in Storybook

Browse [Storybook](https://snest007.github.io/fiori-shadcn-remaster/storybook/) for individual component states, live Controls, source code and usage guidance. Run `pnpm storybook` locally at `http://localhost:6006`.

## Install into an app

Requires Tailwind CSS v4 and React 19.

```bash
npx shadcn@latest init https://snest007.github.io/fiori-shadcn-remaster/r/fiori.json
```

This writes the theme to `src/styles/fiori/`, adds the imports to your Tailwind CSS entry, maps shadcn's
`--primary` / `--border` / … to Fiori tokens, and installs the components. Add components individually with
`npx shadcn add @fiori/button`.

The SAP 72 font is a separate, optional item (see [License](#license) before you add it):

```bash
npx shadcn@latest add https://snest007.github.io/fiori-shadcn-remaster/r/fiori-font.json
```

To switch themes and density, set attributes on `<html>` (or any element):

```html
<html data-theme="sap_horizon_dark" data-density="compact">
```

Next.js: the CLI writes the theme files to `src/styles/fiori/`. If your CSS entry is `app/globals.css`,
move the folder next to it, or fix the `@import` paths.

## Usage

```tsx
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { accept } from "@/lib/fiori-icons"

<Button variant="emphasized">Save</Button>          // default | emphasized | transparent | positive | negative | attention
<Button variant="positive"><Icon icon={accept} />Approve</Button>
<Label htmlFor="name" required showColon>Name</Label>
<Input id="name" valueState="negative" valueStateMessage="Enter at least 3 characters." />
<Select defaultValue="de">
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="de">Germany</SelectItem>
    <SelectItem value="cn">China</SelectItem>
  </SelectContent>
</Select>
```

Fiori behaviour this library reproduces (beyond appearance):

- **Select**: while closed, ↑/↓/Home/End change the value in place; Alt+↓, Alt+↑, F4, Space and Enter open the list.
- **Value states** (negative, critical, positive, information): the field styling, and a message that appears
  while the field is focused, is linked with `aria-describedby`, and defaults to SAP's standard text.
- **Focus**: the inner focus ring appears only for keyboard focus, never on mouse click.
- **F6 navigation**: install `@fiori/f6-navigation` and call `useF6Navigation()` or `installF6Navigation()` to enable page-group navigation. The five main floorplan blocks opt in; Popup scopes keep navigation inside the open surface.
- **Chinese text**: the 72 font has no CJK glyphs, so the font stack falls back to PingFang SC / Microsoft YaHei / Noto Sans CJK.

## Use with coding agents

Copy `skills/shadcn-fiori` into your project's `.claude/skills/` or `.agents/skills/` directory. The skill helps agents
choose components and floorplans using this registry's APIs. Its category references are generated from the same item
metadata as the docs and registry; run `pnpm skill:build` after editing usage guidance.

## Develop

```bash
pnpm install
pnpm dev               # docs at http://localhost:5173; fixtures at /?fixtures, UI5 reference at /ui5.html
pnpm check             # regenerate, typecheck, build registry + site, run all tests
```

| Path | What |
|---|---|
| `scripts/generate-tokens.mjs` | Writes `registry/styles/fiori.css` (tokens, density, shadcn mapping) and `fiori-tailwind.css` from `@sap-theming/theming-base-content` and UI5's compiled theme parameters |
| `scripts/generate-icons.mjs` | Writes `registry/lib/fiori-icons.ts` from `@ui5/webcomponents-icons` |
| `scripts/build-registry-json.mjs` | Writes `registry.json`; `REGISTRY_URL` sets the `@fiori` namespace URL baked into `fiori.json` |
| `registry/` | What gets distributed: `ui/`, `lib/`, `styles/fiori-components.css` |
| `scripts/generate-illustrations.mjs` | Writes `registry/lib/fiori-illustrations/` and their registry items from `@ui5/webcomponents-fiori` |
| `registry/blocks/`, `registry/block-items/` | Floorplans (`registry:block`), previewed by `docs/block.html` |
| `docs/src/fixtures/<name>.tsx` + `.ui5.ts` | Fixtures rendered identically by `index.html?fixtures` (ours) and `ui5.html` (UI5) |
| `tests/visual.spec.ts` | Pixel diff per fixture; failing cells are written to `test-results/visual/` as `-ours/-ui5/-diff.png` |
| `tests/a11y.spec.ts` | axe, keyboard and focus behaviour |

Upgrading SAP's packages: bump `@sap-theming/theming-base-content` / `@ui5/webcomponents*`, then run `pnpm check`.
The visual tests will show any component whose reference changed.

Adding a component: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for component ownership and reference fixtures, and
[AGENTS.md](AGENTS.md) for task-card workflow and acceptance checks.

## Not done yet

The backlog with task cards is in [docs/plan](docs/plan/README.md). Calendars are Gregorian only, by design.

Collected from all phases; none blocks using the library.

- **Components:** ColorPalette / ColorPicker, MediaGallery, Adapt Filters dialog and variant management (planned as a full SAPUI5 port: `docs/plan`, wave F).
- **Overflow handling:** Tabs / Toolbar / Breadcrumbs "More" overflow, AvatarGroup "+N", SideNavigation "More" item when collapsed and too tall.
- **Features:** draggable/resizable Dialog, checkable menu items, ComboBox item groups, Table drag & drop and multi-column sorting, vertical Slider, ObjectPage subsection menus / lazy blocks, notification "growing".
- **Platform:** phone-specific layouts (full-screen dialogs for pickers and value help), RTL is implemented but not tested.
- **Testing:** hover / active / focus states are verified by screenshot only, not pixel-diffed.

## License

Apache-2.0. Generated theme values, icon paths and illustrations are © SAP SE or an SAP affiliate company, used
under Apache-2.0 (`@sap-theming/theming-base-content`, `@ui5/webcomponents`, `@ui5/webcomponents-fiori`,
`@ui5/webcomponents-icons`). Components and component CSS are partly derived from UI5 Web Components and OpenUI5
(Apache-2.0); each shipped file says so in its header.

**The 72 font is not covered.** Its files carry their own license ("Copyright SAP SE. All rights reserved" plus
Monotype terms that forbid copying and redistribution), even though they sit inside an Apache-2.0 npm package. This
registry does not bundle them. The optional `@fiori/fiori-font` item only adds `@font-face` rules that load the
font from SAP's npm package on jsDelivr, as UI5 Web Components does. Install it only if your use of 72 is permitted
(for example under your SAP license); without it the theme falls back to Arial / Helvetica.

The SAP logo icon (`sap-logo-shape`) is left out of the icon set: Apache-2.0 grants no trademark rights.
