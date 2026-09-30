---
'@mantyke/spotlight-image': major
'@mantyke/masonry': major
---

**Breaking:** require Mantine 9 and React 19.2.

- Peer dependencies are now `@mantine/core` and `@mantine/hooks` `^9.0.0`, and `react` / `react-dom` `^19.2.0` (the versions Mantine 9 itself requires). Mantine 7 and 8 are no longer supported.
- `@mantyke/spotlight-image` uses Mantine 9's `useFullscreenElement`. Mantine 9 removed `useFullscreen`, so earlier versions of this package failed to import under Mantine 9.
- `@mantyke/spotlight-image`: `modalProps.classNames` may now be a function (as Mantine allows); its result is merged with the viewer's own class names.
