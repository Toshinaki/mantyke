import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  factory,
  filterProps,
  getBaseValue,
  getSortedBreakpoints,
  getSpacing,
  InlineStyles,
  keys,
  useMantineTheme,
  useMatches,
  useProps,
  useRandomClassName,
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

const DEFAULT_COLUMNS = 3;

const defaultProps: Partial<MasonryProps> = {
  variant: 'masonry',
  columns: DEFAULT_COLUMNS,
  rows: 2,
  gap: 'md',
};

// ── Shared utilities ────────────────────────────────────────────────────────

interface MasonryVariablesProps {
  columns: StyleProp<number> | undefined;
  gap: StyleProp<MantineSpacing> | undefined;
  selector: string;
}

/**
 * 输出基础值与各断点的 CSS 变量，选择器限定为当前实例。
 * 基础值也写在这里而不是内联 style 上，否则媒体查询无法覆盖内联样式。
 */
function MasonryVariables({ columns, gap, selector }: MasonryVariablesProps) {
  const theme = useMantineTheme();
  const baseStyles = filterProps({
    '--masonry-columns': getBaseValue(columns)?.toString(),
    '--masonry-gap': getSpacing(getBaseValue(gap)),
  });
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

  const media = getSortedBreakpoints(keys(queries), theme.breakpoints)
    .filter((bp) => keys(queries[bp.value]).length > 0)
    .map((bp) => ({
      query: `(min-width: ${theme.breakpoints[bp.value]})`,
      styles: queries[bp.value] as React.CSSProperties,
    }));

  return (
    <InlineStyles styles={baseStyles as React.CSSProperties} media={media} selector={selector} />
  );
}

/** 按当前视口所在的断点解析响应式列数，布局计算需要在 JS 中知道实际列数 */
function useColumnCount(columns: StyleProp<number>) {
  const payload: Record<string, number | undefined> =
    typeof columns === 'number' ? { base: columns } : columns;
  return useMatches<number | undefined>(payload) ?? DEFAULT_COLUMNS;
}

/**
 * 子元素的稳定标识。测量结果按标识缓存，而不是按下标，
 * 否则删除或重排子元素后会把别的元素的宽高比套到当前元素上。
 */
function getChildKey(child: React.ReactNode, index: number) {
  return React.isValidElement(child) && child.key !== null ? String(child.key) : String(index);
}

interface KeyedChild {
  key: string;
  child: React.ReactNode;
}

function toKeyedChildren(children: React.ReactNode[]): KeyedChild[] {
  return children.map((child, index) => ({ key: getChildKey(child, index), child }));
}

/** Measure aspect ratios of children via ResizeObserver, keyed by child key */
function useItemRatios() {
  const [ratios, setRatios] = useState<Map<string, number>>(new Map());
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setItemRef = useCallback((key: string, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(key, node);
    } else {
      itemRefs.current.delete(key);
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setRatios((prev) => {
        let next: Map<string, number> | null = null;
        for (const entry of entries) {
          const key = (entry.target as HTMLDivElement).dataset.masonryKey;
          const { width, height } = entry.contentRect;
          if (key !== undefined && width > 0 && height > 0) {
            const ratio = width / height;
            if (prev.get(key) !== ratio) {
              next = next ?? new Map(prev);
              next.set(key, ratio);
            }
          }
        }
        return next ?? prev;
      });
    });

    itemRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  });

  return { ratios, setItemRef };
}

/**
 * Measure container width and gap in px.
 * gap 在每次容器尺寸变化以及 `gapKey` 变化时重新读取，覆盖响应式间距与运行时修改间距两种情况。
 */
function useContainerMetrics(containerRef: React.RefObject<HTMLDivElement | null>, gapKey: string) {
  const [metrics, setMetrics] = useState({ containerWidth: 0, gapPx: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const readGap = () => {
      const computed = getComputedStyle(node);
      return parseFloat(computed.rowGap || computed.gap) || 0;
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMetrics({ containerWidth: entry.contentRect.width, gapPx: readGap() });
      }
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [containerRef, gapKey]);

  return metrics;
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

interface MeasuringContainerProps {
  items: KeyedChild[];
  setItemRef: (key: string, node: HTMLDivElement | null) => void;
}

/**
 * Render hidden measuring container.
 * 只放尚未测量到尺寸的子元素；已测量的子元素先参与布局，不必等待其余子元素加载完成。
 */
function MeasuringContainer({ items, setItemRef }: MeasuringContainerProps) {
  return (
    <div style={{ visibility: 'hidden', position: 'absolute', display: 'flex', flexWrap: 'wrap' }}>
      {items.map(({ key, child }) => (
        <div key={key} ref={(node) => setItemRef(key, node)} data-masonry-key={key}>
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
  ratios: number[],
  containerWidth: number,
  gapPx: number,
  rowCount: number
): { indices: number[]; height: number }[] {
  const count = ratios.length;
  // Compute target ratio sum per row for balanced height distribution
  const totalRatioSum = ratios.reduce((sum, ratio) => sum + ratio, 0);
  const targetRatioSum = totalRatioSum / rowCount;

  // Greedily distribute items into rows
  const rows: { indices: number[]; height: number }[] = [];
  let currentRow: number[] = [];
  let ratioSum = 0;

  for (let i = 0; i < count; i++) {
    currentRow.push(i);
    ratioSum += ratios[i];

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
  ratios: number[],
  containerWidth: number,
  gapPx: number,
  colCount: number
): { indices: number[]; width: number }[] {
  const count = ratios.length;
  // Step 1: estimate target column height using equal-width assumption
  const equalColWidth = (containerWidth - (colCount - 1) * gapPx) / colCount;
  let totalHeight = 0;
  for (let i = 0; i < count; i++) {
    totalHeight += equalColWidth / ratios[i];
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
    colHeight += equalColWidth / ratios[i];
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
      invSum += 1 / ratios[idx];
    }
    columnRatios.push(1 / invSum);
    columnGaps.push((items.length - 1) * gapPx);
  }

  const totalRatio = columnRatios.reduce((sum, r) => sum + r, 0);
  if (totalRatio === 0) {
    return [];
  }

  // 空列不渲染，也不占用间距
  const usedCols = columnIndices.filter((items) => items.length > 0).length;

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
      ((containerWidth - (usedCols - 1) * gapPx - adjustedGaps) * columnRatios[c]) / totalRatio;

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
    columns = DEFAULT_COLUMNS,
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
  });

  const responsiveClassName = useRandomClassName();
  const childArray = React.Children.toArray(children);
  const variantProps = {
    ref,
    getStyles,
    responsiveClassName,
    columns,
    gap,
    variant,
    others,
  };

  if (variant === 'columns') {
    return <ColumnsVariant {...variantProps}>{childArray}</ColumnsVariant>;
  }

  if (variant === 'rows') {
    return (
      <RowsVariant {...variantProps} rowCount={rowCount}>
        {childArray}
      </RowsVariant>
    );
  }

  // masonry variant (default)
  return <MasonryVariant {...variantProps}>{childArray}</MasonryVariant>;
});

Masonry.displayName = 'Masonry';
Masonry.classes = classes;

// ── Variant components ──────────────────────────────────────────────────────

type VariantProps = {
  getStyles: ReturnType<typeof useStyles<MasonryFactory>>;
  /** 当前实例专属的 class，响应式 CSS 变量的选择器依赖它 */
  responsiveClassName: string;
  columns: StyleProp<number>;
  gap: StyleProp<MantineSpacing> | undefined;
  variant: string;
  others: Record<string, unknown>;
  children: React.ReactNode[];
};

/** Masonry variant: shortest-column algorithm with ResizeObserver height tracking */
const MasonryVariant = React.forwardRef<HTMLDivElement, VariantProps>(
  ({ getStyles, responsiveClassName, columns, gap, variant, others, children }, ref) => {
    const colCount = useColumnCount(columns);
    const [heights, setHeights] = useState<Map<string, number>>(new Map());
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const setItemRef = useCallback((key: string, node: HTMLDivElement | null) => {
      if (node) {
        itemRefs.current.set(key, node);
      } else {
        itemRefs.current.delete(key);
      }
    }, []);

    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        setHeights((prev) => {
          const next = new Map(prev);
          let changed = false;
          for (const entry of entries) {
            const key = (entry.target as HTMLDivElement).dataset.masonryKey;
            if (key !== undefined) {
              const h = entry.contentRect.height;
              if (next.get(key) !== h) {
                next.set(key, h);
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

    toKeyedChildren(children).forEach(({ key, child }) => {
      const shortest = columnHeights.indexOf(Math.min(...columnHeights));
      columnItems[shortest].push(
        <div
          key={key}
          ref={(node) => setItemRef(key, node)}
          data-masonry-key={key}
          {...getStyles('item')}
        >
          {child}
        </div>
      );
      columnHeights[shortest] += heights.get(key) ?? 0;
    });

    return (
      <Box
        ref={ref}
        variant={variant}
        {...getStyles('root', { className: responsiveClassName })}
        {...others}
      >
        <MasonryVariables columns={columns} gap={gap} selector={`.${responsiveClassName}`} />
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

/** 把子元素分为已测量与未测量两组，已测量的一组附带宽高比 */
function splitByMeasured(children: React.ReactNode[], ratios: Map<string, number>) {
  const keyed = toKeyedChildren(children);
  const measured = keyed.filter(({ key }) => ratios.has(key));
  return {
    measured,
    measuredRatios: measured.map(({ key }) => ratios.get(key)!),
    pending: keyed.filter(({ key }) => !ratios.has(key)),
  };
}

/**
 * Columns variant: justified columns with variable width.
 * All columns end up at approximately the same total height.
 * Column widths are proportional to the harmonic mean of their items' aspect ratios.
 */
const ColumnsVariant = React.forwardRef<HTMLDivElement, VariantProps>(
  ({ getStyles, responsiveClassName, columns, gap, variant, others, children }, ref) => {
    const colCount = useColumnCount(columns);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const setRef = useCombinedRef(ref, containerRef);
    const { containerWidth, gapPx } = useContainerMetrics(containerRef, JSON.stringify(gap));
    const { ratios, setItemRef } = useItemRatios();
    const { measured, measuredRatios, pending } = splitByMeasured(children, ratios);

    const cols =
      containerWidth > 0 && measured.length > 0
        ? computeColumnsLayout(measuredRatios, containerWidth, gapPx, colCount)
        : [];

    return (
      <Box
        ref={setRef}
        variant={variant}
        {...getStyles('root', { className: responsiveClassName })}
        {...others}
      >
        <MasonryVariables columns={columns} gap={gap} selector={`.${responsiveClassName}`} />
        {cols.map((col, colIndex) => (
          <div key={colIndex} {...getStyles('column')} style={{ width: col.width }}>
            {col.indices.map((index) => (
              <div
                key={measured[index].key}
                {...getStyles('item')}
                data-variant="columns"
                style={{ height: col.width / measuredRatios[index] }}
              >
                {measured[index].child}
              </div>
            ))}
          </div>
        ))}
        {pending.length > 0 && <MeasuringContainer items={pending} setItemRef={setItemRef} />}
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
  ({ getStyles, responsiveClassName, rowCount, gap, columns, variant, others, children }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const setRef = useCombinedRef(ref, containerRef);
    const { containerWidth, gapPx } = useContainerMetrics(containerRef, JSON.stringify(gap));
    const { ratios, setItemRef } = useItemRatios();
    const { measured, measuredRatios, pending } = splitByMeasured(children, ratios);

    const rows =
      containerWidth > 0 && measured.length > 0
        ? computeRowsLayout(measuredRatios, containerWidth, gapPx, rowCount)
        : [];

    return (
      <Box
        ref={setRef}
        variant={variant}
        {...getStyles('root', { className: responsiveClassName })}
        {...others}
      >
        <MasonryVariables columns={columns} gap={gap} selector={`.${responsiveClassName}`} />
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} {...getStyles('column')}>
            {row.indices.map((index) => (
              <div
                key={measured[index].key}
                {...getStyles('item')}
                data-variant="rows"
                style={{
                  width: measuredRatios[index] * row.height,
                  height: row.height,
                }}
              >
                {measured[index].child}
              </div>
            ))}
          </div>
        ))}
        {pending.length > 0 && <MeasuringContainer items={pending} setItemRef={setItemRef} />}
      </Box>
    );
  }
);

RowsVariant.displayName = 'RowsVariant';
