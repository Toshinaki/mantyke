---
'@mantyke/masonry': patch
---

Fix several layout issues:

- Responsive `columns` and `gap` now take effect at each breakpoint
- `columns` and `rows` variants re-read `gap` when it changes, instead of keeping the value from the first render
- `columns` and `rows` variants keep each item's aspect ratio when children are removed, reordered or replaced
- `columns` and `rows` variants show loaded items even if another item cannot be measured (for example, a broken image)
- Items in the `masonry` variant fill the column width, so images narrower than the column no longer leave uneven gaps
