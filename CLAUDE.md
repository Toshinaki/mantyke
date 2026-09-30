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
- **UI tests**: `<component>.ui-test.story.tsx` stories with `play` functions, run by `@storybook/addon-vitest` in Chromium (`vitest.config.ts`). Cases are designed from user experience in `docs/ui-test-plan.md`; when the code disagrees with a case, treat it as a likely bug instead of adjusting the case. Shared helpers and fixture specs live in `.storybook/`. `vitest.config.ts` is excluded from Nx target inference (`nx.json`) so UI tests stay out of `nx run-many -t test`.
- **Docs site**: `apps/docs/data.ts` lists the packages; `/` is the overview, each package has `pages/<slug>.tsx` + `<slug>.mdx`, demos in `demos/`, Styles API data in `styles-api/`. Props tables come from `scripts/docgen.ts`.
- **Peer dependencies**: Packages depend on `@mantine/core`, `@mantine/hooks`, `@tabler/icons-react`, `clsx`, `react`, `react-dom` as peers.
- **Dependency consistency**: syncpack also checks `pnpm.overrides`; `react` / `react-dom` are pinned globally there to avoid duplicate React copies in tests.
- **Default branch**: `master` (Nx `defaultBase`).

## CI and Release

- **Required checks**: the `Merge Protection` ruleset on `master` requires `Validate PR` and `UI Tests` (both from `pr.yml`) to pass.
- **Versioning**: Changesets. Merging a PR with changesets makes the Release workflow open a "Version Packages" PR; merging that PR publishes to npm.
- **Release workflow** (`release.yml`): runs after master CI succeeds. It creates the Version Packages PR with a GitHub App token (secrets `RELEASE_APP_ID`, `RELEASE_APP_PRIVATE_KEY`; the App needs Contents, Pull requests and Workflows read/write) so that PR checks run on it. Publishing uses npm trusted publishing (OIDC) with provenance via `NPM_CONFIG_PROVENANCE`. Do not add flags to `changeset publish`; since 2.31 it rejects unknown flags.
- **Major updates**: dependency major bumps and major releases must be confirmed on real devices by the maintainer before merging or publishing.

## Adding a New Package

1. Create `packages/<name>/` with `src/index.ts`, `package.json`, and `project.json`. Set `publishConfig.access: "public"` in `package.json`, otherwise the scoped package is published as restricted.
2. The rollup config will auto-discover it (requires `package.json` + `src/index.ts`)
3. Follow existing `project.json` structure for Nx targets (build, typecheck, lint, test, stylelint)
4. Add it to the docs site: `apps/docs/data.ts`, `pages/<slug>.tsx`, `<slug>.mdx`, demos, Styles API data, the styles import in `pages/_app.tsx`, the dependency in `apps/docs/package.json`, and the component path in `scripts/docgen.ts`
5. Add stories and UI tests (cases first in `docs/ui-test-plan.md`)
