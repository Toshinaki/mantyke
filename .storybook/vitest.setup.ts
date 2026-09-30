import { expect } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

// story 文件同时要在 Storybook 界面中运行，不能直接 import 'vitest/browser'。
// 这里把 vitest 的浏览器 API 挂到全局，由 test-utils 在测试环境中取用。
globalThis.__BROWSER_TEST__ = {
  commands,
  page,
  userEvent,
  matchScreenshot: (element, name) =>
    expect.element(page.elementLocator(element)).toMatchScreenshot(name),
};
