const fs = require('fs');
const path = require('path');

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

const allFiles = walk('./src');

const results = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Look for JSX text or buttons with plain English text without t(
    // E.g. >Some English text<
    const jsxTextMatches = trimmed.match(/>([^<>{}\$\`]+)</g);
    if (jsxTextMatches) {
      jsxTextMatches.forEach(m => {
        const text = m.slice(1, -1).trim();
        // Ignore single symbols, numbers, punctuation, empty, or short tags
        if (text.length > 3 && !/^[\d\s\.\:\,\-\+\%\/\(\)\#\@\|\*]+$/.test(text) && !/^[A-Z0-9_-]+$/.test(text)) {
          // If it looks like user-facing English words (e.g. contains spaces, common words)
          if (/[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/.test(text) && !line.includes('//') && !line.includes('console.')) {
            results.push({ file: path.relative('./user', file), line: idx + 1, text, code: trimmed });
          }
        }
      });
    }
  });
});

console.log('Total potential hardcoded JSX phrases found:', results.length);

// Group by file
const byFile = {};
results.forEach(r => {
  if (!byFile[r.file]) byFile[r.file] = [];
  byFile[r.file].push(r);
});

Object.keys(byFile).forEach(f => {
  console.log(`\n=== ${f} (${byFile[f].length}) ===`);
  byFile[f].slice(0, 10).forEach(item => {
    console.log(`  L${item.line}: "${item.text}"`);
  });
  if (byFile[f].length > 10) console.log(`  ... and ${byFile[f].length - 10} more`);
});
