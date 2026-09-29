import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import { pointer } from './.storybook/browser-commands';
import { VIEWPORTS } from './.storybook/viewports';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** 单个 story 的超时。部分用例需要连续点击几十次并逐次等待动画结束 */
const STORY_TIMEOUT = 120_000;

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
              storybookScript: 'pnpm storybook --no-open',
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              // 使用完整版 Chromium 的新 headless 模式，全屏等行为与真实的 Chrome 一致
              provider: playwright({ launchOptions: { channel: 'chromium' } }),
              instances: [{ browser: 'chromium', viewport: VIEWPORTS.desktop }],
              commands: { pointer },
              // 失败时的截图只用于排查，不提交；L3 的基准截图保存在各 story 旁的 __screenshots__ 中
              screenshotDirectory: '.vitest/failure-screenshots',
            },
            testTimeout: STORY_TIMEOUT,
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  })
);
