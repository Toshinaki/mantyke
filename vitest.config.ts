import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import {
  clearRequestDelays,
  delayRequests,
  isScreenshotComparisonEnabled,
  pointer,
  resizeBrowserWindow,
} from './.storybook/browser-commands';
import { VIEWPORTS } from './.storybook/viewports';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** 单个 story 的超时。部分用例需要连续点击几十次并逐次等待动画结束 */
const STORY_TIMEOUT = 120_000;
/** L3 基准截图的目录，位于 story 文件旁。失败截图的目录另行配置，两者分开 */
const BASELINE_DIRECTORY = '__screenshots__';
/** 截图对比允许不一致的像素比例，吸收抗锯齿的细微差异 */
const SCREENSHOT_MISMATCH_RATIO = 0.001;

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
              commands: {
                pointer,
                delayRequests,
                clearRequestDelays,
                isScreenshotComparisonEnabled,
                resizeBrowserWindow,
              },
              // 失败时的截图只用于排查，不提交；L3 的基准截图保存在各 story 旁的 __screenshots__ 中
              screenshotDirectory: '.vitest/failure-screenshots',
              expect: {
                toMatchScreenshot: {
                  comparatorName: 'pixelmatch',
                  comparatorOptions: { allowedMismatchedPixelRatio: SCREENSHOT_MISMATCH_RATIO },
                  resolveScreenshotPath: ({
                    root,
                    testFileDirectory,
                    testFileName,
                    arg,
                    browserName,
                    platform,
                    ext,
                  }) =>
                    path.join(
                      root,
                      testFileDirectory,
                      BASELINE_DIRECTORY,
                      testFileName,
                      `${arg}-${browserName}-${platform}${ext}`
                    ),
                },
              },
            },
            testTimeout: STORY_TIMEOUT,
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  })
);
