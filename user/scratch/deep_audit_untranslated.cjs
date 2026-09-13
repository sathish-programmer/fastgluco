const fs = require('fs');
const path = require('path');

// Read en.ts via fs

// We can extract keys from en.ts by reading it as text
const enContent = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.ts'), 'utf8');
const enKeys = new Set();
const keyRegex = /"([^"]+)"\s*:\s*/g;
let match;
while ((match = keyRegex.exec(enContent)) !== null) {
  enKeys.add(match[1]);
}

console.log('Loaded', enKeys.size, 'keys from en.ts');

function walk(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', 'scratch'].includes(f)) {
        files = files.concat(walk(p));
      }
    } else if (/\.(tsx|ts)$/.test(f) && !f.endsWith('.d.ts') && !f.includes('locales')) {
      files.push(p);
    }
  });
  return files;
}

const allFiles = walk(path.join(__dirname, '../src'));

// 1. Find all t('key') usages where key is not in enKeys
const missingTKeys = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
  let m;
  while ((m = tRegex.exec(content)) !== null) {
    const k = m[1];
    if (!enKeys.has(k)) {
      missingTKeys.push({ file: path.relative(path.join(__dirname, '..'), file), key: k });
    }
  }
});

console.log('\n--- MISSING t(...) KEYS IN en.ts ---');
const uniqueMissing = {};
missingTKeys.forEach(item => {
  if (!uniqueMissing[item.key]) uniqueMissing[item.key] = [];
  uniqueMissing[item.key].push(item.file);
});
console.log('Total unique missing t() keys:', Object.keys(uniqueMissing).length);
Object.keys(uniqueMissing).forEach(k => {
  console.log(`  ${k} -> in ${uniqueMissing[k].join(', ')}`);
});

// 2. Find labelKey / riskKey definitions in modules
const missingMetaKeys = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const metaRegex = /(labelKey|riskKey)\s*:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = metaRegex.exec(content)) !== null) {
    const k = m[2];
    if (!enKeys.has(k)) {
      missingMetaKeys.push({ file: path.relative(path.join(__dirname, '..'), file), key: k });
    }
  }
});

console.log('\n--- MISSING labelKey/riskKey IN en.ts ---');
const uniqueMissingMeta = {};
missingMetaKeys.forEach(item => {
  if (!uniqueMissingMeta[item.key]) uniqueMissingMeta[item.key] = [];
  uniqueMissingMeta[item.key].push(item.file);
});
console.log('Total unique missing meta keys:', Object.keys(uniqueMissingMeta).length);
Object.keys(uniqueMissingMeta).forEach(k => {
  console.log(`  ${k} -> in ${uniqueMissingMeta[k].join(', ')}`);
});
