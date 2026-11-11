// 每周依赖升级（.github/workflows/weekly-deps.yml）中修改 package.json 的一步：
// 1. 用 npm-check-updates（ncu）把 PACKAGE_FILES 中的依赖升到当前大版本内的最新版本，升级策略见同目录的 ncurc.cjs；
// 2. 让根目录 package.json 中 pnpm.overrides 的版本与依赖中的版本一致（syncpack 会检查两者是否相同）；
// 3. 生成 PR 说明：升级了哪些包，以及有更新版本但没有升级的包和原因。
// 用法：在仓库根目录运行 node weekly-deps.mjs <PR 说明的输出路径>，需要事先全局安装 ncu。
// 有包被升级时向 GITHUB_OUTPUT 写入 changed=true，否则写入 changed=false。
// 本地试运行时可以用环境变量 NCU_BIN 指定 ncu 的 JS 入口文件，代替全局的 ncu 命令。
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_FILES = ['package.json', 'apps/docs/package.json'];
const SECTIONS = ['dependencies', 'devDependencies'];
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const NCU_CONFIG_NAME = 'ncurc.cjs';
const ncuConfig = createRequire(import.meta.url)(`./${NCU_CONFIG_NAME}`);

// 有更新版本但不自动升级的已知原因。没列出的包按下面 getHoldReason 中的规则说明
const HOLD_REASONS = {
  eslint: 'eslint-config-mantine 只支持 ESLint 9',
  '@eslint/js': 'eslint-config-mantine 只支持 ESLint 9',
  typescript: 'typescript-eslint 要求 TypeScript < 6.1',
  stylelint: 'stylelint-config-standard-scss 17 只支持 stylelint 17',
  '@types/node': '`@types/node` 不升大版本',
};

const outputPath = process.argv[2];
if (!outputPath) {
  throw new Error('用法：node weekly-deps.mjs <PR 说明的输出路径>');
}

/** 运行 ncu，返回它输出的 JSON：{ 包名: 新的版本范围 } */
function runNcu(args) {
  const [command, ...prefix] = process.env.NCU_BIN
    ? [process.execPath, process.env.NCU_BIN]
    : ['ncu'];
  const result = spawnSync(command, [...prefix, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`ncu 运行失败：ncu ${args.join(' ')}`);
  }
  // JSON 模式下 ncu 只输出 JSON；保险起见只取第一个 { 到最后一个 } 之间的内容
  const start = result.stdout.indexOf('{');
  const end = result.stdout.lastIndexOf('}');
  return start === -1 ? {} : JSON.parse(result.stdout.slice(start, end + 1));
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** 取出 package.json 中 dependencies 和 devDependencies 的全部版本范围：{ 包名: 版本范围 } */
function collectSpecs(packageJson) {
  return Object.assign({}, ...SECTIONS.map((section) => packageJson[section] ?? {}));
}

/** 从版本范围（如 ^10.6.2、9.7.3、^11）中取出版本号，返回 { text, parts }，缺的段按 0 计 */
function parseVersion(spec) {
  const match = /(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(spec);
  if (!match) {
    return null;
  }
  return { text: match[0], parts: match.slice(1, 4).map((part) => Number(part ?? 0)) };
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a.parts[i] !== b.parts[i]) {
      return a.parts[i] - b.parts[i];
    }
  }
  return 0;
}

function getHoldReason(name, current, latest) {
  if (HOLD_REASONS[name]) {
    return HOLD_REASONS[name];
  }
  if (ncuConfig.reject.includes(name)) {
    return '打了 pnpm 补丁（`patches/` 目录），补丁对新版本不一定适用，需要手动升级并检查补丁';
  }
  if (current.parts[0] === 0) {
    return '0.x 版本的 minor 升级可能不兼容，等同于大版本升级，需要手动升级';
  }
  if (latest.parts[0] > current.parts[0]) {
    return '大版本升级需要维护者实机确认后手动进行';
  }
  return `升级策略（\`.github/scripts/${NCU_CONFIG_NAME}\`）没有升到这个版本`;
}

/** 把同一个包在多个文件里的相同变化合并成一行，所在文件用顿号连接 */
function mergeRows(rows, keyOf) {
  const merged = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = merged.get(key);
    if (existing) {
      existing.files.push(row.file);
    } else {
      merged.set(key, { ...row, files: [row.file] });
    }
  }
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const code = (text) => `\`${text}\``;

const upgraded = [];
const held = [];

for (const file of PACKAGE_FILES) {
  const before = collectSpecs(readJson(file));

  // 不加升级策略，查出每个包 latest 标签对应的版本，用来列出没有升级的包
  const latest = runNcu(['--packageFile', file, '--dep', 'prod,dev', '--jsonUpgraded']);

  // 按升级策略升级，直接改写 package.json（ncu 只改版本号，保留文件原有格式）
  runNcu([
    '--packageFile',
    file,
    '--configFilePath',
    SCRIPT_DIR,
    '--configFileName',
    NCU_CONFIG_NAME,
    '--upgrade',
    '--jsonUpgraded',
  ]);
  const after = collectSpecs(readJson(file));

  for (const [name, spec] of Object.entries(after)) {
    if (before[name] !== spec) {
      upgraded.push({ name, from: before[name], to: spec, file });
    }
  }

  for (const [name, latestSpec] of Object.entries(latest)) {
    const current = parseVersion(after[name]);
    const newest = parseVersion(latestSpec);
    if (current && newest && compareVersions(newest, current) > 0) {
      held.push({
        name,
        current: after[name],
        latest: newest.text,
        reason: getHoldReason(name, current, newest),
        file,
      });
    }
  }
}

// pnpm.overrides 中与依赖同名的包，版本改成依赖中的版本
const rootPackage = readJson('package.json');
const overrides = rootPackage.pnpm?.overrides ?? {};
const rootSpecs = collectSpecs(rootPackage);
const syncedOverrides = [];
for (const [name, spec] of Object.entries(overrides)) {
  if (typeof spec === 'string' && rootSpecs[name] && rootSpecs[name] !== spec) {
    overrides[name] = rootSpecs[name];
    syncedOverrides.push({ name, from: spec, to: rootSpecs[name] });
  }
}
if (syncedOverrides.length > 0) {
  // 仓库中的 package.json 都是 2 空格缩进、末尾换行，与 JSON.stringify 的输出一致
  writeFileSync('package.json', `${JSON.stringify(rootPackage, null, 2)}\n`);
}

const upgradedRows = mergeRows(upgraded, (row) => `${row.name} ${row.from} ${row.to}`);
const heldRows = mergeRows(held, (row) => `${row.name} ${row.current} ${row.latest}`);
const changed = upgradedRows.length > 0 || syncedOverrides.length > 0;

const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
const workflowLink =
  GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID
    ? `[每周依赖升级工作流](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID})`
    : '每周依赖升级工作流';
const branch = process.env.BRANCH ?? 'deps/weekly';
const base = process.env.BASE ?? 'master';
const today = new Date().toISOString().slice(0, 10);

const lines = [
  `由${workflowLink}（\`.github/workflows/weekly-deps.yml\`）生成，最近一次更新：${today}（UTC）。`,
  '',
  `把 ${PACKAGE_FILES.map(code).join(' 和 ')} 中的依赖升到当前大版本内的最新版本，然后运行 \`pnpm install\` 和 \`pnpm dedupe\` 重新生成 \`pnpm-lock.yaml\`。`,
  '',
  `## 已升级（${upgradedRows.length} 个）`,
  '',
];
if (upgradedRows.length > 0) {
  lines.push('| 包 | 旧版本 | 新版本 | 所在文件 |', '| --- | --- | --- | --- |');
  for (const row of upgradedRows) {
    lines.push(
      `| ${code(row.name)} | ${code(row.from)} | ${code(row.to)} | ${row.files.map(code).join('、')} |`
    );
  }
} else {
  lines.push('没有可以升级的包。');
}
if (syncedOverrides.length > 0) {
  lines.push(
    '',
    `根目录 \`package.json\` 的 \`pnpm.overrides\` 已同步：${syncedOverrides
      .map((item) => `${code(item.name)} ${code(item.from)} → ${code(item.to)}`)
      .join('，')}。`
  );
}

lines.push('', `## 有更新版本但没有升级（${heldRows.length} 个）`, '');
if (heldRows.length > 0) {
  lines.push('| 包 | 当前版本 | 最新版本 | 原因 |', '| --- | --- | --- | --- |');
  for (const row of heldRows) {
    lines.push(`| ${code(row.name)} | ${code(row.current)} | ${code(row.latest)} | ${row.reason} |`);
  }
} else {
  lines.push('没有。');
}

lines.push(
  '',
  '## 说明',
  '',
  `- 只升到同一大版本内的最新版本；0.x 版本的包只升 patch。具体规则在 \`.github/scripts/${NCU_CONFIG_NAME}\`。`,
  `- 每次运行时，分支 \`${branch}\` 都从 \`${base}\` 重新生成并强制推送，本 PR 的内容随之更新。`,
  `- 如果在分支 \`${branch}\` 上另外提交了改动（包括 \`update-screenshots\` 标签生成的提交），在本 PR 合并或关闭之前，工作流不会再覆盖这个分支。`
);

const body = `${lines.join('\n')}\n`;
writeFileSync(outputPath, body);
console.log(body);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}
