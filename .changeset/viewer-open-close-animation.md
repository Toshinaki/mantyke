---
'@mantyke/spotlight-image': patch
---

Fix the viewer image animating oddly on open and close. The image now fades in at its fit-to-screen size instead of shrinking from its original size, and keeps its size and position while the viewer closes instead of growing back to the original size first.
