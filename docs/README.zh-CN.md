[English](../README.md) | [中文](README.zh-CN.md)

# Mantyke

一套基于 [Mantine UI](https://mantine.dev) 的扩展组件库，使用 TypeScript 编写，以 pnpm monorepo 形式组织，由 Nx 编排构建。

## 目录

- [包列表](#包列表)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [可用脚本](#可用脚本)
- [开发工作流](#开发工作流)
- [构建工作流](#构建工作流)
- [测试工作流](#测试工作流)
- [CI/CD 工作流](#cicd-工作流)
- [发布工作流](#发布工作流)
- [添加新包](#添加新包)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 包列表

| 包名                                                    | 说明                                         | npm                                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [@mantyke/spotlight-image](../packages/spotlight-image) | 交互式图片组件，支持缩放、拖拽平移和全屏查看 | [![NPM Version](https://img.shields.io/npm/v/@mantyke/spotlight-image)](https://www.npmjs.com/package/@mantyke/spotlight-image) |
| [@mantyke/masonry](../packages/masonry)                 | 瀑布流、等高列、等宽行三种布局               | [![NPM Version](https://img.shields.io/npm/v/@mantyke/masonry)](https://www.npmjs.com/package/@mantyke/masonry)                 |

文档站：https://toshinaki.github.io/mantyke/

---

## 技术栈

| 类别       | 工具                                                   | 用途                                    |
| ---------- | ------------------------------------------------------ | --------------------------------------- |
| 包管理     | pnpm + workspaces                                      | 管理 monorepo 多包依赖                  |
| 构建编排   | Nx                                                     | 任务编排、缓存、affected 分析           |
| 打包工具   | Rollup                                                 | 输出 ESM/CJS 双格式，处理 CSS Modules   |
| 版本管理   | Changesets                                             | 版本号管理、changelog 生成、自动发布    |
| 文档站     | Next.js                                                | 组件文档站，部署到 GitHub Pages         |
| 单元测试   | Jest + React Testing Library                           | 组件 props、事件、Styles API 等逻辑测试 |
| UI 测试    | Storybook + `@storybook/addon-vitest`（Vitest 浏览器模式 + Playwright） | 在 Chromium 中验证交互与布局            |
| 代码检查   | ESLint + Stylelint + Prettier                          | 代码风格和质量检查                      |
| 依赖一致性 | syncpack                                               | 确保 monorepo 中依赖版本一致            |
| CI/CD      | GitHub Actions                                         | 自动化验证、构建、发布和文档部署        |
| 组件开发   | Storybook                                              | 组件独立开发和预览                      |

---

## 快速开始

### 环境要求

- **Node.js** 20+
- **pnpm** 10+（项目锁定 pnpm@10.12.1）

### 安装和首次构建

```bash
# 如果没有安装 pnpm
npm install -g pnpm

# 安装所有依赖
pnpm install

# 构建所有包
pnpm run build
```

### 启动开发

```bash
# 启动文档站开发服务器（带热重载）
pnpm run dev

# 启动 Storybook（端口 8271）
pnpm run storybook
```

---

## 项目结构

```
.
├── apps/
│   └── docs/                  # Next.js 文档站
│       ├── pages/             #   首页（包一览）与每个包的详情页
│       ├── components/        #   文档专用 UI 组件
│       ├── demos/             #   交互式 Demo 组件
│       ├── styles-api/        #   各组件的 Styles API 说明数据
│       ├── <包名>.mdx         #   各包详情页的文档内容
│       └── data.ts            #   包列表与元信息
├── packages/
│   ├── spotlight-image/       # SpotlightImage 组件包
│   │   ├── src/
│   │   │   ├── index.ts                        # 入口文件，导出所有 API
│   │   │   ├── spotlight-image.tsx             # 核心组件实现
│   │   │   ├── spotlight-image.module.css      # CSS Modules 样式
│   │   │   ├── spotlight-image.test.tsx        # 单元测试
│   │   │   ├── spotlight-image.story.tsx       # Storybook stories
│   │   │   └── spotlight-image.ui-test.story.tsx  # UI 测试
│   │   ├── package.json       #   包配置（双格式导出）
│   │   └── project.json       #   Nx 项目配置
│   └── masonry/               # Masonry 组件包（结构同上）
├── .storybook/                # Storybook 配置、UI 测试辅助函数与测试图片
├── scripts/                   # 构建和工具脚本
│   ├── generate-dts.ts        #   生成 TypeScript 声明文件
│   ├── prepare-css.ts         #   CSS 后处理
│   ├── docgen.ts              #   组件文档（Props 表格）生成
│   ├── generate-test-fixtures.ts  # 生成 UI 测试图片
│   ├── clean.ts               #   清理构建产物
│   └── utils.mjs              #   共享工具函数（获取包列表等）
├── .github/workflows/         # GitHub Actions 工作流
│   ├── ci.yml                 #   master 分支 CI
│   ├── pr.yml                 #   PR 验证
│   ├── release.yml            #   自动发布
│   └── docs.yml               #   文档站部署
├── .changeset/                # Changesets 配置
│   └── config.json            #   发布配置
├── docs/                      # 项目文档：中文 README、UI 测试用例
├── vitest.config.ts           # UI 测试配置
├── rollup.config.mjs          # Rollup 构建配置
├── nx.json                    # Nx 全局配置
└── package.json               # 根 package.json（脚本入口）
```

---

## 可用脚本

### 根级脚本

在项目根目录运行：

| 命令                         | 作用                                         | 什么时候用                         |
| ---------------------------- | -------------------------------------------- | ---------------------------------- |
| `pnpm install`               | 安装所有依赖                                 | 克隆项目后、依赖变更后             |
| `pnpm run build`             | 构建所有包（Rollup + dts + CSS）             | 发布前、验证构建是否正常           |
| `pnpm run dev`               | 启动文档站开发服务器                         | 日常开发、编写文档                 |
| `pnpm run storybook`         | 启动 Storybook（端口 8271）                  | 独立开发和预览组件                 |
| `pnpm run test`              | 运行完整测试流水线（不含 UI 测试）           | 提交 PR 前的最终检查               |
| `pnpm run test:ui`           | 在 Chromium 中运行 UI 测试                   | 修改组件交互或布局后               |
| `pnpm run lint`              | ESLint + Stylelint 检查                      | 检查代码风格                       |
| `pnpm run typecheck`         | TypeScript 类型检查                          | 检查类型错误                       |
| `pnpm run jest`              | 仅运行单元测试                               | 快速跑测试                         |
| `pnpm run clean`             | 清理所有 dist 目录                           | 构建出问题时重新来过               |
| `pnpm run docgen`            | 生成组件 Props 文档                          | 更新组件 API 后                    |
| `pnpm run docs:build`        | 构建文档站静态文件                           | 本地验证文档站构建                 |
| `pnpm run fixtures:generate` | 重新生成 UI 测试图片                         | 修改 `.storybook/fixtures.ts` 后   |
| `pnpm changeset`             | 创建变更集                                   | 有用户可感知的改动时               |
| `pnpm run syncpack`          | 检查依赖版本一致性                           | 更新依赖后                         |

### Nx 命令

```bash
# 测试指定包
pnpm nx test @mantyke/spotlight-image

# 只对受影响的项目做类型检查和 lint（PR 中使用）
pnpm nx affected -t typecheck lint

# 查看受影响项目的依赖关系图
pnpm nx graph --affected
```

> **Nx 核心概念**：`run-many` 对所有项目执行任务，`affected` 只对有变更的项目执行。PR 验证中的类型检查、lint 和单元测试使用 `affected`，可以跳过无关的包。Nx 还会缓存任务结果，相同输入不会重复执行。

> **注意**：每个包的 `build` target 执行的都是根目录的 `pnpm run build`，会构建全部包。构建时直接运行 `pnpm run build`，不要对多个项目并行执行 `build` target：多个完整构建同时运行会争用 `temp/` 目录而失败。

---

## 开发工作流

日常开发的典型流程：

### 1. 安装依赖

```bash
pnpm install
```

> 使用 pnpm workspaces，所有包的依赖都安装在根目录的 `node_modules` 中，包之间的引用通过 workspace 协议自动链接。

### 2. 启动开发服务器

有两种方式开发组件：

**方式 A：文档站**

```bash
pnpm run dev
```

这个命令做了两件事：
1. 运行 `pnpm docgen`：用 `mantine-docgen-script` 从组件源码提取 Props 类型信息，生成 `apps/docs/docgen.json`
2. 启动 Next.js 文档站开发服务器，端口 9281

文档站引用的是各包的构建产物，修改组件代码后需要重新运行 `pnpm run build` 才能在文档站看到效果。

**方式 B：Storybook（推荐）**

```bash
pnpm run storybook
```

在端口 8271 启动 Storybook，直接引用组件源码，修改后自动刷新。展示用的 stories 定义在 `*.story.tsx` 中，可以通过 Controls 面板调整 props；「UI Tests」分组下是 UI 测试用的 stories。

### 3. 修改代码

组件源码在 `packages/<组件名>/src/` 目录下：
- `<组件名>.tsx`：核心组件逻辑
- `<组件名>.module.css`：样式
- `index.ts`：导出声明

### 4. 验证改动

```bash
# 快速检查：只跑类型检查和 lint
pnpm run typecheck && pnpm run lint

# 跑单元测试
pnpm run jest

# 跑 UI 测试
pnpm run test:ui

# 完整检查（不含 UI 测试）
pnpm run test
```

---

## 构建工作流

运行 `pnpm run build` 会按以下步骤执行：

### 完整流程

```
pnpm run build
  │
  ├── 1. rollup -c rollup.config.mjs
  │     ├── 读取 packages/ 下所有包（通过 scripts/utils.mjs）
  │     ├── 对每个包：
  │     │   ├── esbuild 编译 TypeScript → JavaScript
  │     │   ├── PostCSS 处理 CSS Modules（使用 'mantyke' 命名空间哈希选择器）
  │     │   ├── 输出 ESM 格式 → dist/esm/index.mjs
  │     │   ├── 输出 CJS 格式 → dist/cjs/index.cjs
  │     │   ├── 输出 CSS → dist/styles.css
  │     │   └── 为非入口 chunk 注入 'use client' 指令（React Server Components 兼容）
  │     └── 生成 Source Maps
  │
  ├── 2. tsx scripts/generate-dts
  │     └── 为每个包生成 TypeScript 声明文件 → dist/types/index.d.ts
  │
  └── 3. tsx scripts/prepare-css
        └── CSS 后处理（生成 styles.layer.css 等变体）
```

### 构建产物

每个包构建后的 `dist/` 目录结构：

```
dist/
├── esm/index.mjs          # ES Modules 格式（现代打包工具使用）
├── cjs/index.cjs           # CommonJS 格式（Node.js require 使用）
├── types/index.d.ts        # TypeScript 类型声明
├── styles.css              # 组件样式
└── styles.layer.css        # CSS Layers 版本（更好的优先级控制）
```

> **提示**：如果构建结果异常，运行 `pnpm run clean` 清理所有 dist 目录后重新构建。

---

## 测试工作流

### 完整测试流水线

运行 `pnpm run test` 会依次执行以下 5 个步骤：

```
pnpm run test
  │
  ├── 1. pnpm syncpack          # 检查 monorepo 依赖版本一致性（包括 pnpm.overrides）
  ├── 2. pnpm prettier:check    # 检查代码格式是否符合 Prettier 规范
  ├── 3. pnpm typecheck          # TypeScript 类型检查（通过 Nx 并行执行）
  ├── 4. pnpm lint               # ESLint + Stylelint 代码检查（通过 Nx 并行执行）
  └── 5. pnpm jest               # Jest 单元测试（通过 Nx 并行执行）
```

> 这 5 步是串行执行的（用 `&&` 连接），任何一步失败都会中断后续步骤。UI 测试不在其中，需要单独运行 `pnpm run test:ui`。

### 单独运行各项检查

```bash
# 只跑依赖一致性检查
pnpm run syncpack

# 只跑格式检查（不修改文件）
pnpm run prettier:check

# 自动修复格式问题
pnpm run prettier:write

# 只跑类型检查
pnpm run typecheck

# 只跑 ESLint
pnpm run eslint

# 只跑 Stylelint
pnpm run stylelint

# 只跑 ESLint + Stylelint
pnpm run lint

# 只跑单元测试
pnpm run jest

# 跑指定包的测试
pnpm nx test @mantyke/spotlight-image
```

### 测试框架

- **Jest**：单元测试运行器，使用 `jest-environment-jsdom` 模拟浏览器环境
- **React Testing Library**：组件测试，按用户行为方式测试
- **@mantine-tests/core**：Mantine 官方测试工具，自动测试 Styles API、系统 Props 等
- **jest-axe**：无障碍性测试

### UI 测试

jsdom 不计算布局，缩放、拖动、瀑布流排版这类效果只能在真实浏览器中验证，这部分由 UI 测试负责。

- **用例设计**：用例从用户体验出发编写，定义在 [ui-test-plan.md](ui-test-plan.md)。测试结果与代码不符时，默认视为代码问题，而不是修改用例去适配代码。
- **实现方式**：每个用例是一个带 `play` 函数的 story，写在 `packages/<包名>/src/<包名>.ui-test.story.tsx` 中，由 `@storybook/addon-vitest` 在 Chromium 中运行。鼠标、滚轮、键盘通过 Playwright 发送浏览器可信事件；触摸使用合成事件。
- **测试图片**：图片由 `pnpm run fixtures:generate` 根据 `.storybook/fixtures.ts` 生成，带渐变、网格、四角标记和中心圆，平移、裁切和变形一眼可见。
- **运行前准备**：首次运行前需要安装 Chromium：`pnpm exec playwright install chromium`。
- **实机确认**：触屏手势、Safari、触控板等自动化覆盖不到的部分，按 [ui-test-plan.md](ui-test-plan.md) 第 6 节的清单在真机上确认。

---

## CI/CD 工作流

项目配置了 4 个 GitHub Actions 工作流，它们的关系如下：

```
PR 提交 ──→ pr.yml（验证 PR）
                                    ↓ PR 合并
master 推送 ──→ ci.yml（全量 CI）──→ 成功后触发 ──┬→ release.yml（自动发布）
                                                   └→ docs.yml（部署文档站）
```

### ci.yml：Master 分支 CI

**文件**：`.github/workflows/ci.yml`

**触发条件**：
- 推送到 `master` 分支
- 手动触发（`workflow_dispatch`）

**并发策略**：`cancel-in-progress: false`，不取消正在运行的 CI，确保每次推送都完整执行。

**执行步骤**：

| 步骤 | 命令                                        | 说明                                      |
| ---- | ------------------------------------------- | ----------------------------------------- |
| 1    | `actions/checkout` (fetch-depth: 0)         | 检出代码，获取完整 Git 历史               |
| 2    | `pnpm/action-setup` + `actions/setup-node`  | 安装 pnpm 和 Node.js 20，启用 pnpm 缓存   |
| 3    | `pnpm install --frozen-lockfile`            | 安装依赖（严格模式，不允许修改 lockfile） |
| 4    | `nrwl/nx-set-shas`                          | 设置 Nx 基准 SHA，用于 affected 分析      |
| 5    | `pnpm run build`                            | 构建所有包                                |
| 6    | `pnpm run docgen`                           | 生成组件文档                              |
| 7    | `pnpm nx run-many -t typecheck`             | 类型检查所有项目                          |
| 8    | `pnpm nx run-many -t lint`                  | ESLint 检查所有项目                       |
| 9    | `pnpm nx run-many -t stylelint`             | Stylelint 检查所有项目                    |
| 10   | `pnpm nx run-many -t test --coverage`       | 单元测试所有项目（带覆盖率）              |
| 11   | `pnpm nx build mantyke-docs`                | 构建文档站                                |

### pr.yml：Pull Request 验证

**文件**：`.github/workflows/pr.yml`

**触发条件**：
- 向 `master` 或 `develop` 分支提交 PR
- Merge Group（合并队列）

**并发策略**：`cancel-in-progress: true`，同一 PR 的新推送会取消之前正在运行的验证，节省 CI 资源。

包含两个 job：

- **Validate PR**：构建、类型检查、ESLint、Stylelint、单元测试、文档站构建、changeset 检查。
- **UI Tests**：安装 Chromium 后运行 `pnpm run test:ui`，失败时上传截图。

**与 ci.yml 的关键区别**：

| 区别                       | ci.yml                    | pr.yml                          |
| -------------------------- | ------------------------- | ------------------------------- |
| 类型检查、lint、单元测试   | `nx run-many`（所有项目） | `nx affected`（仅受影响的项目） |
| 构建                       | `pnpm run build`          | `pnpm run build`                |
| 覆盖率报告                 | 不上传                    | 上传 artifact（保留 7 天）      |
| UI 测试                    | 无                        | 有                              |
| Changeset 检查             | 无                        | 有（检查是否添加了变更集）      |

**Changeset 检查逻辑**：
- 如果 PR 作者是机器人（renovate、dependabot），跳过检查
- 否则运行 `pnpm changeset status --since=origin/master`
- 如果没有 changeset，自动在 PR 中评论提醒

### release.yml：自动发布

**文件**：`.github/workflows/release.yml`

**触发条件**：
- `ci.yml` 在 master 分支成功完成后自动触发（`workflow_run`）
- 手动触发

**前提条件**：只有 CI 成功（`workflow_run.conclusion == 'success'`）才会执行。

**npm 认证**：使用 npm trusted publishing（OIDC），仓库中不保存 npm token。发布时通过环境变量 `NPM_CONFIG_PROVENANCE` 生成来源证明（provenance）。

**执行流程**：

```
1. 检出代码、安装依赖、运行 pnpm run build
2. changesets/action 运行
   │
   ├── 情况 A：.changeset/ 中有未消费的 changeset →
   │   创建或更新 "Version Packages" PR
   │   （自动 bump 版本号、更新 CHANGELOG）
   │
   └── 情况 B：没有未消费的 changeset（Version Packages PR 被合并后，或普通提交）→
       运行 `pnpm release`（即 `changeset publish`）
       只发布 npm 上还不存在的版本；没有新版本时不发布任何包
3. 如果有包发布成功 →
   为每个发布的包创建 GitHub Release
   标签格式：{包名}@{版本号}
```

> `changeset publish` 从 2.31 起会拒绝不认识的参数，`publish` 命令中不要再添加 `--access`、`--provenance` 之类的参数。

### docs.yml：部署文档站

**文件**：`.github/workflows/docs.yml`

**触发条件**：
- `ci.yml` 在 master 分支成功完成后触发（`workflow_run`）
- 手动触发

**执行步骤**：运行 `pnpm run build` 构建各包，再运行 `pnpm docs:build` 导出静态文件，部署到 GitHub Pages。

---

## 发布工作流

### Changesets 基础

[Changesets](https://github.com/changesets/changesets) 是版本管理工具，核心概念：
- **Changeset 文件**：一个 Markdown 文件，记录「哪些包改了」和「改动级别」（patch/minor/major）
- 存放在 `.changeset/` 目录中
- 合并到 master 后，由 CI 自动消费这些文件来 bump 版本号

**当前配置**（`.changeset/config.json`）：

| 配置项       | 值                 | 含义                                                                               |
| ------------ | ------------------ | ---------------------------------------------------------------------------------- |
| `baseBranch` | `master`           | 基准分支                                                                           |
| `access`     | `restricted`       | 默认访问级别。各包在 `package.json` 的 `publishConfig.access` 中设为 `public`，以包的设置为准，实际为公开发布 |
| `commit`     | `false`            | 版本 bump 时不自动创建 commit                                                      |
| `ignore`     | `["mantyke-docs"]` | 忽略文档站，不参与版本管理                                                         |

### 创建 Changeset

当你的改动包含用户可感知的变化时（新功能、Bug 修复、Breaking Change），需要添加 changeset：

```bash
pnpm changeset
```

交互式提示：
1. **选择受影响的包**：用空格选中，回车确认
2. **选择版本级别**：
   - `patch`（0.1.0 → 0.1.1）：Bug 修复、小改动
   - `minor`（0.1.0 → 0.2.0）：新功能、非破坏性改动
   - `major`（0.1.0 → 1.0.0）：Breaking Change、不向后兼容的改动
3. **填写变更摘要**：简短描述本次改动

完成后会在 `.changeset/` 目录生成一个 `.md` 文件，把它一起 commit 即可。

### 完整的自动发布流程

从开发到发布的完整链路：

```
1. 创建功能分支
   git checkout -b feat/my-feature

2. 开发 + 添加 changeset
   pnpm changeset

3. 提交 PR
   git push → 创建 PR
        ↓
   pr.yml 自动验证（构建、测试、lint、changeset 检查、UI 测试）

4. 合并 PR 到 master
        ↓
   ci.yml 全量 CI（构建、测试、lint、文档构建）
        ↓
   CI 成功 → 触发 release.yml
        ↓
   release.yml 检测到 changeset → 创建 "Version Packages" PR
   （这个 PR 自动 bump package.json 版本号、更新 CHANGELOG.md）

5. 合并 "Version Packages" PR
        ↓
   ci.yml 再次运行
        ↓
   CI 成功 → 触发 release.yml
        ↓
   release.yml 检测到版本已 bump → 运行 changeset publish → 发布到 npm
        ↓
   自动创建 GitHub Release
```

> "Version Packages" PR 由 github-actions[bot] 创建，GitHub 不会为它自动运行 pr.yml，PR 页面上的验证显示为未运行或失败属于正常现象。它只修改版本号和 CHANGELOG，合并后由 master 的 CI 完整验证。

### 手动发布

如果需要手动发布（例如 CI 不可用时）：

```bash
# 1. 消费 changeset，bump 版本号
pnpm changeset version

# 2. 构建所有包
pnpm run build

# 3. 发布到 npm
pnpm changeset publish
```

---

## 添加新包

如果要在 monorepo 中新增一个组件包，按以下步骤操作：

### 1. 创建目录结构

```bash
mkdir -p packages/my-component/src
```

### 2. 创建 package.json

`publishConfig.access` 必须设为 `public`，否则带 scope 的包会按私有包发布而失败：

```json
{
  "name": "@mantyke/my-component",
  "version": "0.1.0",
  "publishConfig": {
    "access": "public"
  },
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.mjs",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.mjs",
      "require": "./dist/cjs/index.cjs"
    },
    "./styles.css": "./dist/styles.css"
  },
  "peerDependencies": {
    "@mantine/core": ">=7.0.0",
    "@mantine/hooks": ">=7.0.0",
    "react": "^18.x || ^19.x",
    "react-dom": "^18.x || ^19.x"
  }
}
```

### 3. 创建 project.json（Nx 配置）

从现有的包复制 `project.json`，修改其中的包名和路径。需要包含 build、typecheck、lint、test、stylelint 五个 target。

### 4. 编写组件

```
packages/my-component/src/
├── index.ts                        # 导出所有公共 API
├── my-component.tsx                # 组件实现
├── my-component.module.css         # 样式
├── my-component.test.tsx           # 单元测试
├── my-component.story.tsx          # Storybook Story
└── my-component.ui-test.story.tsx  # UI 测试（用例先写进 docs/ui-test-plan.md）
```

### 5. 加入文档站

- `apps/docs/data.ts`：在 `PACKAGES` 中添加一项
- 新建 `apps/docs/pages/<slug>.tsx` 和 `apps/docs/<slug>.mdx`
- 在 `apps/docs/demos/` 中添加示例，在 `apps/docs/styles-api/` 中添加 Styles API 数据
- 在 `apps/docs/pages/_app.tsx` 中引入包的样式
- 在 `apps/docs/package.json` 中添加依赖，在 `scripts/docgen.ts` 中添加组件路径

### 6. 安装依赖并验证

```bash
# 更新 workspace 链接
pnpm install

# 验证构建
pnpm run build

# 运行测试
pnpm run test
pnpm run test:ui
```

> **注意**：Rollup 配置（`rollup.config.mjs`）会通过 `scripts/utils.mjs` 自动发现 `packages/` 目录下的所有包，无需手动修改构建配置。

---

## 贡献指南

### 开发流程

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/<你的用户名>/mantyke.git
cd mantyke

# 2. 安装依赖
pnpm install

# 3. 创建功能分支
git checkout -b feat/my-feature

# 4. 开发（启动 Storybook 或文档站）
pnpm run storybook   # 或
pnpm run dev

# 5. 确保所有检查通过
pnpm run test
pnpm run test:ui

# 6. 添加 changeset（如果有用户可感知的变更）
pnpm changeset

# 7. 提交并推送
git add .
git commit -m "feat: 描述你的改动"
git push origin feat/my-feature

# 8. 在 GitHub 上创建 Pull Request
```

### 代码质量要求

所有 PR 必须通过以下检查：

| 检查项              | 说明                                         |
| ------------------- | -------------------------------------------- |
| TypeScript 类型检查 | `tsc --noEmit` 无报错                        |
| ESLint              | 使用 `eslint-config-mantine` 规则集          |
| Stylelint           | 使用 `stylelint-config-standard-scss` 规则集 |
| Prettier            | 代码格式统一                                 |
| syncpack            | monorepo 依赖版本一致                        |
| 单元测试            | 所有测试必须通过                             |
| UI 测试             | 所有自动运行的 UI 测试必须通过               |
| 构建验证            | `pnpm run build` 与文档站构建必须成功        |

---

## 许可证

MIT

## 链接

- [Documentation](https://toshinaki.github.io/mantyke/)
- [GitHub](https://github.com/Toshinaki/mantyke)
- [Issues](https://github.com/Toshinaki/mantyke/issues)
- [Mantine UI](https://mantine.dev)
