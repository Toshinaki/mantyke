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

```bash
pnpm add @mantine/core @mantine/hooks react react-dom
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
| `minZoom`    | `number`                                                   | `0.25`       | Minimum zoom level            |
| `modalProps` | `ModalProps`                                               | `{}`         | Props passed to Mantine Modal |
| `width`      | `number \| string`                                         | -            | Image width                   |
| `height`     | `number \| string`                                         | -            | Image height                  |
| `radius`     | `MantineRadius`                                            | -            | Border radius                 |

## Styles API

### Selectors

- `root` - Root element (clickable image)

## Controls

### Mouse

- **Click image** - Open spotlight view
- **Mouse wheel** - Zoom in/out
- **Click & drag** - Pan when zoomed

### Buttons

- **Zoom In** - Increase zoom level
- **Zoom Out** - Decrease zoom level  
- **Reset** - Return to fit-to-screen
- **Fullscreen** - Toggle fullscreen mode
- **Close** - Close spotlight

### Keyboard

- **ESC** - Close spotlight view

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

- [Documentation] (wip)
- [GitHub](https://github.com/Toshinaki/mantyke)
- [Issues](https://github.com/Toshinaki/mantyke/issues)
- [Mantine](https://mantine.dev)

## Keywords

`mantine` `react` `image-viewer` `lightbox` `zoom` `pan` `fullscreen` `typescript` `image-zoom` `photo-viewer` `image-lightbox` `responsive` `interactive` `ui-component`