const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const langs = ['en', 'ta', 'te', 'kn', 'hi'];

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  const lines = content.split('\n');
  let currentParent = null;

  for (const line of lines) {
    const parentMatch = line.match(/^\s*["']?([a-zA-Z0-9_-]+)["']?:\s*\{/);
    if (parentMatch) {
      currentParent = parentMatch[1];
      continue;
    }
    if (line.match(/^\s*\},?/)) {
      currentParent = null;
      continue;
    }
    const keyMatch = line.match(/^\s*["']?([a-zA-Z0-9_.-]+)["']?:\s*["'`]/);
    if (keyMatch) {
      const k = keyMatch[1];
      keys.add(k);
      if (currentParent) {
        keys.add(`${currentParent}.${k}`);
      }
    }
  }
  return keys;
}

const keySets = {};
langs.forEach(lang => {
  keySets[lang] = extractKeys(path.join(localesDir, `${lang}.ts`));
});

console.log('--- LOCALE KEY COUNTS ---');
langs.forEach(lang => {
  console.log(`${lang.toUpperCase()}: ${keySets[lang].size} keys`);
});

// Compare all keys against EN
const enKeys = keySets['en'];
let totalMissing = 0;

langs.forEach(lang => {
  if (lang === 'en') return;
  const currentSet = keySets[lang];
  const missingFromCurrent = [];
  for (const k of enKeys) {
    if (!currentSet.has(k)) {
      missingFromCurrent.push(k);
    }
  }
  console.log(`Missing in ${lang.toUpperCase()}: ${missingFromCurrent.length}`);
  if (missingFromCurrent.length > 0) {
    console.log(`Sample missing in ${lang.toUpperCase()}:`, missingFromCurrent.slice(0, 5));
    totalMissing += missingFromCurrent.length;
  }
});

console.log('\n--- PARITY VERIFICATION ---');
if (totalMissing === 0) {
  console.log('PARITY: 100% PASS (0 missing keys across all 5 languages)');
} else {
  console.log(`PARITY: FAIL (${totalMissing} missing keys total)`);
  process.exit(1);
}
