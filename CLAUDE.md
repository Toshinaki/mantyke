# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mantyke is a monorepo of Mantine UI extension components. It uses pnpm workspaces with Nx orchestration. Currently contains one package: `@mantyke/spotlight-image` (image viewer with zoom, pan, fullscreen).

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

# Type check
pnpm run typecheck

# Lint (ESLint + Stylelint)
pnpm run lint

# Format
pnpm run prettier:write

# Start docs dev server
pnpm run dev

# Start Storybook
pnpm run storybook
```

## Architecture

- **Monorepo structure**: Root `package.json` has workspace scripts; each package under `packages/` has its own `package.json` and `project.json` (Nx config).
- **Build pipeline**: `rollup.config.mjs` at root auto-discovers packages via `scripts/utils.mjs` (scans `packages/` for dirs with `package.json` + `src/index.ts`). Outputs ESM (`.mjs`), CJS (`.cjs`), and CSS with hashed selectors (`hash-css-selector` with `mantyke` prefix). Non-index chunks get `'use client'` banner.
- **Component pattern**: Components follow the Mantine `factory()` pattern with `useProps` and `useStyles`. They export the component, its Props type, Factory type, StylesNames, and CssVariables from `src/index.ts`.
- **CSS Modules**: Components use `.module.css` files, processed by PostCSS with `postcss-preset-mantine`. Class names are scoped via `hash-css-selector`.
- **Testing**: Jest with `jsdom` environment, `esbuild-jest` transform, CSS mocked via `identity-obj-proxy`. Tests use `@testing-library/react` and `@mantine-tests/core`. Test files are co-located: `<component>.test.tsx`.
- **Stories**: Co-located Storybook stories: `<component>.story.tsx`.
- **Peer dependencies**: Packages depend on `@mantine/core`, `@mantine/hooks`, `@tabler/icons-react`, `clsx`, `react`, `react-dom` as peers.
- **Versioning**: Changesets for version management. Releases publish to npm via `pnpm changeset publish`.
- **Default branch**: `master` (Nx `defaultBase`).

## Adding a New Package

1. Create `packages/<name>/` with `src/index.ts`, `package.json`, and `project.json`
2. The rollup config will auto-discover it (requires `package.json` + `src/index.ts`)
3. Follow existing `project.json` structure for Nx targets (build, typecheck, lint, test, stylelint)
