---
'@mantyke/spotlight-image': patch
---

Fix the image shaking rapidly during pinch zoom on iOS. The viewer now blocks the browser's own pinch zoom (`touch-action: none` plus native gesture listeners), so Safari no longer zooms the page at the same time, and the zoom transition is turned off while fingers are on the screen.
