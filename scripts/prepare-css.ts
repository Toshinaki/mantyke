import path from 'node:path';
import fs from 'fs-extra';
import { getPackages } from './utils.mjs';

const packages = getPackages();
for (const pkg of packages) {
  const rollupCssFilePath = path.join(process.cwd(), `packages/${pkg}/dist/esm/index.css`);

  if (!fs.existsSync(rollupCssFilePath)) {
    continue; // Skip if no CSS file
  }

  const content = fs.readFileSync(rollupCssFilePath, 'utf-8');

  fs.writeFileSync(path.join(process.cwd(), `packages/${pkg}/dist/styles.css`), content);
  fs.writeFileSync(
    path.join(process.cwd(), `packages/${pkg}/dist/styles.layer.css`),
    `@layer mantine {${content}}`
  );

  fs.removeSync(rollupCssFilePath);

  const cjsCssPath = path.join(process.cwd(), `packages/${pkg}/dist/cjs/index.css`);
  if (fs.existsSync(cjsCssPath)) {
    fs.removeSync(cjsCssPath);
  }
}
