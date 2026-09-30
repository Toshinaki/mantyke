import { userEvent as syntheticUserEvent } from 'storybook/test';
import type { PointerAction, WheelModifier } from './browser-commands.types';
import type { ViewportSize } from './viewports';

interface BrowserTestApi {
  commands: {
    pointer: (actions: PointerAction[]) => Promise<void>;
    delayRequests: (urlPart: string, delayMs: number) => Promise<void>;
    clearRequestDelays: () => Promise<void>;
    isScreenshotComparisonEnabled: () => Promise<boolean>;
    resizeBrowserWindow: (size: ViewportSize) => Promise<ViewportSize>;
  };
  matchScreenshot: (element: Element, name: string) => Promise<void>;
  page: { viewport: (width: number, height: number) => Promise<void> };
  userEvent: {
    click: (element: Element, options?: ClickOptions) => Promise<void>;
    keyboard: (text: string) => Promise<void>;
  };
}

declare global {
  // 由 .storybook/vitest.setup.ts 在 vitest 浏览器模式中注入；在 Storybook 界面中为 undefined
  var __BROWSER_TEST__: BrowserTestApi | undefined;
}

/** force：跳过可操作性检查，用于点击处于不可用状态的元素 */
export interface ClickOptions {
  force?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/** 连续多少帧位置不变才视为稳定，覆盖 CSS 过渡结束后的最后一次布局 */
const STABLE_FRAMES = 5;
const DEFAULT_TIMEOUT = 5000;
/** 截图前调整视口高度的最多次数。滚动条消失后内容会重新排布，高度可能再次变化 */
const MAX_FIT_PASSES = 3;
/** 鼠标滚轮滚动一格的 deltaY，与 Chrome 在 Windows 上的默认值一致 */
export const WHEEL_NOTCH = 100;

function getApi() {
  return globalThis.__BROWSER_TEST__;
}

export function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export async function waitFrames(count: number) {
  for (let i = 0; i < count; i++) {
    await nextFrame();
  }
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function toRect(domRect: DOMRect): Rect {
  return {
    left: domRect.left,
    top: domRect.top,
    right: domRect.right,
    bottom: domRect.bottom,
    width: domRect.width,
    height: domRect.height,
    centerX: domRect.left + domRect.width / 2,
    centerY: domRect.top + domRect.height / 2,
  };
}

export function rectOf(element: Element) {
  return toRect(element.getBoundingClientRect());
}

export function viewportRect(): Rect {
  return toRect(new DOMRect(0, 0, window.innerWidth, window.innerHeight));
}

/** 等待 read 的返回值连续多帧不变，返回稳定后的值 */
export async function waitForStable(read: () => string, timeout = DEFAULT_TIMEOUT) {
  const deadline = performance.now() + timeout;
  let previous = read();
  let stableCount = 0;
  while (stableCount < STABLE_FRAMES) {
    if (performance.now() > deadline) {
      throw new Error('等待页面稳定超时');
    }
    await nextFrame();
    const current = read();
    stableCount = current === previous ? stableCount + 1 : 0;
    previous = current;
  }
  return previous;
}

function serializeRect(rect: DOMRect) {
  return `${rect.x},${rect.y},${rect.width},${rect.height}`;
}

/** 等待元素的位置和尺寸不再变化，返回稳定后的矩形 */
export async function waitForStableRect(element: Element, timeout = DEFAULT_TIMEOUT) {
  await waitForStable(() => serializeRect(element.getBoundingClientRect()), timeout);
  return rectOf(element);
}

/** 等待一组元素的位置和尺寸都不再变化 */
export async function waitForStableRects(read: () => Element[], timeout = DEFAULT_TIMEOUT) {
  await waitForStable(
    () =>
      read()
        .map((element) => serializeRect(element.getBoundingClientRect()))
        .join('|'),
    timeout
  );
}

/** 调整视口尺寸。只在 vitest 中生效；在 Storybook 界面中请使用工具栏的视口切换 */
export async function setViewport(width: number, height: number) {
  const api = getApi();
  if (api) {
    await api.page.viewport(width, height);
    await waitFrames(2);
  }
}

/**
 * 让地址包含 urlPart 的请求延迟 delayMs 毫秒后再发出，返回取消延迟的函数。
 * 只在 vitest 中生效；在 Storybook 界面中请使用开发者工具的网络限速。
 */
export async function delayRequests(urlPart: string, delayMs: number) {
  const api = getApi();
  if (!api) {
    return async () => {};
  }
  await api.commands.delayRequests(urlPart, delayMs);
  return () => api.commands.clearRequestDelays();
}

/**
 * 把元素当前的画面与基准截图对比（L3 视觉回归）。基准截图保存在 story 旁的 __screenshots__ 中。
 * 只在 CI 中对比；本地运行与 Storybook 界面中跳过，见 browser-commands.ts 的 isScreenshotComparisonEnabled。
 */
export async function matchScreenshot(element: Element, name: string) {
  const api = getApi();
  if (!api || !(await api.commands.isScreenshotComparisonEnabled())) {
    return;
  }

  // 截图只能拍到视口内的内容，并且测试页面在窗口放不下时会被缩小显示。
  // 先把视口高度调到能容纳整个页面，再把浏览器窗口调到不小于视口，截图才完整且不缩放。
  const width = window.innerWidth;
  const originalHeight = window.innerHeight;
  const readPageHeight = () => Math.ceil(document.documentElement.scrollHeight);
  let height = 0;
  let originalWindow: ViewportSize | undefined;
  for (let pass = 0; pass < MAX_FIT_PASSES; pass++) {
    const required = Math.max(originalHeight, readPageHeight());
    if (required <= height) {
      break;
    }
    height = required;
    const previousWindow = await api.commands.resizeBrowserWindow({ width, height });
    originalWindow ??= previousWindow;
    await api.page.viewport(width, height);
    await waitForStable(() => String(readPageHeight()));
  }

  try {
    await api.matchScreenshot(element, name);
  } finally {
    if (originalWindow) {
      await api.commands.resizeBrowserWindow(originalWindow);
    }
    await api.page.viewport(width, originalHeight);
    await waitFrames(2);
  }
}

export async function click(element: Element, options?: ClickOptions) {
  const api = getApi();
  if (api) {
    await api.userEvent.click(element, options);
  } else {
    await syntheticUserEvent.click(element);
  }
}

/** 按键序列，语法与 testing-library 的 keyboard 相同，如 `{Enter}`、`{Control>}-{/Control}` */
export async function press(keys: string) {
  const api = getApi();
  if (api) {
    await api.userEvent.keyboard(keys);
  } else {
    await syntheticUserEvent.keyboard(keys);
  }
}

// 以下为 Storybook 界面中的合成事件实现，只用于人工观看 play 函数的执行过程
const syntheticPointer = { x: 0, y: 0, buttons: 0 };

function dispatchSyntheticMouse(type: string) {
  const target = document.elementFromPoint(syntheticPointer.x, syntheticPointer.y);
  target?.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: syntheticPointer.x,
      clientY: syntheticPointer.y,
      buttons: syntheticPointer.buttons,
    })
  );
}

function runSyntheticPointer(actions: PointerAction[]) {
  for (const action of actions) {
    if (action.type === 'move') {
      syntheticPointer.x = action.x;
      syntheticPointer.y = action.y;
      dispatchSyntheticMouse('mousemove');
    } else if (action.type === 'down') {
      syntheticPointer.buttons = 1;
      dispatchSyntheticMouse('mousedown');
    } else if (action.type === 'up') {
      syntheticPointer.buttons = 0;
      dispatchSyntheticMouse('mouseup');
    } else {
      const target = document.elementFromPoint(syntheticPointer.x, syntheticPointer.y);
      target?.dispatchEvent(
        new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX: syntheticPointer.x,
          clientY: syntheticPointer.y,
          deltaX: action.deltaX ?? 0,
          deltaY: action.deltaY,
          ctrlKey: action.modifiers?.includes('Control'),
        })
      );
    }
  }
}

export async function pointer(actions: PointerAction[]) {
  const api = getApi();
  if (api) {
    await api.commands.pointer(actions);
  } else {
    runSyntheticPointer(actions);
  }
}

export async function drag(from: Point, delta: Point, steps = 10) {
  await pointer([
    { type: 'move', x: from.x, y: from.y },
    { type: 'down' },
    { type: 'move', x: from.x + delta.x, y: from.y + delta.y, steps },
    { type: 'up' },
  ]);
}

export async function wheel(at: Point, deltaY: number, times = 1, modifiers: WheelModifier[] = []) {
  const actions: PointerAction[] = [{ type: 'move', x: at.x, y: at.y }];
  for (let i = 0; i < times; i++) {
    actions.push({ type: 'wheel', deltaY, modifiers });
  }
  await pointer(actions);
}

/**
 * 派发触摸事件。触摸只能用合成事件模拟，真实手感由实机清单确认。
 * `fingers` 为每根手指在该阶段的位置，touchend 时传入抬起后仍在屏幕上的手指。
 */
export function touch(
  target: Element,
  type: 'touchstart' | 'touchmove' | 'touchend',
  fingers: Point[]
) {
  const touches = fingers.map(
    (finger, index) =>
      new Touch({ identifier: index, target, clientX: finger.x, clientY: finger.y })
  );
  target.dispatchEvent(
    new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches,
      targetTouches: touches,
      changedTouches: touches,
    })
  );
}
