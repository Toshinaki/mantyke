# Mantyke

A collection of Mantine UI extension components built with TypeScript, organized as a pnpm monorepo with Nx orchestration.

## Packages

- **[@mantyke/spotlight-image](./packages/spotlight-image)** - Interactive image component with zoom and pan functionality

## Tech Stack

- **Package Manager**: pnpm with workspaces
- **Build Orchestration**: Nx
- **Build Tool**: Rollup with TypeScript
- **Version Management**: Changesets
- **Documentation**: Next.js
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint with TypeScript ESLint
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm run build
```

### Development

```bash
# Start documentation site (with hot reload)
pnpm run dev

# Start Storybook
pnpm run storybook

# Run tests
pnpm run test

# Run linting
pnpm run lint

# Type check
pnpm run typecheck
```

## Project Structure

```
.
├── apps/
│   └── docs/              # Next.js documentation site
├── packages/
│   └── spotlight-image/   # Component packages
├── scripts/               # Build and utility scripts
└── .github/workflows/     # CI/CD workflows
```

## Available Scripts

### Root Level

- `pnpm run build` - Build all packages
- `pnpm run clean` - Clean all build outputs
- `pnpm run dev` - Start docs dev server
- `pnpm run test` - Run all tests with linting
- `pnpm run lint` - Lint all projects
- `pnpm run typecheck` - Type check all projects
- `pnpm run docgen` - Generate component documentation
- `pnpm run docs:build` - Build documentation site
- `pnpm run storybook` - Start Storybook

### Nx Commands

```bash
# Build specific package
pnpm nx build @mantyke/spotlight-image

# Run tests for specific package
pnpm nx test @mantyke/spotlight-image

# Build all packages except docs
pnpm nx run-many -t build --exclude=mantyke-docs

# See affected projects
pnpm nx affected:graph
```

## Adding a New Package

1. Create package structure:
```bash
mkdir -p packages/my-component/src
```

2. Add `package.json`:
```json
{
  "name": "@mantyke/my-component",
  "version": "0.1.0",
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
    "react": "^18.x || ^19.x"
  }
}
```

3. Add `project.json` for Nx:
```json
{
  "name": "@mantyke/my-component",
  "root": "packages/my-component",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "command": "pnpm run build",
        "cwd": "{workspaceRoot}"
      }
    }
  }
}
```

4. Create component and run:
```bash
pnpm install
pnpm run build
```

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

### Creating a Changeset

```bash
# Add changeset for your changes
pnpm changeset

# Follow prompts to select packages and bump type
# - patch: bug fixes
# - minor: new features
# - major: breaking changes
```

### Publishing

Releases are automated via GitHub Actions when changesets are merged to master:

1. Create changeset on your feature branch
2. Commit changeset file
3. Open PR and get it merged
4. CI will automatically create a "Version Packages" PR
5. Merge the version PR to publish to npm

### Manual Release

```bash
# Version packages based on changesets
pnpm changeset version

# Build and publish
pnpm run build
pnpm changeset publish
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Create a changeset: `pnpm changeset`
6. Submit a pull request

### Code Quality

All PRs must pass:
- Type checking
- Linting (ESLint + Stylelint)
- Unit tests
- Build validation

## License

MIT

## Links

- [Documentation] (wip)
- [Mantine UI](https://mantine.dev)