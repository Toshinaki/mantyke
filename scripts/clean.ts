import { rimraf } from 'rimraf';
import { getPackages } from './utils.mjs';

async function clean() {
  const packages = getPackages();
  await Promise.all(packages.map((pkg) => rimraf(`packages/${pkg}/dist`)));
}

clean();
