import { createRequire } from 'module';
import { dirname } from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(`${value}/package.json`));
}

const config: StorybookConfig = {
  stories: ['../packages/*/src/**/*.story.@(js|jsx|mjs|ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-vitest')],
  // UI 测试用图片，由 `pnpm fixtures:generate` 生成
  staticDirs: ['./public'],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
};

export default config;
