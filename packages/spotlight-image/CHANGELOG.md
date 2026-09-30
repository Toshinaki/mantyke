# @mantyke/spotlight-image

## 1.1.0

### Minor Changes

- 63ee588: Improve the viewer's loading state, accessibility and texts:

  - Show a loading indicator (`role="status"`) while the full-size image is loading.
  - Pass `fallbackSrc` to the viewer as well as the thumbnail, so a failed image shows the fallback instead of an empty viewer. When there is no fallback, the viewer stops the loading indicator and shows the image's alt text.
  - Name the viewer dialog after the image's `alt`, so screen readers announce which image is open.
  - Add the `labels` prop to replace the viewer's texts (button names, the loading indicator and the fullscreen hint). Texts that are not passed keep their English defaults. The `SpotlightImageLabels` type is exported.

### Patch Changes

- 025d85e: Make the disabled fullscreen button look disabled. On devices without the Fullscreen API the button was marked as disabled but looked the same as the other buttons, because the viewer's button colors overrode Mantine's disabled styles. It is now dimmed.

## 1.0.0

### Major Changes

- 9a6394a: **Breaking:** require Mantine 9 and React 19.2.

  - Peer dependencies are now `@mantine/core` and `@mantine/hooks` `^9.0.0`, and `react` / `react-dom` `^19.2.0` (the versions Mantine 9 itself requires). Mantine 7 and 8 are no longer supported.
  - `@mantyke/spotlight-image` uses Mantine 9's `useFullscreenElement`. Mantine 9 removed `useFullscreen`, so earlier versions of this package failed to import under Mantine 9.
  - `@mantyke/spotlight-image`: `modalProps.classNames` may now be a function (as Mantine allows); its result is merged with the viewer's own class names.

### Patch Changes

- 8479251: Fix the viewer animating oddly on open and close:

  - The image now fades in at its fit-to-screen size instead of shrinking from its original size, and keeps its size and position while the viewer closes instead of growing back to the original size first.
  - The dark backdrop now fades in and out. It was set with the element `opacity`, which overrode Mantine's fade transition, so the backdrop appeared and disappeared abruptly. It is now set with `backgroundOpacity`.

## 0.3.1

### Patch Changes

- 4999b33: Link the README to the package's page on the documentation site.

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
