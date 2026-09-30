---
'@mantyke/spotlight-image': minor
---

Improve the viewer's loading state, accessibility and texts:

- Show a loading indicator (`role="status"`) while the full-size image is loading.
- Pass `fallbackSrc` to the viewer as well as the thumbnail, so a failed image shows the fallback instead of an empty viewer. When there is no fallback, the viewer stops the loading indicator and shows the image's alt text.
- Name the viewer dialog after the image's `alt`, so screen readers announce which image is open.
- Add the `labels` prop to replace the viewer's texts (button names, the loading indicator and the fullscreen hint). Texts that are not passed keep their English defaults. The `SpotlightImageLabels` type is exported.
