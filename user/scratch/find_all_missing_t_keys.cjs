const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

function extractExistingKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  const lines = content.split('\n');
  for (const line of lines) {
    const keyMatch = line.match(/^\s*["']?([a-zA-Z0-9_.-]+)["']?:\s*["'`]/);
    if (keyMatch) {
      keys.add(keyMatch[1]);
    }
  }
  return keys;
}

const existingEn = extractExistingKeys(enPath);

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('scratch') && !fullPath.includes('client-modules-reference')) {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
      if (!file.includes('/i18n/locales/')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const allFiles = walkDir(path.join(__dirname, '../src'));

const missingFromEn = new Map();

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match t('key', 'fallback') or t('key', {params}, 'fallback') or t('key')
  const regex = /t\(\s*['"]([a-zA-Z0-9_.-]+)['"](?:\s*,\s*(?:\{[^}]*\}|'([^']*)'|"([^"]*)`|`([^`]*)`))?(?:\s*,\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`))?\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (!existingEn.has(key)) {
      let fallback = match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || key;
      missingFromEn.set(key, fallback);
    }
  }
});

console.log(`Found ${missingFromEn.size} missing t() keys across codebase.`);
fs.writeFileSync(path.join(__dirname, 'missing_t_keys.json'), JSON.stringify(Object.fromEntries(missingFromEn), null, 2));
