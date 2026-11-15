// 把 mantyke 里的赞助信息同步成 Ishtar-Gate/.github 仓库（作者所有项目赞助信息的唯一来源）sponsor/ 文件夹中的最新内容。
// 每周依赖升级（.github/workflows/weekly-deps.yml）顺便运行它；有变化时，改动和依赖升级放进同一个 PR。
//
// 同步的内容（来源路径都相对 Ishtar-Gate/.github 的 sponsor/）：
// - COPIED_FILES：原样复制的文件，例如文档站赞助页用的数据、英文文字和二维码；
// - READMES：各 README 里 <!-- sponsor:start --> 和 <!-- sponsor:end --> 两行标记之间的内容，
//   换成 snippets/readme-section.<语言>.md，并把其中的 PROJECT_NAME 换成项目名。标记之外的内容不动；
// - PACKAGE_JSONS：各包 package.json 的 funding 字段，换成 snippets/package-json-funding.json 里的。
// packages/ 下的文件有变化时，再加一个 patch changeset（记录要发布新版本的文件），
// 否则 npm 上的包带不上新的 README 和 funding。
//
// 用法：在仓库根目录运行 node .github/scripts/sync-sponsor.mjs [PR 说明文件的路径]
// 给了路径时，在该文件末尾追加一节「赞助信息」，说明哪些文件有变化。
// 运行在 GitHub Actions 中时，把 changed=true 或 changed=false 写进环境变量 GITHUB_OUTPUT 指向的步骤输出文件。
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/Ishtar-Gate/.github/main/sponsor';
const SOURCE_PAGE = 'https://github.com/Ishtar-Gate/.github/tree/main/sponsor';

const COPIED_FILES = [
  ['sponsor.json', 'apps/docs/sponsor/sponsor.json'],
  ['locales/en.json', 'apps/docs/sponsor/en.json'],
  ['qr/kofi.png', 'apps/docs/sponsor/qr/kofi.png'],
  ['qr/wechat.png', 'apps/docs/sponsor/qr/wechat.png'],
  ['qr/alipay.png', 'apps/docs/sponsor/qr/alipay.png'],
  ['qr/github-sponsors.png', 'apps/docs/sponsor/qr/github-sponsors.png'],
  ['snippets/FUNDING.yml', '.github/FUNDING.yml'],
];

const READMES = [
  { file: 'README.md', lang: 'en', projectName: 'Mantyke' },
  { file: 'docs/README.zh-CN.md', lang: 'zh', projectName: 'Mantyke' },
  { file: 'packages/masonry/README.md', lang: 'en', projectName: '`@mantyke/masonry`' },
  {
    file: 'packages/spotlight-image/README.md',
    lang: 'en',
    projectName: '`@mantyke/spotlight-image`',
  },
];

const PACKAGE_JSONS = ['packages/masonry/package.json', 'packages/spotlight-image/package.json'];

const START_MARKER = '<!-- sponsor:start -->';
const END_MARKER = '<!-- sponsor:end -->';
const CHANGESET_FILE = '.changeset/sponsor-sync.md';

async function download(path) {
  const response = await fetch(`${SOURCE}/${path}`);
  if (!response.ok) {
    throw new Error(`下载 ${SOURCE}/${path} 失败：HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** 内容不同时写入，返回是否写入 */
function writeIfChanged(file, content) {
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (existsSync(file) && readFileSync(file).equals(next)) {
    return false;
  }
  writeFileSync(file, next);
  return true;
}

function replaceBetweenMarkers(file, section) {
  const text = readFileSync(file, 'utf8');
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);
  // 标记被删掉或写错时直接报错，不猜位置，以免把内容插到错误的地方
  if (start < 0 || end < start || text.indexOf(START_MARKER, start + 1) >= 0) {
    throw new Error(`${file} 里没有唯一的一对 ${START_MARKER} / ${END_MARKER} 标记`);
  }
  const next = `${text.slice(0, start)}${START_MARKER}\n${section}\n${text.slice(end)}`;
  return writeIfChanged(file, next);
}

const changedFiles = [];

for (const [source, target] of COPIED_FILES) {
  if (writeIfChanged(target, await download(source))) {
    changedFiles.push(target);
  }
}

const snippets = {};
for (const { file, lang, projectName } of READMES) {
  snippets[lang] ??= (await download(`snippets/readme-section.${lang}.md`)).toString('utf8');
  const section = snippets[lang].replaceAll('PROJECT_NAME', projectName).trimEnd();
  if (replaceBetweenMarkers(file, section)) {
    changedFiles.push(file);
  }
}

const { funding } = JSON.parse((await download('snippets/package-json-funding.json')).toString());
for (const file of PACKAGE_JSONS) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  // 只在 funding 不同时重写，避免无关的格式差异让文件出现改动
  if (JSON.stringify(pkg.funding) !== JSON.stringify(funding)) {
    pkg.funding = funding;
    writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
    changedFiles.push(file);
  }
}

// 从改动的文件找出要发布新版本的包（packages/<目录>/ 下有改动的），读出包名
const changedPackages = [
  ...new Set(
    changedFiles
      .filter((file) => file.startsWith('packages/'))
      .map((file) => JSON.parse(readFileSync(`packages/${file.split('/')[1]}/package.json`, 'utf8')).name)
  ),
];
if (changedPackages.length > 0) {
  const header = changedPackages.map((name) => `'${name}': patch`).join('\n');
  writeFileSync(
    CHANGESET_FILE,
    `---\n${header}\n---\n\nUpdate the sponsor information in the README and \`funding\`.\n`
  );
  changedFiles.push(CHANGESET_FILE);
}

const changed = changedFiles.length > 0;
const lines = ['', '## 赞助信息', ''];
if (changed) {
  lines.push(
    `[作者的赞助信息](${SOURCE_PAGE})有更新，本 PR 同步了以下文件：`,
    '',
    ...changedFiles.map((file) => `- \`${file}\``)
  );
} else {
  lines.push(`与[作者的赞助信息](${SOURCE_PAGE})一致，没有变化。`);
}
const section = `${lines.join('\n')}\n`;
console.log(section);

const bodyPath = process.argv[2];
if (bodyPath) {
  appendFileSync(bodyPath, section);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, section);
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}
