# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mantyke is a monorepo of Mantine UI extension components. It uses pnpm workspaces with Nx orchestration. Packages:

- `@mantyke/spotlight-image`: image viewer with zoom, pan and fullscreen
- `@mantyke/masonry`: masonry, justified columns and justified rows layouts

The docs site (`apps/docs`, Next.js static export) is deployed to https://toshinaki.github.io/mantyke/.

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages (Rollup → ESM + CJS + CSS + .d.ts)
pnpm run build

# Run full test suite (syncpack + prettier + typecheck + lint + jest)
pnpm run test

# Run only jest tests
pnpm run jest

# Run tests for a specific package
pnpm nx test @mantyke/spotlight-image

# Run UI tests (Storybook stories in real Chromium, not part of `pnpm test`)
pnpm test:ui

# Run UI tests and compare screenshots against local baselines (not committed)
UI_SCREENSHOTS=local pnpm test:ui

# Regenerate UI test fixture images after editing .storybook/fixtures.ts
pnpm fixtures:generate

# Type check
pnpm run typecheck

# Lint (ESLint + Stylelint)
pnpm run lint

# Format
pnpm run prettier:write

# Start docs dev server (port 9281; uses the packages' dist, so rebuild after code changes)
pnpm run dev

# Start Storybook (port 8271; uses package sources)
pnpm run storybook
```

## Architecture

- **Monorepo structure**: Root `package.json` has workspace scripts; each package under `packages/` has its own `package.json` and `project.json` (Nx config).
- **Build pipeline**: `rollup.config.mjs` at root auto-discovers packages via `scripts/utils.mjs` (scans `packages/` for dirs with `package.json` + `src/index.ts`). Outputs ESM (`.mjs`), CJS (`.cjs`), and CSS with hashed selectors (`hash-css-selector` with `mantyke` prefix). Non-index chunks get `'use client'` banner.
- **Build targets**: every package's Nx `build` target runs the root `pnpm run build`, which builds all packages. Run `pnpm run build` once; running several `build` targets in parallel races on the shared `temp/` directory and fails with `ENOTEMPTY`.
- **Component pattern**: Components follow the Mantine `factory()` pattern with `useProps` and `useStyles`. They export the component, its Props type, Factory type, StylesNames, and CssVariables from `src/index.ts`.
- **CSS Modules**: Components use `.module.css` files, processed by PostCSS with `postcss-preset-mantine`. Class names are scoped via `hash-css-selector`.
- **Testing**: Jest with `jsdom` environment, `esbuild-jest` transform, CSS mocked via `identity-obj-proxy`. Tests use `@testing-library/react` and `@mantine-tests/core`. Test files are co-located: `<component>.test.tsx`.
- **Stories**: Co-located Storybook stories: `<component>.story.tsx`, with controls and local fixture images.
- **UI tests**: `<component>.ui-test.story.tsx` stories with `play` functions, run by `@storybook/addon-vitest` in Chromium (`vitest.config.ts`). Cases are designed from user experience in `docs/ui-test-plan.md`; when the code disagrees with a case, treat it as a likely bug instead of adjusting the case. Shared helpers and fixture specs live in `.storybook/`. Visual regression stories (`SI-V*`, `MA-V*`) call `matchScreenshot`; baselines live in `__screenshots__/` next to the stories and are only generated in CI (Linux), so the comparison is skipped locally unless `UI_SCREENSHOTS=local` is set. To create or update baselines, add the `update-screenshots` label to the PR: the `Update Screenshots` workflow regenerates them and commits to the PR branch. `vitest.config.ts` is excluded from Nx target inference (`nx.json`) so UI tests stay out of `nx run-many -t test`.
- **Docs site**: `apps/docs/data.ts` lists the packages; `/` is the overview, each package has `pages/<slug>.tsx` + `<slug>.mdx`, demos in `demos/`, Styles API data in `styles-api/`. Props tables come from `scripts/docgen.ts`.
- **Peer dependencies**: Packages depend on `@mantine/core`, `@mantine/hooks`, `@tabler/icons-react`, `clsx`, `react`, `react-dom` as peers.
- **Dependency consistency**: syncpack also checks `pnpm.overrides`; `react` / `react-dom` are pinned globally there to avoid duplicate React copies in tests.
- **Default branch**: `master` (Nx `defaultBase`).

## CI and Release

- **Required checks**: the `Merge Protection` ruleset on `master` requires `Validate PR` and `UI Tests` (both from `pr.yml`) to pass.
- **Versioning**: Changesets. Merging a PR with changesets makes the Release workflow open a "Version Packages" PR; merging that PR publishes to npm.
- **Release workflow** (`release.yml`): runs after master CI succeeds. It creates the Version Packages PR with a GitHub App token (secrets `RELEASE_APP_ID`, `RELEASE_APP_PRIVATE_KEY`; the App needs Contents, Pull requests and Workflows read/write) so that PR checks run on it. Publishing uses npm trusted publishing (OIDC) with provenance via `NPM_CONFIG_PROVENANCE`. Do not add flags to `changeset publish`; it rejects unknown flags. `changesets/action` v2 needs `@changesets/cli` v3, takes the token via its `github-token` input (not the `GITHUB_TOKEN` env), uses kebab-case inputs/outputs, and creates the GitHub Releases itself.
- **Dependency upgrades (weekly, automatic)**: upgrades within the current major version come from the `Weekly Dependency Upgrades` workflow (`weekly-deps.yml`). It runs every Monday and can also be started by hand (`workflow_dispatch`). Only the PR is automatic: it is never merged automatically; the maintainer reviews it and merges it after the checks pass. Each run:
  1. Upgrades `dependencies` and `devDependencies` in `package.json` and `apps/docs/package.json` to the newest minor/patch release of their current major; packages still on `0.x` get patch releases only (under semver, a `0.x` minor release may break compatibility, like a major one), and so does `typescript` (the repo is on 6.0.x, and typescript-eslint, the tool that lets ESLint check TypeScript code, requires TypeScript < 6.1). Packages listed in the root `package.json`'s `pnpm.patchedDependencies` (dependencies whose installed code the repo modifies with a pnpm patch stored in `patches/`) are skipped, because the patch may not apply to a new version. Packages under `packages/` only declare `peerDependencies` ranges (versions the consuming project must provide; see step 3), which stay as they are. The rules live in `.github/scripts/ncurc.cjs`, the config for npm-check-updates (the tool that picks the versions).
  2. Sets each entry of the root `pnpm.overrides` (versions forced on the whole repository) that has the same name as a root dependency (currently `react` and `react-dom`) to that dependency's new version, because syncpack, the version-consistency check run by `pnpm test`, fails when they differ.
  3. Regenerates `pnpm-lock.yaml` with `pnpm install` and then `pnpm dedupe`. The packages under `packages/` declare Mantine as a peer dependency (one the consuming project should provide). Those packages are members of the pnpm workspace (pnpm's way of managing the several packages in `packages/` and `apps/` within this one repository), and pnpm installs dependencies for each member separately; it also installs peer dependencies automatically by default, so it installs Mantine for each of them and records in the lockfile which version each package got. `pnpm install` only picks new versions for dependencies whose range in `package.json` changed; the packages' peer range (`^9.0.0`, which accepts any 9.x version) did not change and the old version is still inside it, so their record stays on the old Mantine while the root's own `@mantine/core` dependency (upgraded in step 1) moves to the new one. Unit tests render components with `@mantine-tests/core` (installed at the root), which wraps them in the root's new `MantineProvider` (the component that supplies the theme and other settings to everything inside it), while the component source imports the old `@mantine/core` recorded for its package. The provider passes its settings through React context: the outer component stores a value in a context object and inner components read it from the same object. Each copy of `@mantine/core` creates its own context object, so the component looks in the old one, finds nothing, and tests fail with "MantineProvider was not found". `pnpm dedupe` merges such duplicate versions so the packages use the root's version too.
  4. Commits the result on top of the latest `master` and force-pushes that commit to the `deps/weekly` branch, replacing the branch's previous content, then opens or updates one PR from that branch. When the new commit's content is identical to what the branch already has, it skips the push and only refreshes the PR description. When there is nothing to upgrade at all, it opens no PR and closes a still-open one. The PR description lists what was upgraded, and which newer versions were skipped and why.

  The workflow gives all of its own commits the same title. If the open PR also has commits with other titles, the workflow leaves that branch and PR (including its description) alone until the PR is merged or closed. Any commit with another title counts, whatever its purpose; typical ones are:
  - a manual fix to make the checks pass;
  - a lockfile commit from the `Update Lockfile` workflow (`update-lockfile.yml`, which regenerates `pnpm-lock.yaml` in CI when a PR gets the `update-lockfile` label; see Manual upgrades below), after someone edited a version by hand on the weekly PR (for example, reverting a package to its previous version because the new release broke something) and added the `update-lockfile` label;
  - new baseline screenshots (the reference images the UI tests compare against; see UI tests above) from `update-screenshots.yml`, after an upgrade changed how components look and someone added the `update-screenshots` label.

  Dependabot (GitHub's built-in dependency update bot, configured in `.github/dependabot.yml`) no longer opens routine npm upgrade PRs; its version updates now cover only the reusable steps the workflow files reference with `uses:` (such as `actions/checkout@v7`). Dependabot security updates (PRs that upgrade a dependency with a known vulnerability) are separate: they are a repository setting (Settings → Code security), not part of `dependabot.yml`, and when turned on they cover npm dependencies even though `dependabot.yml` has no npm entry. As of 2026-11 they are turned off.
- **Manual upgrades**: everything the weekly workflow skips (major versions, minor releases of `0.x` packages and of `typescript`, packages patched through `pnpm.patchedDependencies`) is upgraded by hand in a separate PR, not on `deps/weekly` (hand edits on the weekly PR are only for fixing that week's upgrades). Local `pnpm install` is very slow on the maintainer's machine, so edit only the versions in `package.json` (and `pnpm.overrides`) locally, push the PR, then add the `update-lockfile` label: the `Update Lockfile` workflow (`update-lockfile.yml`) runs `pnpm install` and `pnpm dedupe` in CI and commits `pnpm-lock.yaml` to the PR branch. Until that commit lands, CI fails at `pnpm install --frozen-lockfile`, which refuses to install when `pnpm-lock.yaml` no longer matches `package.json`.
- **Major updates**: dependency major bumps and major releases must be confirmed on real devices by the maintainer before merging or publishing.

## Adding a New Package

1. Create `packages/<name>/` with `src/index.ts`, `package.json`, and `project.json`. Set `publishConfig.access: "public"` in `package.json`, otherwise the scoped package is published as restricted.
2. The rollup config will auto-discover it (requires `package.json` + `src/index.ts`)
3. Follow existing `project.json` structure for Nx targets (build, typecheck, lint, test, stylelint)
4. Add it to the docs site: `apps/docs/data.ts`, `pages/<slug>.tsx`, `<slug>.mdx`, demos, Styles API data, the styles import in `pages/_app.tsx`, the dependency in `apps/docs/package.json`, and the component path in `scripts/docgen.ts`
5. Add stories and UI tests (cases first in `docs/ui-test-plan.md`)
