# F0 — SAPUI5 reference harness (do first; F1–F3 depend on it)

**Goal:** a second visual oracle for components that exist only in SAPUI5 (not in UI5 Web Components): a reference page
that renders real **OpenUI5 1.154** controls (`sap.m.VariantManagement`, `sap.ui.mdc.FilterBar` + Adapt Filters dialog),
and a pixel-diff spec comparing our fixtures to it — the same model as `ui5.html` / `tests/visual.spec.ts`.

OpenUI5 is Apache-2.0 (npm `@openui5/*`, © SAP SE). It is used only as a **dev-time reference**, never shipped.

## Decisions already made (don't revisit)

- Versions pinned to **1.154.0**: `@openui5/sap.ui.core`, `@openui5/sap.m`, `@openui5/sap.ui.mdc`, `@openui5/sap.ui.fl`,
  `@openui5/sap.ui.layout`, `@openui5/themelib_sap_horizon` as **devDependencies** (this card is allowed to add them).
- The npm packages contain **sources** (LESS themes, unbuilt modules), not the built `library.css`/preloads. Serving them
  needs UI5 Tooling. Two acceptable implementations — pick A unless it fails, and say which in the final message:
  - **A (preferred, offline):** add devDependency `@ui5/cli` and a `sapui5/` app (ui5.yaml, `index.html`, `webapp/`) that
    `ui5 serve --port <p>` serves with the framework from node_modules (`framework: OpenUI5 1.154.0` in ui5.yaml uses the
    UI5 CDN-less npm resolution; if it insists on downloading, set `ui5 use openui5@1.154.0` and document the cache dir).
  - **B (fallback):** bootstrap from `https://sdk.openui5.org/1.154.0/resources/sap-ui-core.js` (verified reachable, and
    `sap/m/themes/sap_horizon/library.css` is served there). Tests then need network; mark the spec `@network` and skip it
    when `SAPUI5_OFFLINE=1`.
- A working bootstrap sketch (verified to render VariantManagement + mdc FilterBar + Adapt Filters dialog with no
  console errors):

```html
<script id="sap-ui-bootstrap" src="…/resources/sap-ui-core.js"
  data-sap-ui-theme="sap_horizon" data-sap-ui-libs="sap.m,sap.ui.mdc" data-sap-ui-async="true"
  data-sap-ui-compat-version="edge" data-sap-ui-resource-roots='{"ref":"./"}' data-sap-ui-on-init="module:ref/main"></script>
```

```js
// ref/Delegate.js — minimal FilterBarDelegate: fetchProperties / addItem / removeItem
sap.ui.define(["sap/ui/mdc/FilterBarDelegate", "sap/ui/mdc/FilterField"], (Base, FilterField) => {
  const D = Object.assign({}, Base)
  const props = [{ key: "name", label: "Name", dataType: "sap.ui.model.type.String" }, /* … */]
  D.fetchProperties = () => Promise.resolve(props)
  D.addItem = (fb, key) => Promise.resolve(new FilterField({ label: props.find((p) => p.key === key).label,
    propertyKey: key, conditions: `{$filters>/conditions/${key}}` }))
  D.removeItem = () => Promise.resolve(true)
  return D
})
```

## Files

- New: `sapui5/` (reference app: `index.html`, `main.js`, `Delegate.js`, `fixtures.js`, ui5.yaml if option A),
  `tests/visual-sapui5.spec.ts`, `docs/src/fixtures-sapui5/` (our side: `<name>.tsx` FixtureSets rendered on
  `index.html?fixtures-sapui5`), a short section in `CONTRIBUTING.md` ("Components from SAPUI5").
- Shared edits allowed: `package.json` (devDependencies + script `sapui5:serve`), `playwright.config.ts` (a second
  `webServer` for the reference app on `SAPUI5_PORT`, default 4174), `docs/src/main.tsx` (the `?fixtures-sapui5` mode),
  `.gitignore`.

## Behaviour of the harness

- Fixture ids shared by both sides; the SAPUI5 page renders each case into `[data-fixture="<id>"]` cells and sets
  `document.documentElement.dataset.ready = "true"` after `sap.ui.getCore().ready()` / rendering + fonts + an extra
  2 rAF. Support `?theme=` (sap_horizon, sap_horizon_dark, sap_horizon_hcb, sap_horizon_hcw via
  `sap/ui/core/Theming.setTheme`) and `?density=compact` (`sapUiSizeCompact` class on body).
- Dialogs/popovers: render open and move their DOM into the cell (`.sapMDialog` → position static) the way
  `docs/src/fixtures/ui5-popup-in-place.ts` does for UI5 WC; disable SAPUI5 animations (`sap/ui/core/AnimationMode` = none).
- Same diff rules as `tests/visual.spec.ts` (2%, size must match), 4 themes × 2 densities.
- A smoke fixture proving the pipeline: `sapui5-button` (sap.m.Button vs our Button, Default + Emphasized) — must pass,
  which also confirms our tokens match SAPUI5's theme, not only UI5 WC's.

## Acceptance

- `PORT=4310 pnpm exec playwright test tests/visual-sapui5.spec.ts` green with the smoke fixture.
- Full suite still green; AGENTS.md definition of done.
- CONTRIBUTING.md explains how to add a SAPUI5-referenced fixture.
