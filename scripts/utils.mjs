import path from 'node:path';
import fs from 'fs-extra';

export function getPackages() {
  const packagesDir = path.join(process.cwd(), 'packages');
  return fs.readdirSync(packagesDir).filter((dir) => {
    const packagePath = path.join(packagesDir, dir);
    return (
      fs.statSync(packagePath).isDirectory() &&
      fs.existsSync(path.join(packagePath, 'package.json')) &&
      fs.existsSync(path.join(packagePath, 'src/index.ts'))
    );
  });
}
