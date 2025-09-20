# @mantyke/spotlight-image

[![npm version](https://badge.fury.io/js/@mantyke%2Fspotlight-image.svg)](https://badge.fury.io/js/@mantyke%2Fspotlight-image)
[![npm downloads](https://img.shields.io/npm/dm/@mantyke/spotlight-image)](https://www.npmjs.com/package/@mantyke/spotlight-image)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mantyke/spotlight-image)](https://bundlephobia.com/package/@mantyke/spotlight-image)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/Toshinaki/mantyke/workflows/CI/badge.svg)](https://github.com/Toshinaki/mantyke/actions)

React component for displaying images with zoom, pan, and fullscreen capabilities. Built for Mantine UI.

## Installation

```bash
npm install @mantyke/spotlight-image @mantine/core @mantine/hooks
```

## Usage

```tsx
import { SpotlightImage } from '@mantyke/spotlight-image';
import '@mantyke/spotlight-image/styles.css';

function App() {
  return (
    <SpotlightImage
      src="https://example.com/image.jpg"
      alt="Description"
      width={300}
      height={200}
    />
  );
}
```

## Features

- **Click to open** - Click any image to open in spotlight mode
- **Zoom controls** - Mouse wheel or buttons to zoom in/out
- **Pan support** - Drag to move around zoomed images
- **Fullscreen** - Toggle fullscreen for immersive viewing
- **Keyboard shortcuts** - Escape to close, space to reset zoom
- **Touch support** - Works on mobile devices
- **Accessible** - Proper ARIA labels and keyboard navigation

## Props

| Prop         | Type                                                       | Default   | Description                          |
| ------------ | ---------------------------------------------------------- | --------- | ------------------------------------ |
| `src`        | `string`                                                   | -         | Image source URL (required)          |
| `alt`        | `string`                                                   | `""`      | Image alt text                       |
| `width`      | `string \| number`                                         | -         | Image width                          |
| `height`     | `string \| number`                                         | -         | Image height                         |
| `fit`        | `"contain" \| "cover" \| "fill" \| "scale-down" \| "none"` | `"cover"` | How image fits container             |
| `zoomSpeed`  | `number`                                                   | `1.2`     | Zoom increment multiplier            |
| `maxZoom`    | `number`                                                   | `5`       | Maximum zoom level                   |
| `minZoom`    | `number`                                                   | `0.25`    | Minimum zoom level                   |
| `modalProps` | `ModalProps`                                               | -         | Additional props for Modal component |

Inherits all props from Mantine's `Image` component.

## Styling

Import the CSS file for styling:

```tsx
import '@mantyke/spotlight-image/styles.css';
```

## Requirements

- React 18+
- @mantine/core 8+
- @mantine/hooks 8+

## License

MIT