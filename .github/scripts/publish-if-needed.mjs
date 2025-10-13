import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgJsonPath = resolve(__dirname, '../../package.json');
const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));

const packageName = pkg.name;
const packageVersion = pkg.version;

function versionExists(name, version) {
  try {
    execSync(`npm view ${name}@${version} version --json`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const publishArgs = process.env.NPM_PUBLISH_ARGS || '--provenance --access public';

if (versionExists(packageName, packageVersion)) {
  console.log(`Version ${packageVersion} of ${packageName} already exists on npm. Skipping publish.`);
  process.exit(0);
}

console.log(`Publishing ${packageName}@${packageVersion}...`);
execSync(`npm publish ${publishArgs}`, { stdio: 'inherit' });
console.log('Publish complete.');


