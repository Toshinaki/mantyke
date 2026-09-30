import type { BrowserCommand, BrowserCommandContext } from 'vitest/node';
import type { PointerAction } from './browser-commands.types';

type PlaywrightPage = BrowserCommandContext['page'];
type RouteMatcher = Parameters<PlaywrightPage['route']>[0];
type RouteHandler = Parameters<PlaywrightPage['route']>[1];

/** delayRequests 注册的拦截规则，由 clearRequestDelays 逐条取消 */
const delayedRoutes: { matcher: RouteMatcher; handler: RouteHandler }[] = [];

function assertPlaywright(ctx: BrowserCommandContext, command: string) {
  if (ctx.provider.name !== 'playwright') {
    throw new Error(`${command} 命令只支持 playwright，当前为 ${ctx.provider.name}`);
  }
}

/**
 * 测试运行在 vitest 编排页面内的 iframe 中，而 Playwright 的鼠标坐标以编排页面为准。
 * 这里把 iframe 视口内的坐标换算成编排页面坐标，并考虑 iframe 可能被整体缩放。
 */
async function toPagePoint(ctx: BrowserCommandContext, x: number, y: number) {
  const frame = await ctx.frame();
  const frameElement = await frame.frameElement();
  const box = await frameElement.boundingBox();
  if (!box) {
    throw new Error('无法获取测试 iframe 的位置');
  }
  const innerWidth = await frame.evaluate(() => window.innerWidth);
  const scale = box.width / innerWidth;
  return { x: box.x + x * scale, y: box.y + y * scale };
}

/** 依次执行一组鼠标动作，产生的是浏览器可信事件，与真实用户操作一致 */
export const pointer: BrowserCommand<[actions: PointerAction[]]> = async (ctx, actions) => {
  if (ctx.provider.name !== 'playwright') {
    throw new Error(`pointer 命令只支持 playwright，当前为 ${ctx.provider.name}`);
  }
  const { mouse, keyboard } = ctx.page;

  for (const action of actions) {
    switch (action.type) {
      case 'move': {
        const point = await toPagePoint(ctx, action.x, action.y);
        await mouse.move(point.x, point.y, { steps: action.steps ?? 1 });
        break;
      }
      case 'down':
        await mouse.down();
        break;
      case 'up':
        await mouse.up();
        break;
      case 'wheel': {
        const modifiers = action.modifiers ?? [];
        for (const key of modifiers) {
          await keyboard.down(key);
        }
        await mouse.wheel(action.deltaX ?? 0, action.deltaY);
        for (const key of modifiers) {
          await keyboard.up(key);
        }
        break;
      }
    }
  }
};

/** 让地址包含 urlPart 的请求延迟 delayMs 毫秒后再发出，用于模拟加载缓慢的图片 */
export const delayRequests: BrowserCommand<[urlPart: string, delayMs: number]> = async (
  ctx,
  urlPart,
  delayMs
) => {
  assertPlaywright(ctx, 'delayRequests');
  const matcher: RouteMatcher = (url) => url.href.includes(urlPart);
  const handler: RouteHandler = async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    // 等待期间测试可能已经结束，页面不再需要这个请求
    await route.continue().catch(() => {});
  };
  await ctx.page.route(matcher, handler);
  delayedRoutes.push({ matcher, handler });
};

/** 取消 delayRequests 注册的全部延迟 */
export const clearRequestDelays: BrowserCommand<[]> = async (ctx) => {
  assertPlaywright(ctx, 'clearRequestDelays');
  const routes = delayedRoutes.splice(0);
  await Promise.all(routes.map(({ matcher, handler }) => ctx.page.unroute(matcher, handler)));
};
