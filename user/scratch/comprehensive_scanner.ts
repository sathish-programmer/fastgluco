import fs from 'fs';
import path from 'path';
import { getTranslation, translations } from '../src/i18n/locales';

function walk(dir: string): string[] {
  let files: string[] = [];
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

const allFiles = walk(path.join(process.cwd(), 'src'));

// 1. Audit all t('key') calls
const tCalls: { key: string; file: string; line: number }[] = [];
const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    let m;
    while ((m = tRegex.exec(line)) !== null) {
      tCalls.push({ key: m[1], file: path.relative(process.cwd(), file), line: idx + 1 });
    }
  });
});

console.log(`Found ${tCalls.length} t(...) calls across codebase.`);

// 2. Audit meta arrays (labelKey, riskKey)
const metaKeys: { key: string; file: string; line: number }[] = [];
const metaRegex = /(labelKey|riskKey)\s*:\s*['"]([^'"]+)['"]/g;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    let m;
    while ((m = metaRegex.exec(line)) !== null) {
      metaKeys.push({ key: m[2], file: path.relative(process.cwd(), file), line: idx + 1 });
    }
  });
});

console.log(`Found ${metaKeys.length} labelKey/riskKey declarations.`);

// Combine all candidate keys
const allTestedKeys = new Map<string, string[]>();
tCalls.forEach(c => {
  if (!allTestedKeys.has(c.key)) allTestedKeys.set(c.key, []);
  allTestedKeys.get(c.key)!.push(`${c.file}:${c.line}`);
});
metaKeys.forEach(c => {
  if (!allTestedKeys.has(c.key)) allTestedKeys.set(c.key, []);
  allTestedKeys.get(c.key)!.push(`${c.file}:${c.line}`);
});

const missingInEn: string[] = [];
const missingInTa: string[] = [];
const missingInTe: string[] = [];
const missingInKn: string[] = [];
const missingInHi: string[] = [];

for (const [key, files] of allTestedKeys.entries()) {
  const enVal = getTranslation('en', key);
  if (enVal === key) {
    missingInEn.push(key);
  }
  const taVal = getTranslation('ta', key);
  if (taVal === key || taVal === enVal && enVal !== '' && !/^[0-9\s:.,%/-]+$/.test(enVal)) {
    // untranslated in TA if it returns key or returns English text
    missingInTa.push(key);
  }
  const teVal = getTranslation('te', key);
  if (teVal === key || teVal === enVal && enVal !== '' && !/^[0-9\s:.,%/-]+$/.test(enVal)) {
    missingInTe.push(key);
  }
  const knVal = getTranslation('kn', key);
  if (knVal === key || knVal === enVal && enVal !== '' && !/^[0-9\s:.,%/-]+$/.test(enVal)) {
    missingInKn.push(key);
  }
  const hiVal = getTranslation('hi', key);
  if (hiVal === key || hiVal === enVal && enVal !== '' && !/^[0-9\s:.,%/-]+$/.test(enVal)) {
    missingInHi.push(key);
  }
}

console.log('\n--- AUDIT RESULTS ---');
console.log(`Total Unique Keys checked: ${allTestedKeys.size}`);
console.log(`Missing completely in EN: ${missingInEn.length}`);
console.log(`Untranslated in TA: ${missingInTa.length}`);
console.log(`Untranslated in TE: ${missingInTe.length}`);
console.log(`Untranslated in KN: ${missingInKn.length}`);
console.log(`Untranslated in HI: ${missingInHi.length}`);

fs.writeFileSync(
  path.join(process.cwd(), 'scratch/comprehensive_audit_report.json'),
  JSON.stringify({
    missingInEn,
    missingInTa,
    missingInTe,
    missingInKn,
    missingInHi,
    filesForKey: Object.fromEntries(allTestedKeys)
  }, null, 2)
);

console.log('\nTop 20 missing completely in EN:');
console.log(missingInEn.slice(0, 20));

console.log('\nTop 20 untranslated in TA:');
console.log(missingInTa.slice(0, 20));
