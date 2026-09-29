import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, waitFor, within } from 'storybook/test';
import { fixtureSrc, SPOTLIGHT_FIXTURES, type ImageFixture } from '../../../.storybook/fixtures';
import {
  click,
  drag,
  nextFrame,
  pointer,
  press,
  rectOf,
  setViewport,
  sleep,
  touch,
  viewportRect,
  waitForStableRect,
  wheel,
  WHEEL_NOTCH,
  type Point,
  type Rect,
} from '../../../.storybook/test-utils';
import { VIEWPORTS, type ViewportName } from '../../../.storybook/viewports';
import { SpotlightImage, type SpotlightImageProps } from './spotlight-image';

// 用例定义见 docs/ui-test-plan.md 第 4 节。判定标准来自用户体验，不参照当前实现。

const { landscape, portrait, small, panorama, tall, huge } = SPOTLIGHT_FIXTURES;
const ALL_FIXTURES: ImageFixture[] = Object.values(SPOTLIGHT_FIXTURES);

/** 大图四边与可视区域边缘至少保留的距离 */
const MIN_MARGIN = 16;
/** 位置与尺寸比较的容差，吸收亚像素取整 */
const PX_TOLERANCE = 1;
/** 拖动跟手判定的容差 */
const FOLLOW_TOLERANCE = 2;
/** 宽高比比较的相对容差 */
const RATIO_TOLERANCE = 0.005;
/** 单次放大至少让边长增加的比例 */
const MIN_ZOOM_STEP = 1.1;
/** 放大到上限时，显示尺寸至少为原始分辨率的倍数 */
const MIN_MAX_ZOOM = 2;
/** 缩到最小时短边的最小值，低于该值视为看不清 */
const MIN_VISIBLE_SIDE = 64;
/** 连续点击放大或缩小的次数，足够到达上限或下限 */
const REPEAT_CLICKS = 30;
/** 判定「到达上限后尺寸不再变化」时检查的末尾点击次数 */
const SETTLED_CLICKS = 3;
/** 以鼠标位置为中心缩放时，指针下方内容允许的偏移 */
const ZOOM_ANCHOR_TOLERANCE = 10;
/** 拖动后放大时，视口中心对应的图片位置允许的漂移（占图片宽度的比例） */
const VIEW_CENTER_DRIFT = 0.05;
/** 模拟一次触控板捏合：事件个数与每个事件的 deltaY */
const PINCH_EVENTS = 20;
const PINCH_DELTA = -5;
const PINCH_MIN_RATIO = 1.2;
const PINCH_MAX_RATIO = 3;
/** 双指缩放判定允许的比例误差 */
const TOUCH_RATIO_TOLERANCE = 0.2;
const TOUCH_STEPS = 10;
/** 判定「没有发生变化」前的等待时间，覆盖动画与防抖 */
const SETTLE_DELAY = 500;
/** 等待查看器中的图片加载并淡入完成的上限 */
const IMAGE_LOAD_TIMEOUT = 5000;

const THUMB_SIZE = { width: 120, height: 80 };
/** 缩略图前后的空白高度，使页面可以滚动 */
const SCROLL_SPACER = 1500;

const LABELS = {
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  reset: 'Reset zoom',
  close: 'Close spotlight',
  enterFullscreen: 'Enter fullscreen',
  exitFullscreen: 'Exit fullscreen',
} as const;

/** 「限制拖动范围」配置（SI-54a） */
const KEEP_IN_VIEW_PROPS: Partial<SpotlightImageProps> = { keepImageInView: true };

interface SceneProps {
  fixtures: ImageFixture[];
  imageProps?: Partial<SpotlightImageProps>;
  isScrollable?: boolean;
}

function Scene({ fixtures, imageProps, isScrollable = false }: SceneProps) {
  return (
    <div style={{ padding: 24 }}>
      {isScrollable && <div style={{ height: SCROLL_SPACER }} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {fixtures.map((fixture) => (
          <SpotlightImage
            key={fixture.name}
            src={fixtureSrc(fixture)}
            alt={fixture.name}
            w={THUMB_SIZE.width}
            h={THUMB_SIZE.height}
            {...imageProps}
          />
        ))}
      </div>
      {isScrollable && <div style={{ height: SCROLL_SPACER }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 查看器操作
// ---------------------------------------------------------------------------

function getThumbnail(fixture: ImageFixture) {
  return screen.getByRole('button', { name: fixture.name });
}

async function findViewer() {
  const dialog = await screen.findByRole('dialog');
  const image = within(dialog).getByRole('img') as HTMLImageElement;
  // 超大图片的解码与淡入可能超过默认的 1 秒等待时间
  await waitFor(
    () => {
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(getComputedStyle(image).opacity).toBe('1');
    },
    { timeout: IMAGE_LOAD_TIMEOUT }
  );
  await waitForStableRect(image);
  return {
    dialog,
    image,
    button: (name: string) => within(dialog).getByRole('button', { name }),
    rect: () => waitForStableRect(image),
  };
}

type Viewer = Awaited<ReturnType<typeof findViewer>>;

async function openViewer(fixture: ImageFixture) {
  await click(getThumbnail(fixture));
  return findViewer();
}

async function waitForViewerClosed() {
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}

async function closeViewer(viewer: Viewer) {
  await click(viewer.button(LABELS.close));
  await waitForViewerClosed();
}

async function clickButton(viewer: Viewer, name: string, times = 1) {
  for (let i = 0; i < times; i++) {
    await click(viewer.button(name));
    await viewer.rect();
  }
  return viewer.rect();
}

function viewCenter(): Point {
  const view = viewportRect();
  return { x: view.centerX, y: view.centerY };
}

/** 视口中某一点对应图片上的相对位置（0 到 1） */
function imagePosition(rect: Rect, point: Point) {
  return { u: (point.x - rect.left) / rect.width, v: (point.y - rect.top) / rect.height };
}

function cursorAt(point: Point) {
  const element = document.elementFromPoint(point.x, point.y);
  return element ? getComputedStyle(element).cursor : '';
}

/** 依次在各视口下打开每张图片并检查，检查结束后关闭查看器 */
async function forEachViewerCase(
  viewports: ViewportName[],
  fixtures: ImageFixture[],
  check: (viewer: Viewer, fixture: ImageFixture, label: string) => Promise<void>
) {
  for (const viewportName of viewports) {
    const { width, height } = VIEWPORTS[viewportName];
    await setViewport(width, height);
    for (const fixture of fixtures) {
      const viewer = await openViewer(fixture);
      await check(viewer, fixture, `${fixture.name} @ ${viewportName}`);
      await closeViewer(viewer);
    }
  }
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

function expectFullyVisible(rect: Rect, label: string) {
  const view = viewportRect();
  const minMargin = MIN_MARGIN - PX_TOLERANCE;
  expect(rect.left, `${label} 左侧留白`).toBeGreaterThanOrEqual(minMargin);
  expect(rect.top, `${label} 上方留白`).toBeGreaterThanOrEqual(minMargin);
  expect(view.width - rect.right, `${label} 右侧留白`).toBeGreaterThanOrEqual(minMargin);
  expect(view.height - rect.bottom, `${label} 下方留白`).toBeGreaterThanOrEqual(minMargin);
}

function expectCentered(rect: Rect, label: string) {
  const view = viewportRect();
  expectClose(rect.centerX, view.centerX, PX_TOLERANCE, `${label} 水平居中`);
  expectClose(rect.centerY, view.centerY, PX_TOLERANCE, `${label} 垂直居中`);
}

function expectSameRect(actual: Rect, expected: Rect, label: string) {
  expectClose(actual.left, expected.left, PX_TOLERANCE, `${label} left`);
  expectClose(actual.top, expected.top, PX_TOLERANCE, `${label} top`);
  expectClose(actual.width, expected.width, PX_TOLERANCE, `${label} width`);
  expectClose(actual.height, expected.height, PX_TOLERANCE, `${label} height`);
}

function expectMovedBy(after: Rect, before: Rect, delta: Point, tolerance: number, label: string) {
  expectClose(after.left - before.left, delta.x, tolerance, `${label} 水平位移`);
  expectClose(after.top - before.top, delta.y, tolerance, `${label} 垂直位移`);
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Scene> = {
  title: 'UI Tests/SpotlightImage',
  component: Scene,
  parameters: { layout: 'fullscreen' },
  args: { fixtures: [landscape] },
  beforeEach: async () => {
    await setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
    window.scrollTo(0, 0);
    return async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    };
  },
};

export default meta;
type Story = StoryObj<typeof Scene>;

// ---------------------------------------------------------------------------
// 4.1 打开与关闭
// ---------------------------------------------------------------------------

export const SI01: Story = {
  name: 'SI-01 点击缩略图查看大图',
  play: async () => {
    const viewer = await openViewer(landscape);
    expect(viewer.image).toBeVisible();
    expect(viewer.image.naturalWidth).toBe(landscape.width);
    expect(viewer.image.naturalHeight).toBe(landscape.height);
  },
};

export const SI02: Story = {
  name: 'SI-02 键盘用户打开查看器',
  play: async () => {
    const thumbnail = getThumbnail(landscape);
    await press('{Tab}');
    expect(document.activeElement).toBe(thumbnail);

    await press('{Enter}');
    await closeViewer(await findViewer());

    thumbnail.focus();
    await press('[Space]');
    await findViewer();
  },
};

export const SI03: Story = {
  name: 'SI-03 键盘打开时页面不跳动',
  args: { isScrollable: true },
  play: async () => {
    const thumbnail = getThumbnail(landscape);
    thumbnail.scrollIntoView({ block: 'center' });
    const scrollBefore = window.scrollY;
    thumbnail.focus();

    await press('[Space]');
    await findViewer();
    await press('{Escape}');
    await waitForViewerClosed();

    expect(window.scrollY).toBe(scrollBefore);
  },
};

export const SI04: Story = {
  name: 'SI-04 用关闭按钮退出',
  play: async () => {
    const viewer = await openViewer(landscape);
    await closeViewer(viewer);
  },
};

export const SI05: Story = {
  name: 'SI-05 用 Esc 退出',
  play: async () => {
    await openViewer(landscape);
    await press('{Escape}');
    await waitForViewerClosed();
  },
};

/** 在图片左侧的空白区域取一点 */
function pointOutsideImage(rect: Rect): Point {
  expect(rect.left, '图片左侧需要有足够的空白用于点击').toBeGreaterThan(MIN_MARGIN * 2);
  return { x: rect.left / 2, y: viewportRect().centerY };
}

export const SI06a: Story = {
  name: 'SI-06a 点击空白处退出（配置开启）',
  args: { imageProps: { modalProps: { closeOnClickOutside: true } } },
  play: async () => {
    const viewer = await openViewer(landscape);
    const point = pointOutsideImage(await viewer.rect());
    await pointer([{ type: 'move', ...point }, { type: 'down' }, { type: 'up' }]);
    await waitForViewerClosed();
  },
};

export const SI06b: Story = {
  name: 'SI-06b 放大后点击空白处不会误关闭（配置开启）',
  args: { fixtures: [small], imageProps: { modalProps: { closeOnClickOutside: true } } },
  play: async () => {
    const viewer = await openViewer(small);
    const before = await clickButton(viewer, LABELS.zoomIn, 2);
    const delta = { x: 100, y: 0 };
    await drag(pointOutsideImage(before), delta);
    await sleep(SETTLE_DELAY);

    expect(screen.queryByRole('dialog')).not.toBeNull();
    expectMovedBy(await viewer.rect(), before, delta, PX_TOLERANCE, '拖动');
  },
};

export const SI06c: Story = {
  name: 'SI-06c 点击空白处不关闭（配置关闭）',
  play: async () => {
    const viewer = await openViewer(landscape);
    const point = pointOutsideImage(await viewer.rect());
    await pointer([{ type: 'move', ...point }, { type: 'down' }, { type: 'up' }]);
    await sleep(SETTLE_DELAY);
    expect(screen.queryByRole('dialog')).not.toBeNull();
  },
};

export const SI07: Story = {
  name: 'SI-07 关闭后回到原来的阅读位置',
  args: { isScrollable: true },
  play: async () => {
    getThumbnail(landscape).scrollIntoView({ block: 'center' });
    const scrollBefore = window.scrollY;
    expect(scrollBefore).toBeGreaterThan(0);

    const viewer = await openViewer(landscape);
    await closeViewer(viewer);

    expect(window.scrollY).toBe(scrollBefore);
  },
};

export const SI08: Story = {
  name: 'SI-08 关闭后可以继续用键盘操作',
  play: async () => {
    const thumbnail = getThumbnail(landscape);
    thumbnail.focus();
    await press('{Enter}');
    await findViewer();
    await press('{Escape}');
    await waitForViewerClosed();

    await waitFor(() => expect(document.activeElement).toBe(thumbnail));
  },
};

export const SI09: Story = {
  name: 'SI-09 查看时背景页面不动',
  args: { isScrollable: true },
  play: async () => {
    getThumbnail(landscape).scrollIntoView({ block: 'center' });
    const scrollBefore = window.scrollY;
    await openViewer(landscape);

    await wheel(viewCenter(), WHEEL_NOTCH, 3);
    await press('{ArrowDown}{ArrowDown}{PageDown}');
    await sleep(SETTLE_DELAY);

    expect(window.scrollY).toBe(scrollBefore);
  },
};

export const SI10: Story = {
  name: 'SI-10 再次打开时从初始状态开始',
  play: async () => {
    let viewer = await openViewer(landscape);
    const initial = await viewer.rect();
    await clickButton(viewer, LABELS.zoomIn, 3);
    await drag(viewCenter(), { x: -100, y: -50 });
    await closeViewer(viewer);

    viewer = await openViewer(landscape);
    expectSameRect(await viewer.rect(), initial, '再次打开');
  },
};

export const SI11: Story = {
  name: 'SI-11 同页多张图片互不干扰',
  args: { fixtures: [landscape, portrait] },
  play: async () => {
    let viewer = await openViewer(portrait);
    const portraitInitial = await viewer.rect();
    await closeViewer(viewer);

    viewer = await openViewer(landscape);
    await press('++');
    await closeViewer(viewer);

    viewer = await openViewer(portrait);
    expectSameRect(await viewer.rect(), portraitInitial, '第二张图片');
  },
};

// ---------------------------------------------------------------------------
// 4.2 初始显示
// ---------------------------------------------------------------------------

export const SI20: Story = {
  name: 'SI-20 大图一眼看全',
  args: { fixtures: [landscape, portrait, huge] },
  play: async () => {
    await forEachViewerCase(
      ['desktop', 'mobile'],
      [landscape, portrait, huge],
      async (viewer, _, label) => {
        expectFullyVisible(await viewer.rect(), label);
      }
    );
  },
};

export const SI21: Story = {
  name: 'SI-21 极端比例的图片也能看全',
  args: { fixtures: [panorama, tall] },
  play: async () => {
    await forEachViewerCase(['desktop', 'mobile'], [panorama, tall], async (viewer, _, label) => {
      expectFullyVisible(await viewer.rect(), label);
    });
  },
};

export const SI22: Story = {
  name: 'SI-22 图片居中',
  args: { fixtures: ALL_FIXTURES },
  play: async () => {
    await forEachViewerCase(['desktop', 'mobile'], ALL_FIXTURES, async (viewer, _, label) => {
      expectCentered(await viewer.rect(), label);
    });
  },
};

export const SI23: Story = {
  name: 'SI-23 小图不会被放大到模糊',
  args: { fixtures: [small] },
  play: async () => {
    const rect = await (await openViewer(small)).rect();
    expectClose(rect.width, small.width, PX_TOLERANCE, '显示宽度');
    expectClose(rect.height, small.height, PX_TOLERANCE, '显示高度');
  },
};

export const SI24: Story = {
  name: 'SI-24 图片不变形',
  args: { fixtures: ALL_FIXTURES },
  play: async () => {
    await forEachViewerCase(['desktop'], ALL_FIXTURES, async (viewer, fixture, label) => {
      const rect = await viewer.rect();
      const expected = fixture.width / fixture.height;
      const actual = rect.width / rect.height;
      expect(Math.abs(actual / expected - 1), `${label} 宽高比`).toBeLessThanOrEqual(
        RATIO_TOLERANCE
      );
    });
  },
};

export const SI25: Story = {
  name: 'SI-25 调整窗口大小后仍能看全',
  play: async () => {
    const viewer = await openViewer(landscape);
    await setViewport(800, 600);
    const rect = await viewer.rect();
    expectFullyVisible(rect, '800×600');
    expectCentered(rect, '800×600');
  },
};

export const SI26: Story = {
  name: 'SI-26 旋转手机后仍能看全',
  play: async () => {
    const { width, height } = VIEWPORTS.mobile;
    await setViewport(width, height);
    const viewer = await openViewer(landscape);
    await setViewport(height, width);
    const rect = await viewer.rect();
    expectFullyVisible(rect, '横屏');
    expectCentered(rect, '横屏');
  },
};

// ---------------------------------------------------------------------------
// 4.3 缩放
// ---------------------------------------------------------------------------

export const SI30: Story = {
  name: 'SI-30 用按钮放大',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    const after = await clickButton(viewer, LABELS.zoomIn);
    expect(after.width / before.width).toBeGreaterThanOrEqual(MIN_ZOOM_STEP);
    expectClose(after.centerX, before.centerX, PX_TOLERANCE, '中心 x');
    expectClose(after.centerY, before.centerY, PX_TOLERANCE, '中心 y');
  },
};

export const SI31: Story = {
  name: 'SI-31 用按钮缩小',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await clickButton(viewer, LABELS.zoomIn, 2);
    const after = await clickButton(viewer, LABELS.zoomOut);
    expect(after.width).toBeLessThan(before.width);
  },
};

export const SI32: Story = {
  name: 'SI-32 缩小不会让图片变大',
  args: { fixtures: ALL_FIXTURES },
  play: async () => {
    await forEachViewerCase(['desktop', 'mobile'], ALL_FIXTURES, async (viewer, _, label) => {
      let previous = await viewer.rect();
      for (let i = 1; i <= 10; i++) {
        const current = await clickButton(viewer, LABELS.zoomOut);
        expect(current.width, `${label} 第 ${i} 次缩小`).toBeLessThanOrEqual(
          previous.width + PX_TOLERANCE
        );
        previous = current;
      }
    });
  },
};

/** 连续点击同一个按钮，记录每次点击后的图片宽度 */
async function recordWidths(viewer: Viewer, name: string, times: number) {
  const widths: number[] = [];
  for (let i = 0; i < times; i++) {
    widths.push((await clickButton(viewer, name)).width);
  }
  return widths;
}

function expectSettled(widths: number[], label: string) {
  const tail = widths.slice(-SETTLED_CLICKS);
  tail.forEach((width) => expectClose(width, tail[0], PX_TOLERANCE, `${label} 到达极限后尺寸不变`));
}

export const SI33: Story = {
  name: 'SI-33 放大有上限且不会跳动',
  play: async () => {
    const viewer = await openViewer(landscape);
    const widths = await recordWidths(viewer, LABELS.zoomIn, REPEAT_CLICKS);
    widths.slice(1).forEach((width, i) => {
      expect(width, `第 ${i + 2} 次放大`).toBeGreaterThanOrEqual(widths[i] - PX_TOLERANCE);
    });
    expectSettled(widths, '放大');
  },
};

export const SI34: Story = {
  name: 'SI-34 能放大到看清细节',
  play: async () => {
    const viewer = await openViewer(landscape);
    const widths = await recordWidths(viewer, LABELS.zoomIn, REPEAT_CLICKS);
    expect(widths[widths.length - 1]).toBeGreaterThanOrEqual(landscape.width * MIN_MAX_ZOOM);
  },
};

export const SI35: Story = {
  name: 'SI-35 缩小有下限',
  args: { fixtures: ALL_FIXTURES },
  play: async () => {
    await forEachViewerCase(['desktop'], ALL_FIXTURES, async (viewer, _, label) => {
      const widths = await recordWidths(viewer, LABELS.zoomOut, REPEAT_CLICKS);
      const rect = await viewer.rect();
      expect(Math.min(rect.width, rect.height), `${label} 最小时的短边`).toBeGreaterThanOrEqual(
        MIN_VISIBLE_SIDE
      );
      expectSettled(widths, label);
    });
  },
};

export const SI36: Story = {
  name: 'SI-36 一键恢复',
  play: async () => {
    const viewer = await openViewer(landscape);
    const initial = await viewer.rect();
    await clickButton(viewer, LABELS.zoomIn, 2);
    await drag(viewCenter(), { x: 150, y: 80 });
    const after = await clickButton(viewer, LABELS.reset);
    expectSameRect(after, initial, '重置后');
  },
};

export const SI37: Story = {
  name: 'SI-37 滚轮缩放',
  play: async () => {
    const viewer = await openViewer(landscape);
    const initial = await viewer.rect();
    await wheel(viewCenter(), -WHEEL_NOTCH);
    const zoomedIn = await viewer.rect();
    expect(zoomedIn.width, '向上滚动放大').toBeGreaterThan(initial.width);

    await wheel(viewCenter(), WHEEL_NOTCH);
    const zoomedOut = await viewer.rect();
    expect(zoomedOut.width, '向下滚动缩小').toBeLessThan(zoomedIn.width);
  },
};

export const SI38: Story = {
  name: 'SI-38 滚轮以鼠标位置为中心缩放',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    // 右上角三角标记所在的位置
    const anchor = { u: 0.95, v: 0.05 };
    const mouse = {
      x: before.left + before.width * anchor.u,
      y: before.top + before.height * anchor.v,
    };

    await wheel(mouse, -WHEEL_NOTCH, 3);
    const after = await viewer.rect();
    expectClose(after.left + after.width * anchor.u, mouse.x, ZOOM_ANCHOR_TOLERANCE, '标记 x');
    expectClose(after.top + after.height * anchor.v, mouse.y, ZOOM_ANCHOR_TOLERANCE, '标记 y');
  },
};

export const SI39: Story = {
  name: 'SI-39 触控板捏合速度适中',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    await wheel(viewCenter(), PINCH_DELTA, PINCH_EVENTS, ['Control']);
    const ratio = (await viewer.rect()).width / before.width;
    expect(ratio).toBeGreaterThanOrEqual(PINCH_MIN_RATIO);
    expect(ratio).toBeLessThanOrEqual(PINCH_MAX_RATIO);
  },
};

export const SI40: Story = {
  name: 'SI-40 键盘缩放',
  play: async () => {
    const viewer = await openViewer(landscape);
    const initial = await viewer.rect();

    await press('+');
    const zoomedIn = await viewer.rect();
    expect(zoomedIn.width, '+ 放大').toBeGreaterThan(initial.width);

    await press('-');
    const zoomedOut = await viewer.rect();
    expect(zoomedOut.width, '- 缩小').toBeLessThan(zoomedIn.width);

    await press('+');
    await press('0');
    expectSameRect(await viewer.rect(), initial, '0 恢复');
  },
};

export const SI41: Story = {
  name: 'SI-41 不影响浏览器自身的缩放快捷键',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    await press('{Control>}-{/Control}');
    await press('{Control>}0{/Control}');
    await press('{Control>}={/Control}');
    await sleep(SETTLE_DELAY);
    expectSameRect(await viewer.rect(), before, '按下快捷键后');
  },
};

export const SI42: Story = {
  name: 'SI-42 缩小回初始大小时图片回到中间',
  play: async () => {
    const viewer = await openViewer(landscape);
    const initial = await viewer.rect();
    await clickButton(viewer, LABELS.zoomIn, 2);
    await drag(viewCenter(), { x: -300, y: -100 });

    let rect = await viewer.rect();
    for (let i = 0; i < REPEAT_CLICKS && rect.width > initial.width + PX_TOLERANCE; i++) {
      rect = await clickButton(viewer, LABELS.zoomOut);
    }
    expectCentered(rect, '缩小后');
  },
};

// ---------------------------------------------------------------------------
// 4.4 拖动查看
// ---------------------------------------------------------------------------

export const SI50: Story = {
  name: 'SI-50 未放大时图片不能拖动',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    await drag(viewCenter(), { x: 150, y: 80 });
    expectSameRect(await viewer.rect(), before, '拖动后');
  },
};

export const SI51: Story = {
  name: 'SI-51 放大后拖动查看细节',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await clickButton(viewer, LABELS.zoomIn, 2);
    const delta = { x: 150, y: 80 };
    await drag(viewCenter(), delta);
    expectMovedBy(await viewer.rect(), before, delta, PX_TOLERANCE, '拖动');
  },
};

export const SI52: Story = {
  name: 'SI-52 鼠标光标提示可以拖动',
  play: async () => {
    const viewer = await openViewer(landscape);
    const center = viewCenter();
    await pointer([{ type: 'move', ...center }]);
    expect(cursorAt(center), '未放大').not.toMatch(/grab/);

    await clickButton(viewer, LABELS.zoomIn, 2);
    await pointer([{ type: 'move', ...center }]);
    await waitFor(() => expect(cursorAt(center), '放大后悬停').toBe('grab'));

    await pointer([{ type: 'down' }]);
    await waitFor(() => expect(cursorAt(center), '按下').toBe('grabbing'));
    await pointer([{ type: 'up' }]);
  },
};

export const SI53: Story = {
  name: 'SI-53 拖动时图片跟手',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await clickButton(viewer, LABELS.zoomIn, 2);
    const start = viewCenter();
    const step = 20;

    await pointer([{ type: 'move', ...start }, { type: 'down' }]);
    for (let i = 1; i <= 10; i++) {
      await pointer([{ type: 'move', x: start.x + step * i, y: start.y }]);
      await nextFrame();
      const offset = rectOf(viewer.image).left - before.left;
      expectClose(offset, step * i, FOLLOW_TOLERANCE, `第 ${i} 次移动后的图片位移`);
    }
    await pointer([{ type: 'up' }]);
  },
};

/** 分多次向左拖动，累计移动 total 像素（单次拖动不能超出视口） */
async function dragRepeatedly(total: number, perDrag: number) {
  for (let moved = 0; moved < total; moved += perDrag) {
    await drag(viewCenter(), { x: -perDrag, y: 0 });
  }
}

const LONG_DRAG = 5000;
const DRAG_CHUNK = 200;

export const SI54a: Story = {
  name: 'SI-54a 图片不会被拖丢（配置开启）',
  args: { imageProps: KEEP_IN_VIEW_PROPS },
  play: async () => {
    const viewer = await openViewer(landscape);
    await clickButton(viewer, LABELS.zoomIn, 2);
    await dragRepeatedly(LONG_DRAG, DRAG_CHUNK);
    const rect = await viewer.rect();
    const view = viewportRect();
    const isOverlapping =
      rect.right > 0 && rect.left < view.width && rect.bottom > 0 && rect.top < view.height;
    expect(isOverlapping, '图片仍有一部分在可视区域内').toBe(true);
  },
};

export const SI54b: Story = {
  name: 'SI-54b 自由拖动（配置关闭）',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await clickButton(viewer, LABELS.zoomIn, 2);
    await dragRepeatedly(LONG_DRAG, DRAG_CHUNK);
    expectMovedBy(await viewer.rect(), before, { x: -LONG_DRAG, y: 0 }, PX_TOLERANCE, '累计拖动');
  },
};

export const SI55: Story = {
  name: 'SI-55 松开鼠标后不会继续拖动',
  play: async () => {
    const viewer = await openViewer(landscape);
    await clickButton(viewer, LABELS.zoomIn, 2);
    const center = viewCenter();
    const outside = { x: viewportRect().width + 40, y: center.y };

    await pointer([
      { type: 'move', ...center },
      { type: 'down' },
      { type: 'move', x: center.x + 50, y: center.y, steps: 5 },
      { type: 'move', ...outside, steps: 5 },
      { type: 'up' },
    ]);
    const released = await viewer.rect();

    await pointer([{ type: 'move', x: center.x + 150, y: center.y, steps: 5 }]);
    expectSameRect(await viewer.rect(), released, '鼠标移回窗口后');
  },
};

export const SI56: Story = {
  name: 'SI-56 点击按钮时不会误拖图片',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await clickButton(viewer, LABELS.zoomIn);
    const button = rectOf(viewer.button(LABELS.zoomIn));

    await pointer([
      { type: 'move', x: button.centerX, y: button.centerY },
      { type: 'down' },
      { type: 'move', x: button.centerX + 5, y: button.centerY, steps: 2 },
      { type: 'up' },
    ]);
    const after = await viewer.rect();

    expect(after.width / before.width, '放大生效').toBeGreaterThanOrEqual(MIN_ZOOM_STEP);
    expectClose(after.centerX, before.centerX, PX_TOLERANCE, '图片中心 x');
    expectClose(after.centerY, before.centerY, PX_TOLERANCE, '图片中心 y');
  },
};

export const SI57: Story = {
  name: 'SI-57 拖动后缩放保持查看位置',
  play: async () => {
    const viewer = await openViewer(landscape);
    await clickButton(viewer, LABELS.zoomIn, 2);
    await drag(viewCenter(), { x: -200, y: 0 });
    const before = imagePosition(await viewer.rect(), viewCenter());
    expect(before.u, '拖动后看到的是图片右侧').toBeGreaterThan(0.5);

    const after = imagePosition(await clickButton(viewer, LABELS.zoomIn), viewCenter());
    expectClose(after.u, before.u, VIEW_CENTER_DRIFT, '放大后视口中心对应的图片位置');
  },
};

// ---------------------------------------------------------------------------
// 4.5 触屏操作
// ---------------------------------------------------------------------------

/** 双指沿水平方向从 fromDistance 拉开或收拢到 toDistance */
async function pinch(fromDistance: number, toDistance: number) {
  const center = viewCenter();
  const target = document.elementFromPoint(center.x, center.y);
  if (!target) {
    throw new Error('视口中心没有可触摸的元素');
  }
  const fingers = (distance: number) => [
    { x: center.x - distance / 2, y: center.y },
    { x: center.x + distance / 2, y: center.y },
  ];
  touch(target, 'touchstart', fingers(fromDistance));
  for (let i = 1; i <= TOUCH_STEPS; i++) {
    touch(
      target,
      'touchmove',
      fingers(fromDistance + ((toDistance - fromDistance) * i) / TOUCH_STEPS)
    );
    await nextFrame();
  }
  touch(target, 'touchend', []);
}

export const SI60: Story = {
  name: 'SI-60 双指缩放',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    await pinch(100, 200);
    const ratio = (await viewer.rect()).width / before.width;
    expectClose(ratio, 2, TOUCH_RATIO_TOLERANCE, '放大倍数');
  },
};

export const SI61: Story = {
  name: 'SI-61 双指缩小不会让图片小于下限',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await viewer.rect();
    await pinch(300, 30);
    const after = await viewer.rect();
    expect(after.width, '图片缩小').toBeLessThan(before.width);
    expect(Math.min(after.width, after.height), '短边').toBeGreaterThanOrEqual(MIN_VISIBLE_SIDE);
  },
};

export const SI62: Story = {
  name: 'SI-62 放大后单指拖动',
  play: async () => {
    const viewer = await openViewer(landscape);
    const before = await clickButton(viewer, LABELS.zoomIn, 2);
    const center = viewCenter();
    const target = document.elementFromPoint(center.x, center.y);
    if (!target) {
      throw new Error('视口中心没有可触摸的元素');
    }
    const delta = { x: 100, y: 0 };

    touch(target, 'touchstart', [center]);
    for (let i = 1; i <= TOUCH_STEPS; i++) {
      touch(target, 'touchmove', [{ x: center.x + (delta.x * i) / TOUCH_STEPS, y: center.y }]);
      await nextFrame();
    }
    touch(target, 'touchend', []);

    expectMovedBy(await viewer.rect(), before, delta, PX_TOLERANCE, '单指拖动');
  },
};

// ---------------------------------------------------------------------------
// 4.6 全屏
// ---------------------------------------------------------------------------

async function enterFullscreen(viewer: Viewer) {
  await click(viewer.button(LABELS.enterFullscreen));
  await waitFor(() => expect(document.fullscreenElement).not.toBeNull());
}

export const SI70: Story = {
  name: 'SI-70 进入全屏',
  play: async () => {
    const viewer = await openViewer(landscape);
    await enterFullscreen(viewer);
    expect(document.fullscreenElement, '不是整个页面进入全屏').not.toBe(document.documentElement);
    expect(document.fullscreenElement?.contains(viewer.image), '全屏的是查看器').toBe(true);
    await waitFor(() => expect(viewer.button(LABELS.exitFullscreen)).toBeVisible());
  },
};

export const SI71: Story = {
  name: 'SI-71 退出全屏',
  play: async () => {
    const viewer = await openViewer(landscape);
    await enterFullscreen(viewer);
    await click(viewer.button(LABELS.exitFullscreen));
    await waitFor(() => expect(document.fullscreenElement).toBeNull());
    expect(screen.queryByRole('dialog')).not.toBeNull();
  },
};

export const SI72: Story = {
  name: 'SI-72 关闭查看器时一并退出全屏',
  play: async () => {
    const viewer = await openViewer(landscape);
    await enterFullscreen(viewer);
    await closeViewer(viewer);
    await waitFor(() => expect(document.fullscreenElement).toBeNull());
  },
};

/** 全屏前窗口比屏幕小的边距，模拟真实设备上「全屏后可视区域变大」的情况 */
const WINDOW_INSET = { width: 200, height: 120 };

export const SI73: Story = {
  name: 'SI-73 全屏后图片仍居中且完整',
  play: async () => {
    // headless 环境的屏幕可能比默认窗口还小，先把窗口调到比屏幕小
    await setViewport(
      window.screen.width - WINDOW_INSET.width,
      window.screen.height - WINDOW_INSET.height
    );
    const viewer = await openViewer(landscape);
    await enterFullscreen(viewer);
    const rect = await viewer.rect();
    expectFullyVisible(rect, '全屏');
    expectCentered(rect, '全屏');
  },
};

// SI-74（全屏时按 Esc）只做实机确认：真实浏览器在全屏时由浏览器自身处理 Esc，
// 而自动测试的按键直接派发给页面，无法还原这一行为。

/** 模拟不支持全屏 API 的浏览器（如 iPhone Safari），返回恢复函数 */
function simulateNoFullscreenSupport() {
  const elementProto = Element.prototype as Partial<Element>;
  const requestFullscreen = elementProto.requestFullscreen;
  const enabledDescriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'fullscreenEnabled'
  );

  delete elementProto.requestFullscreen;
  Object.defineProperty(Document.prototype, 'fullscreenEnabled', {
    configurable: true,
    get: () => false,
  });

  return () => {
    elementProto.requestFullscreen = requestFullscreen;
    if (enabledDescriptor) {
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', enabledDescriptor);
    }
  };
}

export const SI75: Story = {
  name: 'SI-75 不支持全屏的设备',
  beforeEach: simulateNoFullscreenSupport,
  play: async () => {
    const viewer = await openViewer(landscape);
    const button = within(viewer.dialog).getByRole('button', { name: /fullscreen/i });
    const isDisabled =
      button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true';
    expect(isDisabled, '全屏按钮显示为不可用').toBe(true);

    await click(button, { force: true });
    const tooltip = await screen.findByRole('tooltip');
    // 提示有淡入动画，等待动画结束后再判断
    await waitFor(() => expect(tooltip, '点击后出现提示').toBeVisible());
    expect(tooltip.textContent, '提示有说明文字').not.toBe('');

    const before = await viewer.rect();
    const after = await clickButton(viewer, LABELS.zoomIn);
    expect(after.width, '其他功能不受影响').toBeGreaterThan(before.width);
  },
};
