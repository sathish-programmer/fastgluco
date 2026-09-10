const fs = require('fs');
const path = require('path');

// Load locales
const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple regex parser for JS object keys
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

const enKeys = extractKeys(enPath);
const taKeys = extractKeys(taPath);
const knKeys = extractKeys(knPath);
const hiKeys = extractKeys(hiPath);

console.log(`Loaded keys: EN=${enKeys.size}, TA=${taKeys.size}, KN=${knKeys.size}, HI=${hiKeys.size}`);

// Scan all tsx/jsx files in user/src
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
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = walkDir(path.join(__dirname, '../src'));

const missingKeys = [];
const suspiciousRawStrings = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(path.join(__dirname, '..'), file);

  // 1. Find all t('key', ...) calls
  const tRegex = /t\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    const inEn = enKeys.has(key);
    const inTa = taKeys.has(key);
    const inKn = knKeys.has(key);
    const inHi = hiKeys.has(key);

    if (!inEn || !inTa || !inKn || !inHi) {
      missingKeys.push({
        file: relPath,
        key,
        missingIn: {
          en: !inEn,
          ta: !inTa,
          kn: !inKn,
          hi: !inHi
        }
      });
    }
  }

  // 2. Find suspicious raw JSX text (e.g. >Some English Text<)
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Look for JSX text between > and <
    const rawMatches = line.match(/>([^<>{}\n]+)</g);
    if (rawMatches) {
      rawMatches.forEach(m => {
        const text = m.replace(/[><]/g, '').trim();
        // Ignore pure numbers, punctuation, short code tokens
        if (text.length > 2 && /[a-zA-Z]{3,}/.test(text) && !text.startsWith('http') && !text.startsWith('data:') && !text.includes('className') && !text.includes('import ') && !text.includes('export ')) {
          suspiciousRawStrings.push({
            file: relPath,
            line: idx + 1,
            text
          });
        }
      });
    }

    // Look for suspicious raw string props: placeholder="...", label="...", sublabel="..."
    const propMatches = line.match(/\b(placeholder|label|sublabel|title)\s*=\s*"([^"]+)"/g);
    if (propMatches) {
      propMatches.forEach(m => {
        const text = m.replace(/\b(placeholder|label|sublabel|title)\s*=\s*"/, '').replace(/"$/, '').trim();
        if (text.length > 2 && /[a-zA-Z]{3,}/.test(text) && !text.startsWith('http')) {
          suspiciousRawStrings.push({
            file: relPath,
            line: idx + 1,
            text: `[PROP] ${m}`
          });
        }
      });
    }
  });
});

console.log(`\n=== MISSING TRANSLATION KEYS (${missingKeys.length}) ===`);
const uniqueMissing = {};
missingKeys.forEach(m => {
  if (!uniqueMissing[m.key]) {
    uniqueMissing[m.key] = { key: m.key, files: [m.file], missingIn: m.missingIn };
  } else {
    if (!uniqueMissing[m.key].files.includes(m.file)) {
      uniqueMissing[m.key].files.push(m.file);
    }
  }
});
console.log(JSON.stringify(Object.values(uniqueMissing), null, 2));

console.log(`\n=== SUSPICIOUS RAW STRINGS (${suspiciousRawStrings.length}) ===`);
fs.writeFileSync(path.join(__dirname, 'raw_strings_report.json'), JSON.stringify(suspiciousRawStrings, null, 2));
console.log(`Wrote raw strings report to raw_strings_report.json (${suspiciousRawStrings.length} items)`);
