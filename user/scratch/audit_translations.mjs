import fs from 'fs';
import path from 'path';
import { translations, getTranslation } from './bundle_locales.mjs';

const locales = ['en', 'ta', 'te', 'kn', 'hi'];

// 1. Scan src/ for all t('key') or t("key")
const srcDir = path.resolve('src');
const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_\.\-]+)['"]/g;
const usedKeys = new Set();
const keyToFiles = {};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'locales' || entry.name === 'scratch' || entry.name === 'dist') continue;
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      while ((match = keyRegex.exec(content)) !== null) {
        const key = match[1];
        usedKeys.add(key);
        if (!keyToFiles[key]) keyToFiles[key] = [];
        keyToFiles[key].push(path.relative(srcDir, fullPath));
      }
    }
  }
}

scanDir(srcDir);
console.log(`Scanned src/. Found ${usedKeys.size} distinct keys used in t('...').`);

// 2. Helper to check if key exists in a locale object (flat or nested)
function keyResolvesInLocale(localeObj, key) {
  if (localeObj[key] !== undefined && typeof localeObj[key] === 'string') {
    return true;
  }
  const parts = key.split('.');
  let curr = localeObj;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) {
      curr = curr[p];
    } else {
      return false;
    }
  }
  return typeof curr === 'string';
}

const missingByLocale = { en: [], ta: [], te: [], kn: [], hi: [] };

for (const key of Array.from(usedKeys).sort()) {
  for (const loc of locales) {
    if (!keyResolvesInLocale(translations[loc], key)) {
      missingByLocale[loc].push(key);
    }
  }
}

console.log('\n--- MISSING KEYS REPORT ---');
for (const loc of locales) {
  console.log(`[${loc}] Missing ${missingByLocale[loc].length} keys.`);
}

if (missingByLocale.en.length > 0) {
  console.log(`\nUnique keys missing from en (${missingByLocale.en.length}):`);
  for (const k of missingByLocale.en) {
    console.log(`  "${k}": used in ${keyToFiles[k]?.slice(0, 2).join(', ')}`);
  }
}

// 3. Also check if there is any key present in en that is missing from ta/te/kn/hi
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const allEnKeys = new Set(getAllKeys(translations.en));
console.log(`\nTotal keys in translations.en (nested + flat): ${allEnKeys.size}`);

for (const loc of ['ta', 'te', 'kn', 'hi']) {
  const locKeys = new Set(getAllKeys(translations[loc]));
  const missingFromLoc = [...allEnKeys].filter(k => !locKeys.has(k));
  const extraInLoc = [...locKeys].filter(k => !allEnKeys.has(k));
  console.log(`[${loc}] Total keys: ${locKeys.size}. Missing vs en: ${missingFromLoc.length}. Extra vs en: ${extraInLoc.length}`);
}
