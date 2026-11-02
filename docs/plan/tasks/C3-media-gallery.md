# C3 — MediaGallery

**Goal:** new `media-gallery` matching `ui5-media-gallery` 2.28 (fiori package).

## Read first

- `node_modules/@ui5/webcomponents-fiori/dist/MediaGallery.js` (441 lines), `MediaGalleryItem.js`, templates;
  CSS `generated/themes/MediaGallery*.css.js`; params `grep -- '--fiori-media-gallery'`.
  Fixtures must import `@ui5/webcomponents-fiori/dist/Assets.js`.

## Files

New: `registry/ui/media-gallery.tsx`, items json, CSS, fixtures (+ .ui5.ts), demo, spec. Reuse Carousel only if UI5 does.

## Behaviour

- Props: `showAllThumbnails`, `interactiveDisplayArea`, `layout` (`Auto` | `Vertical` | `Horizontal`),
  `menuHorizontalAlign`, `menuVerticalAlign`, events `onSelectionChange`, `onOverflowClick`, `onDisplayAreaClick`.
- `MediaGalleryItem`: `selected`, `disabled`, `layout` (`Square` | `Wide`), children (img/video), `thumbnail`.
- Thumbnail overflow ("+N" button) exactly as UI5's measuring; keyboard navigation in the thumbnail strip as UI5.
- Images in fixtures: inline SVG data URIs (no network).

## Fixtures

Horizontal and vertical layouts, with overflow, square and wide items, a disabled item.

## Tests

Selection by click/keyboard, overflow event, display area click when interactive, layout switching by width in Auto.

## Acceptance

Pixel diff; AGENTS.md definition of done.
