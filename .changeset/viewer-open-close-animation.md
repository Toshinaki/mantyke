---
'@mantyke/spotlight-image': patch
---

Fix the viewer animating oddly on open and close:

- The image now fades in at its fit-to-screen size instead of shrinking from its original size, and keeps its size and position while the viewer closes instead of growing back to the original size first.
- The dark backdrop now fades in and out. It was set with the element `opacity`, which overrode Mantine's fade transition, so the backdrop appeared and disappeared abruptly. It is now set with `backgroundOpacity`.
