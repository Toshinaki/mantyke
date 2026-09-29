# @mantyke/spotlight-image

## 0.3.0

### Minor Changes

- a6325de: Improve the viewer experience:

  - Add `keepImageInView` to stop the zoomed image from being dragged out of view (`false` by default)
  - `modalProps.closeOnClickOutside` now closes the viewer when the empty area around the image is clicked (`false` by default)
  - On devices without the Fullscreen API (such as iPhone Safari), the fullscreen button is shown as disabled and explains why when tapped
  - Wheel zoom follows the mouse position and scales with the scroll distance, so trackpad pinch zooms smoothly instead of jumping to the maximum; one mouse wheel notch still equals one `zoomSpeed` step
  - Button and keyboard zoom keep the currently viewed area in place
  - The image refits when the window is resized or the device is rotated, unless it is zoomed in
  - The zoomed image follows the pointer without delay while dragging

### Patch Changes

- 6baf564: Fix the image shaking rapidly during pinch zoom on iOS. The viewer now blocks the browser's own pinch zoom (`touch-action: none` plus native gesture listeners), so Safari no longer zooms the page at the same time, and the zoom transition is turned off while fingers are on the screen.
- 3be57a0: Fix zooming out enlarging the image when its fit-to-screen size is below `minZoom` (large images, narrow screens). Pressing a control button no longer drags the zoomed image.

## 0.2.3

### Patch Changes

- 47f2b62: Fix zoom frame drops by applying direct DOM updates to all zoom operations (wheel, keyboard, pinch, buttons) with debounced React state sync

## 0.2.2

### Patch Changes

- 7a1a09c: fix bugs & add touch support

## 0.2.1

### Patch Changes

- eb8e04f: Block default onClick event

## 0.2.0

### Minor Changes

- 77b20e1: Remade with mantine extension template to deal with bugs

## 0.1.0

### Minor Changes

- Created again with mantine template.
