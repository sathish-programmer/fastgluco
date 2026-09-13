import fs from 'fs';
import path from 'path';
import { translations } from './bundle_locales.mjs';

const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_\.\-]+)['"]/g;
const srcDir = path.resolve('src');
const usedKeys = new Set();
const keyToFiles = {};

function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['locales', 'scratch', 'dist'].includes(entry.name)) continue;
      scanDir(full);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(full, 'utf8');
      let m;
      while ((m = keyRegex.exec(content)) !== null) {
        usedKeys.add(m[1]);
        if (!keyToFiles[m[1]]) keyToFiles[m[1]] = [];
        keyToFiles[m[1]].push(path.relative(srcDir, full));
      }
    }
  }
}
scanDir(srcDir);

function keyResolves(obj, key) {
  if (obj[key] !== undefined && typeof obj[key] === 'string') return true;
  const parts = key.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) curr = curr[p];
    else return false;
  }
  return typeof curr === 'string';
}

const missing = [];
for (const k of Array.from(usedKeys).sort()) {
  if (!keyResolves(translations.en, k)) {
    missing.push({ key: k, files: [...new Set(keyToFiles[k])] });
  }
}
fs.writeFileSync('scratch/missing_keys.json', JSON.stringify(missing, null, 2));
console.log('Written ' + missing.length + ' missing keys to scratch/missing_keys.json');
