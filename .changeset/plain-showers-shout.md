---
'@mantyke/spotlight-image': patch
---

Fix zoom frame drops by applying direct DOM updates to all zoom operations (wheel, keyboard, pinch, buttons) with debounced React state sync
