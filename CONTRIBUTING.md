# Adding a component

Every component owns its own files. Nothing shared needs editing, so components can be built in parallel.

| File | Purpose |
|---|---|
| `registry/ui/<name>.tsx` | The component (distributed to users via shadcn) |
| `registry/items/<name>.json` | Registry metadata: `{ title, description, dependencies?, registryDependencies? }`. Use `"@fiori/icons"` if you import icons, `"@fiori/<other>"` for other components |
| `registry/styles/components/<name>.css` | Optional. Plain CSS for stateful styling that utilities can't express well (no `@layer` wrapper; `pnpm css` wraps everything) |
| `docs/src/fixtures/<name>.tsx` | `defineFixtures({ name, cases, react })`: static states to pixel-compare |
| `docs/src/fixtures/<name>.ui5.ts` | `defineUi5(set, props => HTMLElement)`: the same cases rendered with UI5 Web Components. Import the UI5 modules **and every icon used** (`@ui5/webcomponents-icons/dist/<icon>.js`) at the top |
| `docs/src/demos/<name>.tsx` | `defineDemo({ title, order, Demo })`: an interactive example for the docs page |
| `tests/<name>.spec.ts` | Behaviour tests (keyboard, ARIA, focus) with Playwright |

## Source of truth

The reference is UI5 Web Components 2.28: `node_modules/@ui5/webcomponents` (main) and
`node_modules/@ui5/webcomponents-fiori` (ShellBar, SideNavigation, UploadCollection, Wizard, DynamicPage, …).
Before writing anything, read:

- `dist/generated/themes/<Component>.css.js`: the component's CSS. This is what you port.
- `dist/<Component>.js` and `dist/<Component>Template.js`: DOM structure, keyboard handling, ARIA.
- The `--fiori-*` variables in `registry/styles/fiori.css` are UI5's `--_ui5_*` / `--ui5-*` parameters,
  renamed `--_ui5_button_base_height` → `--fiori-button-base-height` (and `--_ui5-foo` → `--fiori-x-foo`).
  They already switch with theme and density. **Use them; never hard-code a value that has a parameter.**
- `--sap*` tokens are SAP's theme variables, used directly (`bg-(--sapButton_Background)`).

Quick lookup: `grep -- '--fiori-checkbox' registry/styles/fiori.css | sort -u`

## Rules

- React 19, function components, `data-slot="<name>"` on the root, accept `className`, spread `...props`. Follow `registry/ui/button.tsx` and `select.tsx`.
- Tables/virtualisation: `@tanstack/react-table` and `@tanstack/react-virtual` are available (list them in your item's `dependencies`).
- Imports: `@/lib/utils`, `@/lib/fiori-icons`, `@/components/ui/<name>`. Interaction primitives come from `radix-ui` (`import { Checkbox as CheckboxPrimitive } from "radix-ui"`).
- Tailwind v4 arbitrary vars: `h-(--fiori-x)`, `text-(length:--sapFontSize)`, `font-(family-name:--sapFontFamily)`. Line height: UI5 uses `normal`, so write `leading-[normal]` (Tailwind's `leading-normal` is 1.5).
- Don't add `-webkit-font-smoothing`. Don't use `transition` unless UI5 does.
- Focus ring: only for keyboard (`:focus-visible`), drawn the way UI5 draws it (usually an inset pseudo-element).
- Value states use the names `negative | critical | positive | information` and reuse `ValueState`, `valueStateIcons`, `valueStateDefaultText` from `@/components/ui/input`.
- Text is English in the components (callers pass their own strings). Any user-visible default text must be overridable via props.

## Done means

```bash
pnpm generate && pnpm typecheck && pnpm registry:build
PORT=<your port> pnpm exec playwright test   # all green, including your fixtures in 4 themes × 2 densities
```

The visual test fails a cell if more than 2% of its pixels differ, or if its size differs at all. Failing cells
are written to `test-results/visual/<theme>-<density>/` as `<id>-ours.png`, `-ui5.png` and `-diff.png`. Open them with the Read tool.
Raise `tolerance` or use `skipCompare` only for a reason you can name (e.g. UI5 animates something we can't freeze),
and put the reason in a code comment.

Fixtures that use `@ui5/webcomponents-fiori` must import `@ui5/webcomponents-fiori/dist/Assets.js` in their `.ui5.ts`,
or the dark/HC themes fall back to Morning Horizon parameters on the UI5 side.

Generated files (`registry.json`, `registry/styles/fiori-components.css`, `public/r/`) are git-ignored; scripts rebuild them.
Commit only your component's own files. If you truly must change a shared file (`fiori-types`, `input.tsx`, a script),
keep the change minimal and say so in your commit message.
