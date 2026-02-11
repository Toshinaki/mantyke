import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  createVarsResolver,
  factory,
  getBaseValue,
  getSortedBreakpoints,
  getSpacing,
  keys,
  useMantineTheme,
  useProps,
  useStyles,
  type BoxProps,
  type ElementProps,
  type Factory,
  type MantineSpacing,
  type StyleProp,
  type StylesApiProps,
} from '@mantine/core';
import classes from './masonry.module.css';

export type MasonryStylesNames = 'root' | 'column' | 'item';
export type MasonryCssVariables = {
  root: '--masonry-columns' | '--masonry-gap';
};

export interface MasonryProps
  extends BoxProps, StylesApiProps<MasonryFactory>, ElementProps<'div'> {
  /** Layout variant, 'masonry' by default */
  variant?: 'masonry' | 'columns' | 'rows';

  /** Number of columns, 3 by default. Used by 'masonry' and 'columns' variants. Supports Mantine responsive object syntax. */
  columns?: StyleProp<number>;

  /** Number of rows, 2 by default. Only used by 'rows' variant. */
  rows?: number;

  /** Gap between items, 'md' by default. Supports Mantine responsive object syntax. */
  gap?: StyleProp<MantineSpacing>;

  /** Content to render */
  children: React.ReactNode;
}

export type MasonryFactory = Factory<{
  props: MasonryProps;
  ref: HTMLDivElement;
  stylesNames: MasonryStylesNames;
  vars: MasonryCssVariables;
}>;

const defaultProps: Partial<MasonryProps> = {
  variant: 'masonry',
  columns: 3,
  rows: 2,
  gap: 'md',
};

const varsResolver = createVarsResolver<MasonryFactory>((_, { columns, gap }) => ({
  root: {
    '--masonry-columns': getBaseValue(columns)?.toString() ?? '3',
    '--masonry-gap': getSpacing(getBaseValue(gap)),
  },
}));

// ── Shared utilities ────────────────────────────────────────────────────────

/** Renders responsive CSS variables via media queries */
function MasonryVariables({
  columns,
  gap,
  selector,
}: {
  columns: StyleProp<number> | undefined;
  gap: StyleProp<MantineSpacing> | undefined;
  selector: string;
}) {
  const theme = useMantineTheme();
  const queries: Record<string, Record<string, string>> = {};

  keys(theme.breakpoints).forEach((breakpoint) => {
    if (
      typeof columns === 'object' &&
      columns !== null &&
      (columns as Record<string, number>)[breakpoint] !== undefined
    ) {
      if (!queries[breakpoint]) {
        queries[breakpoint] = {};
      }
      queries[breakpoint]['--masonry-columns'] = (columns as Record<string, number>)[
        breakpoint
      ].toString();
    }
    if (
      typeof gap === 'object' &&
      gap !== null &&
      (gap as Record<string, MantineSpacing>)[breakpoint] !== undefined
    ) {
      if (!queries[breakpoint]) {
        queries[breakpoint] = {};
      }
      const spacing = getSpacing((gap as Record<string, MantineSpacing>)[breakpoint]);
      if (spacing) {
        queries[breakpoint]['--masonry-gap'] = spacing;
      }
    }
  });

  const sortedBreakpoints = getSortedBreakpoints(keys(queries), theme.breakpoints).filter(
    (bp) => keys(queries[bp.value]).length > 0
  );

  if (sortedBreakpoints.length === 0) {
    return null;
  }

  const css = sortedBreakpoints
    .map((bp) => {
      const styles = Object.entries(queries[bp.value])
        .map(([prop, val]) => `${prop}:${val}`)
        .join(';');
      return `@media(min-width:${theme.breakpoints[bp.value]}){${selector}{${styles}}}`;
    })
    .join('');

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Measure aspect ratios of children via ResizeObserver */
function useItemRatios(count: number) {
  const [ratios, setRatios] = useState<Map<number, number>>(new Map());
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const setItemRef = useCallback((index: number, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(index, node);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setRatios((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const entry of entries) {
          const el = entry.target as HTMLDivElement;
          const index = Number(el.dataset.masonryIndex);
          if (!isNaN(index)) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              const r = width / height;
              if (next.get(index) !== r) {
                next.set(index, r);
                changed = true;
              }
            }
          }
        }
        return changed ? next : prev;
      });
    });

    itemRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  });

  const allMeasured = count > 0 && ratios.size >= count;
  return { ratios, allMeasured, setItemRef };
}

/** Measure container width and gap in px */
function useContainerMetrics(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [gapPx, setGapPx] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);

    const computed = getComputedStyle(node);
    const gapValue = parseFloat(computed.rowGap || computed.gap || '0');
    setGapPx(gapValue);

    return () => observer.disconnect();
  }, [containerRef]);

  return { containerWidth, gapPx };
}

/** Combine forwarded ref with internal ref */
function useCombinedRef(
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
  internalRef: React.MutableRefObject<HTMLDivElement | null>
) {
  return useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [forwardedRef, internalRef]
  );
}

/** Render hidden measuring container */
function MeasuringContainer({
  children,
  setItemRef,
}: {
  children: React.ReactNode[];
  setItemRef: (index: number, node: HTMLDivElement | null) => void;
}) {
  return (
    <div style={{ visibility: 'hidden', position: 'absolute', display: 'flex', flexWrap: 'wrap' }}>
      {children.map((child, i) => (
        <div key={i} ref={(node) => setItemRef(i, node)} data-masonry-index={i}>
          {child}
        </div>
      ))}
    </div>
  );
}

// ── Layout algorithms ───────────────────────────────────────────────────────

/**
 * Rows layout: distribute items into N rows.
 * Each row fills the full container width. Row height adjusts per row.
 * Formula: rowHeight = (containerWidth - (n-1)*gap) / Σ(aspectRatios)
 *
 * Uses target ratio sum per row for balanced height distribution,
 * with a mustAdvance constraint to ensure every row gets at least one item.
 */
function computeRowsLayout(
  ratios: Map<number, number>,
  count: number,
  containerWidth: number,
  gapPx: number,
  rowCount: number
): { indices: number[]; height: number }[] {
  // Compute target ratio sum per row for balanced height distribution
  let totalRatioSum = 0;
  for (let i = 0; i < count; i++) {
    totalRatioSum += ratios.get(i) ?? 1;
  }
  const targetRatioSum = totalRatioSum / rowCount;

  // Greedily distribute items into rows
  const rows: { indices: number[]; height: number }[] = [];
  let currentRow: number[] = [];
  let ratioSum = 0;

  for (let i = 0; i < count; i++) {
    currentRow.push(i);
    ratioSum += ratios.get(i) ?? 1;

    const remainingItems = count - i - 1;
    const remainingRows = rowCount - rows.length - 1;
    const mustAdvance = remainingItems > 0 && remainingItems <= remainingRows;

    if (rows.length < rowCount - 1 && (mustAdvance || ratioSum >= targetRatioSum)) {
      const finalGaps = (currentRow.length - 1) * gapPx;
      const height = (containerWidth - finalGaps) / ratioSum;
      rows.push({ indices: currentRow, height });
      currentRow = [];
      ratioSum = 0;
    }
  }

  // Last row
  if (currentRow.length > 0) {
    const finalGaps = (currentRow.length - 1) * gapPx;
    const height = (containerWidth - finalGaps) / ratioSum;
    rows.push({ indices: currentRow, height });
  }

  return rows;
}

/**
 * Columns layout: distribute items into N columns with equal total height.
 * Each column can have different width based on harmonic mean of aspect ratios.
 *
 * Algorithm:
 * 1. Estimate target column height
 * 2. Greedily assign items to columns until column height reaches target
 * 3. Compute column widths via harmonic mean ratios so all columns have same height
 *
 * Column ratio (harmonic mean): columnRatio = 1 / Σ(1/aspectRatio)
 * Column width: proportional to columnRatio
 */
function computeColumnsLayout(
  ratios: Map<number, number>,
  count: number,
  containerWidth: number,
  gapPx: number,
  colCount: number
): { indices: number[]; width: number }[] {
  // Step 1: estimate target column height using equal-width assumption
  const equalColWidth = (containerWidth - (colCount - 1) * gapPx) / colCount;
  let totalHeight = 0;
  for (let i = 0; i < count; i++) {
    totalHeight += equalColWidth / (ratios.get(i) ?? 1);
  }
  // Add inter-item gaps: total (count - colCount) gaps distributed across columns
  const totalItemGaps = (count - colCount) * gapPx;
  const targetColumnHeight = (totalHeight + totalItemGaps) / colCount;

  // Step 2: greedily distribute items into columns
  const columnIndices: number[][] = Array.from({ length: colCount }, () => []);
  let col = 0;
  let colHeight = 0;

  for (let i = 0; i < count; i++) {
    columnIndices[col].push(i);
    colHeight += equalColWidth / (ratios.get(i) ?? 1);
    if (columnIndices[col].length > 1) {
      colHeight += gapPx;
    }

    // Move to next column if we've reached target height (except last column),
    // or if remaining items must be reserved for remaining columns
    const remainingItems = count - i - 1;
    const remainingCols = colCount - col - 1;
    const mustAdvance = remainingItems > 0 && remainingItems <= remainingCols;

    if (col < colCount - 1 && (mustAdvance || colHeight >= targetColumnHeight)) {
      col++;
      colHeight = 0;
    }
  }

  // Step 3: compute column widths via harmonic mean ratios
  const columnRatios: number[] = [];
  const columnGaps: number[] = [];

  for (let c = 0; c < colCount; c++) {
    const items = columnIndices[c];
    if (items.length === 0) {
      columnRatios.push(0);
      columnGaps.push(0);
      continue;
    }
    // Harmonic mean: 1 / Σ(1/ratio)
    let invSum = 0;
    for (const idx of items) {
      invSum += 1 / (ratios.get(idx) ?? 1);
    }
    columnRatios.push(1 / invSum);
    columnGaps.push((items.length - 1) * gapPx);
  }

  const totalRatio = columnRatios.reduce((sum, r) => sum + r, 0);
  if (totalRatio === 0) {
    return [];
  }

  // Compute adjusted gaps and widths
  const result: { indices: number[]; width: number }[] = [];
  for (let c = 0; c < colCount; c++) {
    if (columnIndices[c].length === 0) {
      continue;
    }

    let adjustedGaps = 0;
    for (let j = 0; j < colCount; j++) {
      adjustedGaps += (columnGaps[c] - columnGaps[j]) * columnRatios[j];
    }

    const columnWidth =
      ((containerWidth - (colCount - 1) * gapPx - adjustedGaps) * columnRatios[c]) / totalRatio;

    result.push({ indices: columnIndices[c], width: columnWidth });
  }

  return result;
}

// ── Main component ──────────────────────────────────────────────────────────

export const Masonry = factory<MasonryFactory>((_props, ref) => {
  const props = useProps('Masonry', defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    vars,
    variant = 'masonry',
    columns = 3,
    rows: rowCount = 2,
    gap,
    children,
    ...others
  } = props;

  const getStyles = useStyles<MasonryFactory>({
    name: 'Masonry',
    classes,
    props,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    varsResolver,
  });

  const childArray = React.Children.toArray(children);

  if (variant === 'columns') {
    return (
      <ColumnsVariant
        ref={ref}
        getStyles={getStyles}
        columns={columns}
        gap={gap}
        variant={variant}
        others={others}
      >
        {childArray}
      </ColumnsVariant>
    );
  }

  if (variant === 'rows') {
    return (
      <RowsVariant
        ref={ref}
        getStyles={getStyles}
        rowCount={rowCount}
        gap={gap}
        columns={columns}
        variant={variant}
        others={others}
      >
        {childArray}
      </RowsVariant>
    );
  }

  // masonry variant (default)
  return (
    <MasonryVariant
      ref={ref}
      getStyles={getStyles}
      columns={columns}
      gap={gap}
      variant={variant}
      others={others}
    >
      {childArray}
    </MasonryVariant>
  );
});

Masonry.displayName = 'Masonry';
Masonry.classes = classes;

// ── Variant components ──────────────────────────────────────────────────────

type VariantProps = {
  getStyles: ReturnType<typeof useStyles<MasonryFactory>>;
  columns: StyleProp<number>;
  gap: StyleProp<MantineSpacing> | undefined;
  variant: string;
  others: Record<string, unknown>;
  children: React.ReactNode[];
};

/** Masonry variant: shortest-column algorithm with ResizeObserver height tracking */
const MasonryVariant = React.forwardRef<HTMLDivElement, VariantProps>(
  ({ getStyles, columns, gap, variant, others, children }, ref) => {
    const colCount = typeof columns === 'number' ? columns : (getBaseValue(columns) ?? 3);
    const [heights, setHeights] = useState<Map<number, number>>(new Map());
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const setItemRef = useCallback((index: number, node: HTMLDivElement | null) => {
      if (node) {
        itemRefs.current.set(index, node);
      } else {
        itemRefs.current.delete(index);
      }
    }, []);

    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        setHeights((prev) => {
          const next = new Map(prev);
          let changed = false;
          for (const entry of entries) {
            const el = entry.target as HTMLDivElement;
            const index = Number(el.dataset.masonryIndex);
            if (!isNaN(index)) {
              const h = entry.contentRect.height;
              if (next.get(index) !== h) {
                next.set(index, h);
                changed = true;
              }
            }
          }
          return changed ? next : prev;
        });
      });

      itemRefs.current.forEach((node) => observer.observe(node));
      return () => observer.disconnect();
    });

    const columnItems: React.ReactNode[][] = Array.from({ length: colCount }, () => []);
    const columnHeights = new Array(colCount).fill(0);

    children.forEach((child, i) => {
      const shortest = columnHeights.indexOf(Math.min(...columnHeights));
      columnItems[shortest].push(
        <div
          key={i}
          ref={(node) => setItemRef(i, node)}
          data-masonry-index={i}
          {...getStyles('item')}
        >
          {child}
        </div>
      );
      columnHeights[shortest] += heights.get(i) ?? 0;
    });

    return (
      <Box ref={ref} variant={variant} {...getStyles('root')} {...others}>
        <MasonryVariables columns={columns} gap={gap} selector="[data-masonry-id]" />
        {columnItems.map((items, colIndex) => (
          <div key={colIndex} {...getStyles('column')}>
            {items}
          </div>
        ))}
      </Box>
    );
  }
);

MasonryVariant.displayName = 'MasonryVariant';

/**
 * Columns variant: justified columns with variable width.
 * All columns end up at approximately the same total height.
 * Column widths are proportional to the harmonic mean of their items' aspect ratios.
 */
const ColumnsVariant = React.forwardRef<HTMLDivElement, VariantProps>(
  ({ getStyles, columns, gap, variant, others, children }, ref) => {
    const colCount = typeof columns === 'number' ? columns : (getBaseValue(columns) ?? 3);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const setRef = useCombinedRef(ref, containerRef);
    const { containerWidth, gapPx } = useContainerMetrics(containerRef);
    const { ratios, allMeasured, setItemRef } = useItemRatios(children.length);

    const ready = allMeasured && containerWidth > 0;
    const cols = ready
      ? computeColumnsLayout(ratios, children.length, containerWidth, gapPx, colCount)
      : [];

    return (
      <Box ref={setRef} variant={variant} {...getStyles('root')} {...others}>
        <MasonryVariables columns={columns} gap={gap} selector="[data-masonry-id]" />
        {ready ? (
          cols.map((col, colIndex) => (
            <div key={colIndex} {...getStyles('column')} style={{ width: col.width }}>
              {col.indices.map((childIndex) => {
                const ratio = ratios.get(childIndex) ?? 1;
                return (
                  <div
                    key={childIndex}
                    {...getStyles('item')}
                    data-variant="columns"
                    style={{ height: col.width / ratio }}
                  >
                    {children[childIndex]}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <MeasuringContainer setItemRef={setItemRef}>{children}</MeasuringContainer>
        )}
      </Box>
    );
  }
);

ColumnsVariant.displayName = 'ColumnsVariant';

/**
 * Rows variant: justified rows.
 * Each row fills the full container width. Row heights vary per row.
 * All items in a row share the same height, widths scale by aspect ratio.
 */
const RowsVariant = React.forwardRef<HTMLDivElement, VariantProps & { rowCount: number }>(
  ({ getStyles, rowCount, gap, columns, variant, others, children }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const setRef = useCombinedRef(ref, containerRef);
    const { containerWidth, gapPx } = useContainerMetrics(containerRef);
    const { ratios, allMeasured, setItemRef } = useItemRatios(children.length);

    const ready = allMeasured && containerWidth > 0;
    const rows = ready
      ? computeRowsLayout(ratios, children.length, containerWidth, gapPx, rowCount)
      : [];

    return (
      <Box ref={setRef} variant={variant} {...getStyles('root')} {...others}>
        <MasonryVariables columns={columns} gap={gap} selector="[data-masonry-id]" />
        {ready ? (
          rows.map((row, rowIndex) => (
            <div key={rowIndex} {...getStyles('column')}>
              {row.indices.map((childIndex) => {
                const ratio = ratios.get(childIndex) ?? 1;
                return (
                  <div
                    key={childIndex}
                    {...getStyles('item')}
                    data-variant="rows"
                    style={{
                      width: ratio * row.height,
                      height: row.height,
                    }}
                  >
                    {children[childIndex]}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <MeasuringContainer setItemRef={setItemRef}>{children}</MeasuringContainer>
        )}
      </Box>
    );
  }
);

RowsVariant.displayName = 'RowsVariant';
