# @mantyke/spotlight-image

Interactive image component with zoom and pan capabilities for Mantine UI.

[![NPM Version](https://img.shields.io/npm/v/@mantyke/spotlight-image)](https://www.npmjs.com/package/@mantyke/spotlight-image)
[![NPM Downloads](https://img.shields.io/npm/dm/@mantyke/spotlight-image)](https://www.npmjs.com/package/@mantyke/spotlight-image)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@mantyke/spotlight-image)](https://bundlephobia.com/package/@mantyke/spotlight-image)
[![License](https://img.shields.io/npm/l/@mantyke/spotlight-image)](./LICENSE)
[![CI](https://github.com/Toshinaki/mantyke/workflows/CI/badge.svg)](https://github.com/Toshinaki/mantyke/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Toshinaki/mantyke/pulls)


## Features

- 🔍 **Zoom Controls** - Mouse wheel or buttons to zoom in/out
- 🖱️ **Pan & Drag** - Drag image when zoomed in
- 🖼️ **Fullscreen Mode** - Toggle fullscreen for immersive viewing
- ⚡ **Smooth Animations** - Fluid transitions and interactions
- 🎨 **Mantine Integration** - Works seamlessly with Mantine theme
- ♿ **Keyboard Support** - ESC to close, accessible controls
- 🌐 **Localizable** - Replace the viewer's texts with the `labels` prop
- ⏳ **Loading & Fallback** - Loading indicator for slow images, `fallbackSrc` when an image fails to load
- 📱 **Responsive** - Adapts to viewport size
- 🎯 **TypeScript** - Full type safety and IntelliSense

## Installation

```bash
# npm
npm install @mantyke/spotlight-image

# yarn
yarn add @mantyke/spotlight-image

# pnpm
pnpm add @mantyke/spotlight-image
```

### Peer Dependencies

Requires Mantine 9 (`@mantine/core` and `@mantine/hooks` `^9.0.0`) and React 19.2 or later. For Mantine 7 or 8, use the last 0.x release.

```bash
pnpm add @mantine/core @mantine/hooks @tabler/icons-react react react-dom
```

## Usage

```tsx
import { SpotlightImage } from '@mantyke/spotlight-image';
import '@mantyke/spotlight-image/styles.css';

function Demo() {
  return (
    <SpotlightImage
      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
      alt="Mountain landscape"
      width={300}
      height={200}
      radius="md"
    />
  );
}
```

### With Custom Zoom Settings

```tsx
<SpotlightImage
  src="/image.jpg"
  alt="Custom zoom"
  zoomSpeed={1.5}
  maxZoom={8}
  minZoom={0.5}
/>
```

### With Modal Props

```tsx
<SpotlightImage
  src="/image.jpg"
  alt="Custom modal"
  modalProps={{
    overlayProps: {
      opacity: 0.95,
      blur: 5
    }
  }}
/>
```

### With a Fallback Image

`fallbackSrc` is used by both the thumbnail and the viewer when `src` fails to load:

```tsx
<SpotlightImage
  src="/image.jpg"
  alt="With fallback"
  fallbackSrc="/placeholder.jpg"
/>
```

### With Translated Labels

Pass only the texts to replace. The rest keep their English defaults:

```tsx
<SpotlightImage
  src="/image.jpg"
  alt="山景"
  labels={{
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置缩放',
    close: '关闭',
    enterFullscreen: '进入全屏',
    exitFullscreen: '退出全屏',
    fullscreenUnsupported: '当前设备不支持全屏',
    loading: '图片加载中',
  }}
/>
```

To translate every `SpotlightImage` at once, set `labels` as a default prop in the Mantine theme (`theme.components.SpotlightImage`).

## Props

### SpotlightImageProps

Extends `ImageProps` from `@mantine/core`.

| Prop         | Type                                                       | Default      | Description                   |
| ------------ | ---------------------------------------------------------- | ------------ | ----------------------------- |
| `src`        | `string`                                                   | **required** | Image source URL              |
| `alt`        | `string`                                                   | **required** | Alt text for accessibility    |
| `fit`        | `'contain' \| 'cover' \| 'fill' \| 'scale-down' \| 'none'` | `'cover'`    | Image fit behavior            |
| `zoomSpeed`  | `number`                                                   | `1.2`        | Zoom multiplier per step      |
| `maxZoom`    | `number`                                                   | `5`          | Maximum zoom level            |
| `minZoom`    | `number`                                                   | `0.25`       | Minimum zoom level. If the fit-to-screen zoom is lower, it is used instead |
| `keepImageInView` | `boolean`                                             | `false`      | Stop the zoomed image from being dragged out of view |
| `modalProps` | `Omit<ModalProps, 'opened' \| 'onClose' \| 'fullScreen' \| 'withCloseButton'>` | `{}`         | Props passed to Mantine Modal. Set `closeOnClickOutside: true` to close when the area around the image is clicked |
| `fallbackSrc` | `string`                                                  | -            | Image shown in the thumbnail and in the viewer when `src` fails to load |
| `labels`     | `Partial<SpotlightImageLabels>`                            | English      | Texts of the viewer: button names, loading indicator and the fullscreen hint |
| `width`      | `number \| string`                                         | -            | Image width                   |
| `height`     | `number \| string`                                         | -            | Image height                  |
| `radius`     | `MantineRadius`                                            | -            | Border radius                 |

## Styles API

### Selectors

- `root` - Root element (clickable image)

## Controls

### Mouse

- **Click image** - Open spotlight view
- **Mouse wheel** - Zoom in/out around the pointer
- **Trackpad pinch** - Zoom in/out smoothly
- **Click & drag** - Pan when zoomed
- **Click outside the image** - Close spotlight (when `modalProps.closeOnClickOutside` is enabled)

### Touch

- **Tap image** - Open spotlight view
- **Pinch** - Zoom in/out
- **Single-finger drag** - Pan when zoomed

### Buttons

- **Zoom In** - Increase zoom level
- **Zoom Out** - Decrease zoom level
- **Reset** - Return to fit-to-screen
- **Fullscreen** - Toggle fullscreen mode. Shown as disabled on devices without the Fullscreen API (such as iPhone Safari)
- **Close** - Close spotlight

### Keyboard

- **ESC** - Close spotlight view
- **+** / **=** - Zoom in
- **-** - Zoom out
- **0** - Reset zoom
- **Enter** / **Space** - Open spotlight from thumbnail

## Accessibility

- The thumbnail is a button: it can be focused and opened with **Enter** or **Space**.
- The viewer dialog is named after the image's `alt`, so screen readers announce which image is open.
- While the full-size image is loading, the viewer shows a loading indicator (`role="status"`).
- Every control has an accessible name, which can be translated with `labels`.

## Styling

### Layer Styles

For better CSS specificity control:

```tsx
import '@mantyke/spotlight-image/styles.layer.css';
```

### Custom Styles

```tsx
<SpotlightImage
  src="/image.jpg"
  alt="Custom styles"
  classNames={{
    root: 'my-custom-image'
  }}
  styles={{
    root: { borderRadius: '8px' }
  }}
/>
```

## TypeScript

Fully typed with exported interfaces:

```tsx
import type { 
  SpotlightImageProps,
  SpotlightImageFactory,
  SpotlightImageLabels,
  SpotlightImageStylesNames,
  SpotlightImageCssVariables
} from '@mantyke/spotlight-image';
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT

## Links

- [Documentation](https://toshinaki.github.io/mantyke/spotlight-image)
- [GitHub](https://github.com/Toshinaki/mantyke)
- [Issues](https://github.com/Toshinaki/mantyke/issues)
- [Mantine](https://mantine.dev)

## Keywords

`mantine` `react` `image-viewer` `lightbox` `zoom` `pan` `fullscreen` `typescript` `image-zoom` `photo-viewer` `image-lightbox` `responsive` `interactive` `ui-component`