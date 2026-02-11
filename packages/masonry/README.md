# @mantyke/masonry

Masonry layout component for Mantine UI with columns, masonry, and rows variants.

[![NPM Version](https://img.shields.io/npm/v/@mantyke/masonry)](https://www.npmjs.com/package/@mantyke/masonry)
[![NPM Downloads](https://img.shields.io/npm/dm/@mantyke/masonry)](https://www.npmjs.com/package/@mantyke/masonry)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@mantyke/masonry)](https://bundlephobia.com/package/@mantyke/masonry)
[![License](https://img.shields.io/npm/l/@mantyke/masonry)](./LICENSE)
[![CI](https://github.com/Toshinaki/mantyke/workflows/CI/badge.svg)](https://github.com/Toshinaki/mantyke/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Toshinaki/mantyke/pulls)


## Features

- **Three Layout Variants** - Masonry, Columns, and Rows algorithms
- **Responsive** - Supports Mantine responsive object syntax for columns and gap
- **Dynamic Measurement** - ResizeObserver-based aspect ratio tracking
- **Mantine Integration** - Works seamlessly with Mantine theme and Styles API
- **TypeScript** - Full type safety and IntelliSense

## Installation

```bash
# npm
npm install @mantyke/masonry

# yarn
yarn add @mantyke/masonry

# pnpm
pnpm add @mantyke/masonry
```

### Peer Dependencies

```bash
pnpm add @mantine/core @mantine/hooks react react-dom
```

## Usage

```tsx
import { Masonry } from '@mantyke/masonry';
import '@mantyke/masonry/styles.css';

function Demo() {
  return (
    <Masonry columns={3} gap="md">
      <img src="/photo-1.jpg" alt="Photo 1" />
      <img src="/photo-2.jpg" alt="Photo 2" />
      <img src="/photo-3.jpg" alt="Photo 3" />
      <img src="/photo-4.jpg" alt="Photo 4" />
      <img src="/photo-5.jpg" alt="Photo 5" />
      <img src="/photo-6.jpg" alt="Photo 6" />
    </Masonry>
  );
}
```

### Columns Variant

Justified variable-width columns where all columns end up at approximately the same total height. Column widths are calculated based on the harmonic mean of items' aspect ratios.

```tsx
<Masonry variant="columns" columns={3} gap="md">
  <img src="/photo-1.jpg" alt="Photo 1" />
  <img src="/photo-2.jpg" alt="Photo 2" />
  <img src="/photo-3.jpg" alt="Photo 3" />
</Masonry>
```

### Rows Variant

Justified row packing where items are distributed into rows that each fill the full container width. Items in the same row share the same height.

```tsx
<Masonry variant="rows" rows={2} gap="md">
  <img src="/photo-1.jpg" alt="Photo 1" />
  <img src="/photo-2.jpg" alt="Photo 2" />
  <img src="/photo-3.jpg" alt="Photo 3" />
</Masonry>
```

### Responsive Props

Both `columns` and `gap` support Mantine's responsive object syntax:

```tsx
<Masonry
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  gap={{ base: 'sm', md: 'md', lg: 'lg' }}
>
  {/* items */}
</Masonry>
```

## Props

### MasonryProps

Extends `BoxProps` from `@mantine/core`.

| Prop       | Type                          | Default      | Description                                                      |
| ---------- | ----------------------------- | ------------ | ---------------------------------------------------------------- |
| `variant`  | `'masonry' \| 'columns' \| 'rows'` | `'masonry'`  | Layout variant                                                   |
| `columns`  | `StyleProp<number>`           | `3`          | Number of columns (masonry and columns variants). Supports responsive syntax. |
| `rows`     | `number`                      | `2`          | Number of rows (rows variant only)                               |
| `gap`      | `StyleProp<MantineSpacing>`   | `'md'`       | Gap between items. Supports responsive syntax.                   |
| `children` | `React.ReactNode`             | **required** | Content to render                                                |

## Layout Variants

### Masonry (default)

Traditional Pinterest-style masonry layout. Items are distributed into columns using a shortest-column-first algorithm, with each new item placed in the column with the least total height.

### Columns

Justified variable-width columns. Items are distributed into columns based on a target total height, then column widths are calculated using the harmonic mean of items' aspect ratios. All columns end up at approximately the same height.

### Rows

Justified row packing. Items are distributed into rows that each fill the full container width. Row heights vary, but all items within the same row share the same height. Item widths scale proportionally by aspect ratio.

## Styles API

### Selectors

- `root` - Root container element
- `column` - Column wrapper
- `item` - Individual item wrapper

### CSS Variables

| Variable             | Description              |
| -------------------- | ------------------------ |
| `--masonry-columns`  | Number of columns        |
| `--masonry-gap`      | Gap between items        |

## Styling

### Layer Styles

For better CSS specificity control:

```tsx
import '@mantyke/masonry/styles.layer.css';
```

### Custom Styles

```tsx
<Masonry
  columns={3}
  classNames={{
    root: 'my-masonry',
    column: 'my-column',
    item: 'my-item'
  }}
  styles={{
    root: { maxWidth: 1200 }
  }}
>
  {/* items */}
</Masonry>
```

## TypeScript

Fully typed with exported interfaces:

```tsx
import type {
  MasonryProps,
  MasonryFactory,
  MasonryStylesNames,
  MasonryCssVariables
} from '@mantyke/masonry';
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

`mantine` `react` `masonry` `layout` `grid` `columns` `rows` `responsive` `gallery` `photo-grid` `justified` `typescript` `ui-component`
