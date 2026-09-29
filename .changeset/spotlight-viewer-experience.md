---
'@mantyke/spotlight-image': minor
---

Improve the viewer experience:

- Add `keepImageInView` to stop the zoomed image from being dragged out of view (`false` by default)
- `modalProps.closeOnClickOutside` now closes the viewer when the empty area around the image is clicked (`false` by default)
- On devices without the Fullscreen API (such as iPhone Safari), the fullscreen button is shown as disabled and explains why when tapped
- Wheel zoom follows the mouse position and scales with the scroll distance, so trackpad pinch zooms smoothly instead of jumping to the maximum; one mouse wheel notch still equals one `zoomSpeed` step
- Button and keyboard zoom keep the currently viewed area in place
- The image refits when the window is resized or the device is rotated, unless it is zoomed in
- The zoomed image follows the pointer without delay while dragging
