const fs = require('fs');
const path = require('path');

// Let's create a bundle or parse the locales files directly
const enContent = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.ts'), 'utf8');
const taContent = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/ta.ts'), 'utf8');
const knContent = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/kn.ts'), 'utf8');
const hiContent = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/hi.ts'), 'utf8');

function cleanToObj(tsContent) {
  const jsonStr = tsContent
    .replace(/^export const \w+ =\s*/m, '')
    .replace(/} as const;\s*$/m, '}')
    .replace(/\/\/[^\n]*/g, ''); // strip single line comments
  
  // Use Function to safely evaluate object literal
  return new Function(`return (${jsonStr});`)();
}

let enObj, taObj, knObj, hiObj;
try {
  enObj = cleanToObj(enContent);
  taObj = cleanToObj(taContent);
  knObj = cleanToObj(knContent);
  hiObj = cleanToObj(hiContent);
  console.log('Successfully evaluated all 4 locale objects!');
} catch (e) {
  console.error('Error evaluating locale objects:', e);
  process.exit(1);
}

const translations = { en: enObj, ta: taObj, kn: knObj, hi: hiObj };

function getTranslation(lang, key) {
  const keys = key.split('.');
  let val = translations[lang]?.[key];
  if (val !== undefined && typeof val === 'string') return val;

  let nested = translations[lang];
  for (const k of keys) {
    if (nested && typeof nested === 'object' && k in nested) {
      nested = nested[k];
    } else {
      nested = undefined;
      break;
    }
  }
  if (typeof nested === 'string') return nested;

  return undefined;
}

// Find all t('key') calls in files
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

const files = walkDir(path.join(__dirname, '../src'));
const missingReport = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(path.join(__dirname, '..'), file);

  const regex = /t\(\s*['"]([a-zA-Z0-9_.-]+)['"](?:\s*,\s*(?:\{[^}]*\}|'([^']*)'|"([^"]*)"|`([^`]*)`))?(?:\s*,\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`))?\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const enVal = getTranslation('en', key);
    const taVal = getTranslation('ta', key);
    const knVal = getTranslation('kn', key);
    const hiVal = getTranslation('hi', key);

    const fallback = match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || key;

    if (!enVal || !taVal || !knVal || !hiVal) {
      missingReport.push({
        file: relFile,
        key,
        fallback,
        en: !!enVal,
        ta: !!taVal,
        kn: !!knVal,
        hi: !!hiVal
      });
    }
  }
});

console.log(`Total true missing translations count: ${missingReport.length}`);
const uniqueKeys = new Map();
missingReport.forEach(item => {
  if (!uniqueKeys.has(item.key)) {
    uniqueKeys.set(item.key, { key: item.key, fallback: item.fallback, missingIn: { en: !item.en, ta: !item.ta, kn: !item.kn, hi: !item.hi } });
  }
});

console.log(`Unique missing keys: ${uniqueKeys.size}`);
fs.writeFileSync(path.join(__dirname, 'true_missing_keys.json'), JSON.stringify(Array.from(uniqueKeys.values()), null, 2));
