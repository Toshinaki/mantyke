# @mantyke/masonry

## 1.0.0

### Major Changes

- 9a6394a: **Breaking:** require Mantine 9 and React 19.2.

  - Peer dependencies are now `@mantine/core` and `@mantine/hooks` `^9.0.0`, and `react` / `react-dom` `^19.2.0` (the versions Mantine 9 itself requires). Mantine 7 and 8 are no longer supported.
  - `@mantyke/spotlight-image` uses Mantine 9's `useFullscreenElement`. Mantine 9 removed `useFullscreen`, so earlier versions of this package failed to import under Mantine 9.
  - `@mantyke/spotlight-image`: `modalProps.classNames` may now be a function (as Mantine allows); its result is merged with the viewer's own class names.

## 0.1.2

### Patch Changes

- 4999b33: Link the README to the package's page on the documentation site.

## 0.1.1

### Patch Changes

- 3be57a0: Fix several layout issues:

  - Responsive `columns` and `gap` now take effect at each breakpoint
  - `columns` and `rows` variants re-read `gap` when it changes, instead of keeping the value from the first render
  - `columns` and `rows` variants keep each item's aspect ratio when children are removed, reordered or replaced
  - `columns` and `rows` variants show loaded items even if another item cannot be measured (for example, a broken image)
  - Items in the `masonry` variant fill the column width, so images narrower than the column no longer leave uneven gaps

- a6325de: The `masonry` variant measures item heights before the first paint, so items no longer appear stacked in the first column and then jump into place.

## 0.1.0

### Minor Changes

- 2321e84: Add masonry layout component with three variants: masonry (shortest-column), columns (justified variable-width), and rows (justified row packing)
