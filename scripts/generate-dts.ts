import path from 'node:path';
import fs from 'fs-extra';
import signale from 'signale';
import { $ } from 'zx';
import { getPackages } from './utils.mjs';

const packages = getPackages();

async function generateDts() {
  try {
    await $`pnpm tsc --project tsconfig.build.json`;

    for (const pkg of packages) {
      const tempPath = path.join(process.cwd(), `temp/types/packages/${pkg}/src`);
      const targetDir = path.join(process.cwd(), `packages/${pkg}/dist/types`);

      if (fs.existsSync(tempPath)) {
        await fs.ensureDir(targetDir);
        await fs.copy(tempPath, targetDir);

        // Copy index.d.ts to index.d.mts
        const indexDts = path.join(targetDir, 'index.d.ts');
        const indexDmts = path.join(targetDir, 'index.d.mts');
        if (fs.existsSync(indexDts)) {
          await fs.copy(indexDts, indexDmts);
        }
      }
    }

    // Clean temp directory
    await fs.remove(path.join(process.cwd(), 'temp'));
  } catch (err) {
    signale.error('Failed to generate d.ts files');
    signale.error(err);
    process.exit(1);
  }
}

generateDts();
