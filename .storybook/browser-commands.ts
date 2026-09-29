import type { BrowserCommand, BrowserCommandContext } from 'vitest/node';
import type { PointerAction } from './browser-commands.types';

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
