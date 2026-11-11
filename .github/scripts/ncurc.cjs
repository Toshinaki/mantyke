// 每周依赖升级（.github/workflows/weekly-deps.yml）使用的 npm-check-updates（ncu）配置：决定每个包升到哪个版本。
// 原则：只在当前大版本内升级。大版本升级需要维护者实机确认后手动进行。
// 没有升级的包和原因由同目录的 weekly-deps.mjs 写进 PR 说明。
// 工作流会把本目录复制到别处再运行，所以根目录的 package.json 按当前目录（仓库根目录）读取，不按本文件的位置。
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const rootPackage = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));

// 只升 patch 的包（只改版本号的第三段），注释写明原因
const PATCH_ONLY = new Set([
  // typescript-eslint 要求 TypeScript < 6.1
  'typescript',
]);

// 打了 pnpm 补丁的包（根目录 package.json 的 pnpm.patchedDependencies）不自动升级：
// 补丁对新版本不一定适用，适用不了时 pnpm install 会失败。键可能带版本号（name@1.2.3），这里去掉版本号。
const patchedDependencies = Object.keys(rootPackage.pnpm?.patchedDependencies ?? {}).map((key) => {
  const at = key.lastIndexOf('@');
  return at > 0 ? key.slice(0, at) : key;
});

module.exports = {
  // 只检查 dependencies 和 devDependencies，不动 peerDependencies 和 packageManager
  dep: 'prod,dev',
  reject: patchedDependencies,
  /**
   * 返回这个包的升级范围：'minor' 是同一大版本内的最新版本，'patch' 是同一 minor 内的最新版本。
   * @param {string} name 包名
   * @param {Array<{ major?: string }>} range 解析后的当前版本范围（package.json 里写的那个），major 是字符串
   */
  target: (name, [range]) => {
    if (PATCH_ONLY.has(name)) {
      return 'patch';
    }
    // 0.x 版本的 minor 升级（例如 0.28 → 0.29）按 semver 可以不兼容，等同于大版本升级
    if (range?.major === '0') {
      return 'patch';
    }
    return 'minor';
  },
};
