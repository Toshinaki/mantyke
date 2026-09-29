import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, waitFor, within } from 'storybook/test';
import type { MantineSpacing } from '@mantine/core';
import { fixtureSrc, MASONRY_FIXTURES, type ImageFixture } from '../../../.storybook/fixtures';
import {
  click,
  nextFrame,
  press,
  rectOf,
  setViewport,
  waitForStableRects,
  type Rect,
} from '../../../.storybook/test-utils';
import { VIEWPORTS, type ViewportName } from '../../../.storybook/viewports';
import { Masonry, type MasonryProps } from './masonry';

// 用例定义见 docs/ui-test-plan.md 第 5 节。判定标准来自用户体验，不参照当前实现。

type Variant = NonNullable<MasonryProps['variant']>;

/** 位置与尺寸比较的容差，吸收亚像素取整 */
const PX_TOLERANCE = 1;
/** columns 变体各列底部允许的高度差 */
const COLUMN_BOTTOM_TOLERANCE = 2;
/** 判定图片变形的宽高比相对容差 */
const DISTORTION_TOLERANCE = 0.01;
/**
 * 每个方向允许裁掉的比例上限（两侧合计）。
 * 每侧裁掉不超过 5% 时，四角的三角标记（边长为短边的 12%）仍然大部分可见。
 */
const MAX_CROP = 0.1;
/** 判定两个矩形在某一方向上「相邻」所需的最小重叠 */
const MIN_OVERLAP = 1;
/** 逐帧观察加载过程的帧数 */
const OBSERVE_FRAMES = 60;
/** 模拟逐张加载时单张图片的最大延迟 */
const MAX_LOAD_DELAY = 1200;
/** 文字卡片的高度范围 */
const CARD_MIN_HEIGHT = 80;
const CARD_MAX_HEIGHT = 400;
const CARD_COUNT = 12;
/** 展开卡片时增加的高度 */
const CARD_EXPAND = 300;
const APPEND_COUNT = 6;
/** 测试默认使用的列数与行数 */
const DEFAULT_COLUMNS = 3;
const DEFAULT_ROWS = 3;
const TEST_ID = 'masonry';

const CONTROLS = {
  mount: '显示组件',
  append: `追加 ${APPEND_COUNT} 项`,
  removeFirst: '删除第 1 项',
  moveFirstToEnd: '第 1 项移到末尾',
  replaceFirst: '替换第 1 项为 1:3 图片',
  moreColumns: '列数改为 5',
  moreRows: '行数改为 4',
  expandFirstCard: '展开第 1 张卡片',
  gap: (size: MantineSpacing) => `间距改为 ${size}`,
} as const;

const GAP_OPTIONS: MantineSpacing[] = ['xs', 'md', 'xl'];

// ---------------------------------------------------------------------------
// 场景
// ---------------------------------------------------------------------------

interface SceneItem {
  id: string;
  fixture?: ImageFixture;
  cardHeight?: number;
  isBroken?: boolean;
  loadDelay?: number;
}

/** 为每张卡片生成一个确定的高度，避免随机数导致截图不稳定 */
function cardHeight(index: number) {
  const span = CARD_MAX_HEIGHT - CARD_MIN_HEIGHT;
  return CARD_MIN_HEIGHT + ((index * 97) % (span + 1));
}

function createPhotos(count = MASONRY_FIXTURES.length, suffix = ''): SceneItem[] {
  return MASONRY_FIXTURES.slice(0, count).map((fixture) => ({
    id: `${fixture.name}${suffix}`,
    fixture,
  }));
}

function createCards(): SceneItem[] {
  return Array.from({ length: CARD_COUNT }, (_, index) => ({
    id: `card-${index + 1}`,
    cardHeight: cardHeight(index),
  }));
}

interface PhotoProps {
  item: SceneItem;
  hasDimensions: boolean;
  /** 模拟网络延迟：为 true 时图片尚未开始加载 */
  isPending: boolean;
}

function Photo({ item, hasDimensions, isPending }: PhotoProps) {
  const fixture = item.fixture!;
  const src = item.isBroken ? '/fixtures/does-not-exist.jpg' : fixtureSrc(fixture);
  return (
    <img
      data-item={item.id}
      data-ratio={fixture.width / fixture.height}
      src={isPending ? undefined : src}
      alt=""
      width={hasDimensions ? fixture.width : undefined}
      height={hasDimensions ? fixture.height : undefined}
      style={{ display: 'block' }}
    />
  );
}

function noteLabel(id: string) {
  return `${id} 备注`;
}

interface CardProps {
  item: SceneItem;
  isExpanded: boolean;
}

function Card({ item, isExpanded }: CardProps) {
  const height = item.cardHeight! + (isExpanded ? CARD_EXPAND : 0);
  return (
    <div
      data-item={item.id}
      style={{
        height,
        padding: 12,
        boxSizing: 'border-box',
        borderRadius: 8,
        background: 'linear-gradient(135deg, #e7f5ff, #d0bfff)',
        font: '600 16px sans-serif',
      }}
    >
      <div>
        {item.id}（{height}px）
      </div>
      <input aria-label={noteLabel(item.id)} style={{ width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}

interface SceneProps {
  variant: Variant;
  columns?: MasonryProps['columns'];
  rows?: number;
  gap?: MasonryProps['gap'];
  content?: 'photos' | 'cards';
  /** 图片是否声明 width / height 属性 */
  hasDimensions?: boolean;
  /** 指定下标的图片使用不存在的地址 */
  brokenIndex?: number;
  /** 为 true 时图片按伪随机的顺序延迟加载 */
  hasStaggeredLoading?: boolean;
  /** 为 true 时先不挂载组件，点击按钮后再挂载，便于从第一帧开始观察 */
  isDeferred?: boolean;
  isEmpty?: boolean;
}

function createInitialItems({
  content,
  brokenIndex,
  hasStaggeredLoading,
  isEmpty,
}: Pick<SceneProps, 'content' | 'brokenIndex' | 'hasStaggeredLoading' | 'isEmpty'>) {
  if (isEmpty) {
    return [];
  }
  if (content === 'cards') {
    return createCards();
  }
  return createPhotos().map((item, index) => ({
    ...item,
    isBroken: index === brokenIndex,
    loadDelay: hasStaggeredLoading ? ((index * 7919) % MAX_LOAD_DELAY) + 1 : undefined,
  }));
}

function Scene({
  variant,
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  gap = 'md',
  content = 'photos',
  hasDimensions = true,
  brokenIndex,
  hasStaggeredLoading = false,
  isDeferred = false,
  isEmpty = false,
}: SceneProps) {
  const [initialItems] = useState(() =>
    createInitialItems({ content, brokenIndex, hasStaggeredLoading, isEmpty })
  );
  const [items, setItems] = useState(initialItems);
  // 延迟状态放在场景中而不是图片组件内：组件重新挂载图片时，浏览器会直接读缓存，不应再次等待
  const [pendingIds, setPendingIds] = useState(
    () => new Set(initialItems.filter((item) => item.loadDelay).map((item) => item.id))
  );
  const [currentColumns, setCurrentColumns] = useState(columns);
  const [currentRows, setCurrentRows] = useState(rows);
  const [currentGap, setCurrentGap] = useState(gap);
  const [isMounted, setIsMounted] = useState(!isDeferred);
  const [isFirstCardExpanded, setIsFirstCardExpanded] = useState(false);

  useEffect(() => {
    const timers = initialItems
      .filter((item) => item.loadDelay)
      .map((item) =>
        setTimeout(() => {
          setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }, item.loadDelay)
      );
    return () => timers.forEach(clearTimeout);
  }, [initialItems]);

  const replacement = MASONRY_FIXTURES[8];
  const controls: [string, () => void][] = [
    [CONTROLS.mount, () => setIsMounted(true)],
    [CONTROLS.append, () => setItems((prev) => [...prev, ...createPhotos(APPEND_COUNT, '-extra')])],
    [CONTROLS.removeFirst, () => setItems((prev) => prev.slice(1))],
    [CONTROLS.moveFirstToEnd, () => setItems((prev) => [...prev.slice(1), prev[0]])],
    [
      CONTROLS.replaceFirst,
      () =>
        setItems((prev) => [
          { id: `${replacement.name}-replaced`, fixture: replacement },
          ...prev.slice(1),
        ]),
    ],
    [CONTROLS.moreColumns, () => setCurrentColumns(5)],
    [CONTROLS.moreRows, () => setCurrentRows(4)],
    [CONTROLS.expandFirstCard, () => setIsFirstCardExpanded(true)],
    ...GAP_OPTIONS.map((size): [string, () => void] => [
      CONTROLS.gap(size),
      () => setCurrentGap(size),
    ]),
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {controls.map(([label, handleClick]) => (
          <button key={label} type="button" onClick={handleClick}>
            {label}
          </button>
        ))}
      </div>
      {isMounted && (
        <Masonry
          data-testid={TEST_ID}
          variant={variant}
          columns={currentColumns}
          rows={currentRows}
          gap={currentGap}
        >
          {items.map((item, index) =>
            item.fixture ? (
              <Photo
                key={item.id}
                item={item}
                hasDimensions={hasDimensions && !item.isBroken}
                isPending={pendingIds.has(item.id)}
              />
            ) : (
              <Card key={item.id} item={item} isExpanded={index === 0 && isFirstCardExpanded} />
            )
          )}
        </Masonry>
      )}
    </div>
  );
}

const TWO_INSTANCES = [
  { testId: 'masonry-a', props: { columns: { base: 2 }, rows: 2, gap: { base: 'xs' } } },
  { testId: 'masonry-b', props: { columns: { base: 4 }, rows: 4, gap: { base: 'xl' } } },
] satisfies { testId: string; props: Partial<MasonryProps> }[];

interface TwoInstancesSceneProps {
  variant: Variant;
}

/** 同一页面上的两个实例，使用不同的列数与间距 */
function TwoInstancesScene({ variant }: TwoInstancesSceneProps) {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 48 }}>
      {TWO_INSTANCES.map((config) => (
        <Masonry
          key={config.testId}
          data-testid={config.testId}
          variant={variant}
          {...config.props}
        >
          {createPhotos().map((item) => (
            <Photo key={item.id} item={item} hasDimensions isPending={false} />
          ))}
        </Masonry>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 测量
// ---------------------------------------------------------------------------

interface Item {
  id: string;
  element: HTMLElement;
  rect: Rect;
  /** 原图宽高比；文字卡片为 undefined */
  naturalRatio?: number;
  objectFit: string;
}

function getRoot(testId = TEST_ID) {
  return screen.getByTestId(testId);
}

function queryItemElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
}

function getItems(root: HTMLElement): Item[] {
  return queryItemElements(root).map((element) => ({
    id: element.dataset.item!,
    element,
    rect: rectOf(element),
    naturalRatio: element.dataset.ratio ? Number(element.dataset.ratio) : undefined,
    objectFit: getComputedStyle(element).objectFit,
  }));
}

/** 等待图片加载完成、所有项位置稳定，返回稳定后的各项 */
async function settle(root: HTMLElement) {
  await waitFor(() => {
    root.querySelectorAll('img').forEach((img) => {
      expect(img.getAttribute('src') !== null && img.complete, '图片加载完成').toBe(true);
    });
  });
  await waitForStableRects(() => [root, ...queryItemElements(root)]);
  return getItems(root);
}

/** 读取 Mantine spacing token 的实际像素值 */
function spacingPx(size: MantineSpacing) {
  const probe = document.createElement('div');
  probe.style.width = `var(--mantine-spacing-${size})`;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

function overlap(a1: number, a2: number, b1: number, b2: number) {
  return Math.min(a2, b2) - Math.max(a1, b1);
}

/** 按左边缘把各项分成列，按从左到右排序 */
function groupByColumn(items: Item[]) {
  return groupBy(items, (item) => item.rect.left);
}

/** 按上边缘把各项分成行，按从上到下排序 */
function groupByRow(items: Item[]) {
  return groupBy(items, (item) => item.rect.top);
}

function groupBy(items: Item[], key: (item: Item) => number) {
  const groups: Item[][] = [];
  [...items]
    .sort((a, b) => key(a) - key(b))
    .forEach((item) => {
      const group = groups.find((g) => Math.abs(key(g[0]) - key(item)) <= PX_TOLERANCE);
      if (group) {
        group.push(item);
      } else {
        groups.push([item]);
      }
    });
  return groups;
}

// ---------------------------------------------------------------------------
// 断言
// ---------------------------------------------------------------------------

function expectClose(actual: number, expected: number, tolerance: number, message: string) {
  expect(
    Math.abs(actual - expected),
    `${message}：实际 ${actual}，期望 ${expected}`
  ).toBeLessThanOrEqual(tolerance);
}

/** MA-01：内容完整、全部可见 */
function expectComplete(items: Item[], expectedIds: string[], label: string) {
  expect(items.map((item) => item.id).sort(), `${label} 显示的内容`).toEqual(
    [...expectedIds].sort()
  );
  items.forEach((item) => {
    expect(item.element, `${label} ${item.id} 可见`).toBeVisible();
    expect(item.rect.width * item.rect.height, `${label} ${item.id} 有面积`).toBeGreaterThan(0);
  });
}

/** MA-02：不超出容器，页面无横向滚动条 */
function expectNoOverflow(items: Item[], root: HTMLElement, label: string) {
  const container = rectOf(root);
  items.forEach((item) => {
    expect(item.rect.left, `${label} ${item.id} 左边界`).toBeGreaterThanOrEqual(
      container.left - PX_TOLERANCE
    );
    expect(item.rect.right, `${label} ${item.id} 右边界`).toBeLessThanOrEqual(
      container.right + PX_TOLERANCE
    );
  });
  const { scrollWidth, clientWidth } = document.documentElement;
  expect(scrollWidth, `${label} 横向滚动条`).toBeLessThanOrEqual(clientWidth);
}

function ratioDifference(item: Item) {
  const boxRatio = item.rect.width / item.rect.height;
  return 1 - Math.min(boxRatio, item.naturalRatio!) / Math.max(boxRatio, item.naturalRatio!);
}

/** MA-03：图片按原比例显示，或由 object-fit 保证内容不被拉伸 */
function expectNotDistorted(items: Item[], label: string) {
  items
    .filter((item) => item.naturalRatio && item.objectFit === 'fill')
    .forEach((item) => {
      expect(ratioDifference(item), `${label} ${item.id} 变形`).toBeLessThanOrEqual(
        DISTORTION_TOLERANCE
      );
    });
}

/** MA-04：被 object-fit 裁掉的部分很少 */
function expectLittleCrop(items: Item[], label: string) {
  items
    .filter((item) => item.naturalRatio && item.objectFit === 'cover')
    .forEach((item) => {
      expect(ratioDifference(item), `${label} ${item.id} 裁切比例`).toBeLessThanOrEqual(MAX_CROP);
    });
}

/** MA-05：相邻项之间的水平、垂直间距都等于配置值 */
function expectGaps(items: Item[], gap: number, label: string) {
  items.forEach((item) => {
    const right = items
      .filter(
        (other) =>
          other.rect.left > item.rect.right - PX_TOLERANCE &&
          overlap(item.rect.top, item.rect.bottom, other.rect.top, other.rect.bottom) > MIN_OVERLAP
      )
      .sort((a, b) => a.rect.left - b.rect.left)[0];
    if (right) {
      expectClose(
        right.rect.left - item.rect.right,
        gap,
        PX_TOLERANCE,
        `${label} ${item.id} 右侧间距`
      );
    }

    const below = items
      .filter(
        (other) =>
          other.rect.top > item.rect.bottom - PX_TOLERANCE &&
          overlap(item.rect.left, item.rect.right, other.rect.left, other.rect.right) > MIN_OVERLAP
      )
      .sort((a, b) => a.rect.top - b.rect.top)[0];
    if (below) {
      expectClose(
        below.rect.top - item.rect.bottom,
        gap,
        PX_TOLERANCE,
        `${label} ${item.id} 下方间距`
      );
    }
  });
}

/** 加载过程中任意两项都不重叠 */
function expectNoOverlap(items: Item[], label: string) {
  const visible = items.filter((item) => item.rect.width > 0 && item.rect.height > 0);
  visible.forEach((a, i) => {
    visible.slice(i + 1).forEach((b) => {
      const isOverlapping =
        overlap(a.rect.left, a.rect.right, b.rect.left, b.rect.right) > MIN_OVERLAP &&
        overlap(a.rect.top, a.rect.bottom, b.rect.top, b.rect.bottom) > MIN_OVERLAP;
      expect(isOverlapping, `${label} ${a.id} 与 ${b.id} 重叠`).toBe(false);
    });
  });
}

interface LayoutExpectation {
  variant: Variant;
  gap: number;
  expectedIds: string[];
  columns?: number;
  rows?: number;
  /** 期望的阅读顺序（masonry 变体），默认与 expectedIds 相同 */
  order?: string[];
}

/** 5.2：masonry 变体的排版要求（MA-20 至 MA-22） */
function expectMasonryRules(
  items: Item[],
  root: HTMLElement,
  expectation: LayoutExpectation,
  label: string
) {
  const columns = groupByColumn(items);
  expectColumnCount(columns, items, expectation, label);
  const widths = items.map((item) => item.rect.width);
  expectClose(Math.max(...widths), Math.min(...widths), PX_TOLERANCE, `${label} MA-20 列宽一致`);

  const bottoms = columns.map((column) => Math.max(...column.map((item) => item.rect.bottom)));
  const tallest = Math.max(...items.map((item) => item.rect.height));
  expect(
    Math.max(...bottoms) - Math.min(...bottoms),
    `${label} MA-21 各列底部高度差`
  ).toBeLessThanOrEqual(tallest);

  const order = expectation.order ?? expectation.expectedIds;
  const top = rectOf(root).top;
  order.slice(0, columns.length).forEach((id) => {
    const item = items.find((candidate) => candidate.id === id)!;
    expectClose(item.rect.top, top, PX_TOLERANCE, `${label} MA-22 ${id} 位于第一行`);
  });
  columns.forEach((column) => {
    const sorted = [...column].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    sorted.slice(1).forEach((item, i) => {
      expect(item.rect.top, `${label} MA-22 ${item.id} 在 ${sorted[i].id} 下方`).toBeGreaterThan(
        sorted[i].rect.top
      );
    });
  });
}

function expectColumnCount(
  columns: Item[][],
  items: Item[],
  expectation: LayoutExpectation,
  label: string
) {
  if (expectation.columns !== undefined) {
    expect(columns.length, `${label} 列数`).toBe(Math.min(expectation.columns, items.length));
  }
}

/** 5.2：columns 变体的排版要求（MA-25、MA-26） */
function expectColumnsRules(
  items: Item[],
  root: HTMLElement,
  expectation: LayoutExpectation,
  label: string
) {
  const container = rectOf(root);
  const columns = groupByColumn(items);
  expectColumnCount(columns, items, expectation, label);
  const bottoms = columns.map((column) => Math.max(...column.map((item) => item.rect.bottom)));
  expect(
    Math.max(...bottoms) - Math.min(...bottoms),
    `${label} MA-25 各列底部高度差`
  ).toBeLessThanOrEqual(COLUMN_BOTTOM_TOLERANCE);
  expectClose(
    Math.min(...items.map((item) => item.rect.left)),
    container.left,
    PX_TOLERANCE,
    `${label} MA-26 左边缘`
  );
  expectClose(
    Math.max(...items.map((item) => item.rect.right)),
    container.right,
    PX_TOLERANCE,
    `${label} MA-26 右边缘`
  );
}

/** 5.2：rows 变体的排版要求（MA-27 至 MA-29） */
function expectRowsRules(
  items: Item[],
  root: HTMLElement,
  expectation: LayoutExpectation,
  label: string
) {
  const container = rectOf(root);
  const rows = groupByRow(items);
  if (expectation.rows !== undefined) {
    expect(rows.length, `${label} MA-27 行数`).toBe(Math.min(expectation.rows, items.length));
  }
  rows.forEach((row, index) => {
    const rowLabel = `${label} 第 ${index + 1} 行`;
    expectClose(
      Math.min(...row.map((item) => item.rect.left)),
      container.left,
      PX_TOLERANCE,
      `${rowLabel} MA-28 左边缘`
    );
    expectClose(
      Math.max(...row.map((item) => item.rect.right)),
      container.right,
      PX_TOLERANCE,
      `${rowLabel} MA-28 右边缘`
    );
    const heights = row.map((item) => item.rect.height);
    expectClose(
      Math.max(...heights),
      Math.min(...heights),
      PX_TOLERANCE,
      `${rowLabel} MA-29 高度一致`
    );
  });
}

/** 5.1 与 5.2 的全部要求 */
function expectHealthyLayout(
  items: Item[],
  root: HTMLElement,
  expectation: LayoutExpectation,
  label: string
) {
  expectComplete(items, expectation.expectedIds, label);
  expectNoOverflow(items, root, label);
  expectNotDistorted(items, label);
  expectLittleCrop(items, label);
  expectGaps(items, expectation.gap, label);
  if (expectation.variant === 'masonry') {
    expectMasonryRules(items, root, expectation, label);
  } else if (expectation.variant === 'columns') {
    expectColumnsRules(items, root, expectation, label);
  } else {
    expectRowsRules(items, root, expectation, label);
  }
}

function defaultExpectation(
  variant: Variant,
  ids = createPhotos().map((item) => item.id)
): LayoutExpectation {
  return {
    variant,
    gap: spacingPx('md'),
    expectedIds: ids,
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
  };
}

async function clickControl(label: string) {
  await click(screen.getByRole('button', { name: label }));
}

// ---------------------------------------------------------------------------
// Meta 与按变体生成 story
// ---------------------------------------------------------------------------

const meta: Meta<typeof Scene> = {
  title: 'UI Tests/Masonry',
  component: Scene,
  parameters: { layout: 'fullscreen' },
  args: { variant: 'masonry' },
  beforeEach: async () => {
    await setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  },
};

export default meta;
type Story = StoryObj<typeof Scene>;

const VARIANT_LABELS: Record<Variant, string> = {
  masonry: 'masonry',
  columns: 'columns',
  rows: 'rows',
};

interface VariantCase {
  args?: Partial<SceneProps>;
  play: (variant: Variant) => Promise<void>;
}

/** 为同一条用例生成三种变体的 story */
function variantStories(id: string, title: string, config: VariantCase) {
  const create = (variant: Variant): Story => ({
    name: `${id} ${title}（${VARIANT_LABELS[variant]}）`,
    args: { ...config.args, variant },
    play: () => config.play(variant),
  });
  return { masonry: create('masonry'), columns: create('columns'), rows: create('rows') };
}

// ---------------------------------------------------------------------------
// 5.1 显示效果
// ---------------------------------------------------------------------------

const ma01 = variantStories('MA-01', '内容完整', {
  play: async (variant) => {
    const root = getRoot();
    expectComplete(await settle(root), defaultExpectation(variant).expectedIds, variant);
  },
});
export const MA01Masonry = ma01.masonry;
export const MA01Columns = ma01.columns;
export const MA01Rows = ma01.rows;

const ma02 = variantStories('MA-02', '不超出页面', {
  play: async (variant) => {
    for (const name of ['desktop', 'tablet', 'mobile'] as ViewportName[]) {
      await setViewport(VIEWPORTS[name].width, VIEWPORTS[name].height);
      const root = getRoot();
      expectNoOverflow(await settle(root), root, `${variant} @ ${name}`);
    }
  },
});
export const MA02Masonry = ma02.masonry;
export const MA02Columns = ma02.columns;
export const MA02Rows = ma02.rows;

const ma03 = variantStories('MA-03', '图片不变形', {
  play: async (variant) => {
    expectNotDistorted(await settle(getRoot()), variant);
  },
});
export const MA03Masonry = ma03.masonry;
export const MA03Columns = ma03.columns;
export const MA03Rows = ma03.rows;

const ma04 = variantStories('MA-04', '图片裁切很少', {
  play: async (variant) => {
    expectLittleCrop(await settle(getRoot()), variant);
  },
});
export const MA04Masonry = ma04.masonry;
export const MA04Columns = ma04.columns;
export const MA04Rows = ma04.rows;

const ma05 = variantStories('MA-05', '间距均匀', {
  play: async (variant) => {
    for (const size of GAP_OPTIONS) {
      await clickControl(CONTROLS.gap(size));
      expectGaps(await settle(getRoot()), spacingPx(size), `${variant} gap=${size}`);
    }
  },
});
export const MA05Masonry = ma05.masonry;
export const MA05Columns = ma05.columns;
export const MA05Rows = ma05.rows;

const BROKEN_INDEX = 4;

const ma06 = variantStories('MA-06', '加载失败不影响其他内容', {
  args: { brokenIndex: BROKEN_INDEX },
  play: async (variant) => {
    const root = getRoot();
    await settle(root);
    const brokenId = createPhotos()[BROKEN_INDEX].id;
    const items = getItems(root).filter((item) => item.id !== brokenId);
    const expectation = defaultExpectation(variant);
    expectComplete(
      items,
      expectation.expectedIds.filter((id) => id !== brokenId),
      variant
    );
    expectNoOverflow(items, root, variant);
    expectNotDistorted(items, variant);
    expectLittleCrop(items, variant);
  },
});
export const MA06Masonry = ma06.masonry;
export const MA06Columns = ma06.columns;
export const MA06Rows = ma06.rows;

const ma07 = variantStories('MA-07', '空列表', {
  args: { isEmpty: true },
  play: async () => {
    const root = getRoot();
    await settle(root);
    expect(rectOf(root).height, '不占用高度').toBeLessThanOrEqual(PX_TOLERANCE);
  },
});
export const MA07Masonry = ma07.masonry;
export const MA07Columns = ma07.columns;
export const MA07Rows = ma07.rows;

const ma08 = variantStories('MA-08', '调整窗口大小', {
  play: async (variant) => {
    for (const width of [1280, 820, 375]) {
      await setViewport(width, VIEWPORTS.desktop.height);
      const root = getRoot();
      expectHealthyLayout(
        await settle(root),
        root,
        defaultExpectation(variant),
        `${variant} @ ${width}px`
      );
    }
  },
});
export const MA08Masonry = ma08.masonry;
export const MA08Columns = ma08.columns;
export const MA08Rows = ma08.rows;

/** 视口宽度与该宽度下期望的列数、间距 */
const RESPONSIVE_CASES = [
  { width: 500, columns: 1, gap: 'sm' },
  { width: 800, columns: 2, gap: 'sm' },
  { width: 1000, columns: 3, gap: 'md' },
  { width: 1280, columns: 4, gap: 'lg' },
] satisfies { width: number; columns: number; gap: MantineSpacing }[];

const RESPONSIVE_ARGS: Partial<SceneProps> = {
  columns: { base: 1, sm: 2, md: 3, lg: 4 },
  gap: { base: 'sm', md: 'md', lg: 'lg' },
};

const ma09 = variantStories('MA-09', '响应式列数', {
  args: RESPONSIVE_ARGS,
  play: async (variant) => {
    for (const { width, columns } of RESPONSIVE_CASES) {
      await setViewport(width, VIEWPORTS.desktop.height);
      const items = await settle(getRoot());
      expect(groupByColumn(items).length, `${variant} @ ${width}px 列数`).toBe(columns);
    }
  },
});
export const MA09Masonry = ma09.masonry;
export const MA09Columns = ma09.columns;

const ma10 = variantStories('MA-10', '响应式间距', {
  args: RESPONSIVE_ARGS,
  play: async (variant) => {
    for (const { width, gap } of RESPONSIVE_CASES.filter((item) => item.width >= 800)) {
      await setViewport(width, VIEWPORTS.desktop.height);
      expectGaps(await settle(getRoot()), spacingPx(gap), `${variant} @ ${width}px`);
    }
  },
});
export const MA10Masonry = ma10.masonry;
export const MA10Columns = ma10.columns;
export const MA10Rows = ma10.rows;

function twoInstancesStory(variant: Variant): StoryObj<typeof TwoInstancesScene> {
  return {
    name: `MA-11 同页多个实例互不影响（${VARIANT_LABELS[variant]}）`,
    render: () => <TwoInstancesScene variant={variant} />,
    play: async () => {
      for (const { testId, props } of TWO_INSTANCES) {
        const root = getRoot(testId);
        const items = await settle(root);
        const label = `${variant} ${testId}`;
        expectGaps(items, spacingPx(props.gap.base), label);
        if (variant === 'rows') {
          expect(groupByRow(items).length, `${label} 行数`).toBe(props.rows);
        } else {
          expect(groupByColumn(items).length, `${label} 列数`).toBe(props.columns.base);
        }
      }
    },
  };
}
export const MA11Masonry = twoInstancesStory('masonry');
export const MA11Columns = twoInstancesStory('columns');
export const MA11Rows = twoInstancesStory('rows');

// ---------------------------------------------------------------------------
// 5.2 各变体的排版要求
// ---------------------------------------------------------------------------

export const MA20to22: Story = {
  name: 'MA-20 至 MA-22 masonry 变体排版',
  args: { variant: 'masonry' },
  play: async () => {
    const root = getRoot();
    expectMasonryRules(await settle(root), root, defaultExpectation('masonry'), 'masonry');
  },
};

export const MA23: Story = {
  name: 'MA-23 文字卡片也能正常排布',
  args: { variant: 'masonry', content: 'cards' },
  play: async () => {
    const root = getRoot();
    const ids = createCards().map((item) => item.id);
    expectMasonryRules(await settle(root), root, defaultExpectation('masonry', ids), 'cards');
  },
};

export const MA24: Story = {
  name: 'MA-24 卡片内容变化后重新排布',
  args: { variant: 'masonry', content: 'cards' },
  play: async () => {
    const root = getRoot();
    await settle(root);
    await clickControl(CONTROLS.expandFirstCard);
    const items = await settle(root);
    const columns = groupByColumn(items);
    const bottoms = columns.map((column) => Math.max(...column.map((item) => item.rect.bottom)));
    const tallest = Math.max(...items.map((item) => item.rect.height));
    expect(Math.max(...bottoms) - Math.min(...bottoms), '各列底部高度差').toBeLessThanOrEqual(
      tallest
    );
  },
};

export const MA25to26: Story = {
  name: 'MA-25、MA-26 columns 变体排版',
  args: { variant: 'columns' },
  play: async () => {
    const root = getRoot();
    expectColumnsRules(await settle(root), root, defaultExpectation('columns'), 'columns');
  },
};

export const MA27to29: Story = {
  name: 'MA-27 至 MA-29 rows 变体排版',
  args: { variant: 'rows' },
  play: async () => {
    const root = getRoot();
    expectRowsRules(await settle(root), root, defaultExpectation('rows'), 'rows');
  },
};

const ma30 = variantStories('MA-30', '配置的列数或行数多于内容数', {
  args: { columns: 5, rows: 5 },
  play: async (variant) => {
    const root = getRoot();
    await settle(root);
    for (let i = 0; i < MASONRY_FIXTURES.length - 3; i++) {
      await clickControl(CONTROLS.removeFirst);
    }
    const items = await settle(root);
    expect(items.length).toBe(3);
    expectNoOverflow(items, root, variant);
    expectNotDistorted(items, variant);
  },
});
export const MA30Masonry = ma30.masonry;
export const MA30Columns = ma30.columns;
export const MA30Rows = ma30.rows;

// ---------------------------------------------------------------------------
// 5.3 数据变化
// ---------------------------------------------------------------------------

/** 执行一个数据变化操作，然后检查 5.1、5.2 的全部要求 */
function dataChangeStories(
  id: string,
  title: string,
  change: () => Promise<void>,
  expectedIds: () => string[],
  expectation: Partial<LayoutExpectation> = {}
) {
  return variantStories(id, title, {
    play: async (variant) => {
      const root = getRoot();
      await settle(root);
      await change();
      const ids = expectedIds();
      expectHealthyLayout(
        await settle(root),
        root,
        { ...defaultExpectation(variant, ids), order: ids, ...expectation },
        variant
      );
    },
  });
}

const PHOTO_IDS = () => createPhotos().map((item) => item.id);

const ma40 = dataChangeStories(
  'MA-40',
  '加载更多',
  () => clickControl(CONTROLS.append),
  () => [...PHOTO_IDS(), ...createPhotos(APPEND_COUNT, '-extra').map((item) => item.id)]
);
export const MA40Masonry = ma40.masonry;
export const MA40Columns = ma40.columns;
export const MA40Rows = ma40.rows;

export const MA41: Story = {
  name: 'MA-41 加载更多时已有内容不移动（masonry）',
  args: { variant: 'masonry' },
  play: async () => {
    const root = getRoot();
    const before = await settle(root);
    await clickControl(CONTROLS.append);
    const after = await settle(root);
    before.forEach((item) => {
      const moved = after.find((candidate) => candidate.id === item.id)!;
      expectClose(moved.rect.left, item.rect.left, 0, `${item.id} left`);
      expectClose(moved.rect.top, item.rect.top, 0, `${item.id} top`);
    });
  },
};

const ma42 = dataChangeStories(
  'MA-42',
  '删除内容',
  () => clickControl(CONTROLS.removeFirst),
  () => PHOTO_IDS().slice(1)
);
export const MA42Masonry = ma42.masonry;
export const MA42Columns = ma42.columns;
export const MA42Rows = ma42.rows;

const ma43 = dataChangeStories(
  'MA-43',
  '重新排序',
  () => clickControl(CONTROLS.moveFirstToEnd),
  () => [...PHOTO_IDS().slice(1), PHOTO_IDS()[0]]
);
export const MA43Masonry = ma43.masonry;
export const MA43Columns = ma43.columns;
export const MA43Rows = ma43.rows;

const ma44 = dataChangeStories(
  'MA-44',
  '替换图片',
  () => clickControl(CONTROLS.replaceFirst),
  () => [`${MASONRY_FIXTURES[8].name}-replaced`, ...PHOTO_IDS().slice(1)]
);
export const MA44Masonry = ma44.masonry;
export const MA44Columns = ma44.columns;
export const MA44Rows = ma44.rows;

const ma45 = dataChangeStories(
  'MA-45',
  '运行时修改列数或行数',
  async () => {
    await clickControl(CONTROLS.moreColumns);
    await clickControl(CONTROLS.moreRows);
  },
  PHOTO_IDS,
  { columns: 5, rows: 4 }
);
export const MA45Masonry = ma45.masonry;
export const MA45Columns = ma45.columns;
export const MA45Rows = ma45.rows;

const ma46 = variantStories('MA-46', '运行时修改间距', {
  play: async (variant) => {
    const root = getRoot();
    await settle(root);
    await clickControl(CONTROLS.gap('xl'));
    expectHealthyLayout(
      await settle(root),
      root,
      { ...defaultExpectation(variant), gap: spacingPx('xl') },
      variant
    );
  },
});
export const MA46Masonry = ma46.masonry;
export const MA46Columns = ma46.columns;
export const MA46Rows = ma46.rows;

/** 逐帧记录各项位置，返回每一项在「首次可见」之后是否移动过 */
async function observeFrames(root: () => HTMLElement | null, onFrame: (items: Item[]) => void) {
  for (let frame = 0; frame < OBSERVE_FRAMES; frame++) {
    const element = root();
    if (element) {
      onFrame(getItems(element));
    }
    await nextFrame();
  }
}

function isShown(item: Item) {
  return (
    item.rect.width > 0 &&
    item.rect.height > 0 &&
    getComputedStyle(item.element).visibility !== 'hidden'
  );
}

const ma47 = variantStories('MA-47', '已声明尺寸的图片在加载过程中位置稳定', {
  args: { isDeferred: true },
  play: async (variant) => {
    const firstSeen = new Map<string, Rect>();
    const movedIds = new Set<string>();
    const observation = observeFrames(
      () => screen.queryByTestId(TEST_ID),
      (items) => {
        items.filter(isShown).forEach((item) => {
          const first = firstSeen.get(item.id);
          if (!first) {
            firstSeen.set(item.id, item.rect);
          } else if (
            Math.abs(first.left - item.rect.left) > PX_TOLERANCE ||
            Math.abs(first.top - item.rect.top) > PX_TOLERANCE
          ) {
            movedIds.add(item.id);
          }
        });
      }
    );
    await clickControl(CONTROLS.mount);
    await observation;
    expect([...movedIds], `${variant} 出现后又移动过的项`).toEqual([]);
  },
});
export const MA47Masonry = ma47.masonry;
export const MA47Columns = ma47.columns;
export const MA47Rows = ma47.rows;

const ma48 = variantStories('MA-48', '未声明尺寸的图片逐张加载', {
  args: { hasDimensions: false, hasStaggeredLoading: true },
  play: async (variant) => {
    const root = getRoot();
    const deadline = performance.now() + MAX_LOAD_DELAY * 2;
    while (performance.now() < deadline) {
      expectNoOverlap(getItems(root).filter(isShown), `${variant} 加载过程中`);
      await nextFrame();
    }
    expectHealthyLayout(await settle(root), root, defaultExpectation(variant), variant);
  },
});
export const MA48Masonry = ma48.masonry;
export const MA48Columns = ma48.columns;
export const MA48Rows = ma48.rows;

// 已知限制，决定不修复（见 README 的 Item State 一节）：项换列时会被重新挂载，内部状态丢失。
// 从自动测试中排除，保留在 Storybook 中以便人工查看。
export const MA49: Story = {
  name: 'MA-49 重新排布时保留项的状态（masonry）',
  tags: ['!test'],
  args: { variant: 'masonry', content: 'cards' },
  play: async () => {
    const root = getRoot();
    const before = await settle(root);
    for (const item of before) {
      within(root)
        .getByRole('textbox', { name: noteLabel(item.id) })
        .focus();
      await press(item.id);
    }

    await clickControl(CONTROLS.expandFirstCard);
    const after = await settle(root);

    // 场景前提：展开卡片后至少有一张卡片换了列，否则本用例检查不到任何东西
    const columnOf = (items: Item[], id: string) =>
      groupByColumn(items).findIndex((column) => column.some((item) => item.id === id));
    const movedIds = before
      .map((item) => item.id)
      .filter((id) => columnOf(before, id) !== columnOf(after, id));
    expect(movedIds.length, '场景前提：有卡片换列').toBeGreaterThan(0);

    before.forEach((item) => {
      const input = within(root).getByRole('textbox', { name: noteLabel(item.id) });
      expect(input, `${item.id} 已填写的内容`).toHaveValue(item.id);
    });
  },
};
