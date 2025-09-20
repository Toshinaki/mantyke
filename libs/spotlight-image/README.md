# Mantyke

[![npm version](https://badge.fury.io/js/@mantyke%2Fspotlight-image.svg)](https://badge.fury.io/js/@mantyke%2Fspotlight-image)
[![npm downloads](https://img.shields.io/npm/dm/@mantyke/spotlight-image)](https://www.npmjs.com/package/@mantyke/spotlight-image)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mantyke/spotlight-image)](https://bundlephobia.com/package/@mantyke/spotlight-image)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/Toshinaki/mantyke/workflows/CI/badge.svg)](https://github.com/Toshinaki/mantyke/actions)

React component library extending Mantine UI with additional components for enhanced user interfaces.

## Packages

- [`@mantyke/spotlight-image`](./libs/spotlight-image) - Image viewer with zoom, pan, and fullscreen capabilities

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
```

### Commands

```bash
# Start Storybook for all components
pnpm nx storybook spotlight-image

# Run tests
pnpm nx test spotlight-image

# Build packages
pnpm nx build spotlight-image

# Lint and type check
pnpm nx run-many -t lint typecheck

# Run all tasks for all projects
pnpm nx run-many -t lint test build

# Show project graph
pnpm nx graph

# Show affected projects
pnpm nx affected:graph

# Reset Nx cache
pnpm nx reset

# Create changeset for release
pnpm changeset
```

## Publishing

This repository uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

1. Create changeset: `pnpm changeset`
2. Commit and push changes
3. Merge the generated "Version Packages" PR to publish

## Contributing

1. Create component in `libs/` directory
2. Add Storybook stories
3. Write tests
4. Create changeset
5. Submit PR

## License

MIT