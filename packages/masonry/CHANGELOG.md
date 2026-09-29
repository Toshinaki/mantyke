# @mantyke/masonry

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
